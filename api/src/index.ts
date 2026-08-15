import * as AgeGate from '../../contract/src/managed/age_gate/contract/index.js';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type AgeGateContract,
  type AgeGateDerivedState,
  type AgeGateProviders,
  type DeployedAgeGateContract,
  ageGatePrivateStateKey,
} from './common-types.js';
import { CompiledAgeGateContractContract } from '../../contract/src/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex, fromHex } from '@midnight-ntwrk/midnight-js-utils';
import { type AgeGatePrivateState } from '../../contract/src/witnesses.js';

export interface DeployedAgeGateAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<AgeGateDerivedState>;

  verify: (age: number, threshold: number) => Promise<void>;
}

export class AgeGateAPI implements DeployedAgeGateAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<AgeGateDerivedState>;

  private constructor(
    public readonly deployedContract: DeployedAgeGateContract,
    private readonly providers: AgeGateProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);

    this.state$ = combineLatest([
      providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
        map((contractState) => AgeGate.ledger(contractState.data)),
        tap((ledgerState) =>
          logger?.trace({
            ledgerStateChanged: {
              ledgerState,
            },
          }),
        ),
      ),
      from(providers.privateStateProvider.get(ageGatePrivateStateKey) as Promise<AgeGatePrivateState>),
    ]).pipe(
      map(([ledgerState]) => {
        const userPubKeyHex = providers.walletProvider.getCoinPublicKey();

        let isEligible = false;
        let timestamp: bigint | undefined = undefined;

        if (ledgerState.eligible) {
          for (const [key, val] of ledgerState.eligible) {
            if (toHex(key) === userPubKeyHex) {
              isEligible = val;
              break;
            }
          }
        }

        if (ledgerState.verification_timestamp) {
          for (const [key, val] of ledgerState.verification_timestamp) {
            if (toHex(key) === userPubKeyHex) {
              timestamp = val;
              break;
            }
          }
        }

        return {
          isEligible,
          timestamp,
          userPublicKey: userPubKeyHex,
        };
      }),
    );
  }

  async verify(age: number, threshold: number): Promise<void> {
    this.logger?.info(`Verifying age: ${age} against threshold: ${threshold}`);

    const existingPrivateState = await this.providers.privateStateProvider.get(ageGatePrivateStateKey);
    const updatedPrivateState = {
      ...existingPrivateState,
      age: BigInt(age),
    };
    await this.providers.privateStateProvider.set(ageGatePrivateStateKey, updatedPrivateState);

    const userPubKeyHex = this.providers.walletProvider.getCoinPublicKey();
    const userPubKeyBytes = fromHex(userPubKeyHex);
    const timestamp = BigInt(Date.now());

    const txData = await this.deployedContract.callTx.verifyEligibility(userPubKeyBytes, BigInt(threshold), timestamp);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'verifyEligibility',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  static async deploy(providers: AgeGateProviders, logger?: Logger): Promise<AgeGateAPI> {
    logger?.info('deployContract');

    const deployedAgeGateContract = (await deployContract(providers, {
      compiledContract: CompiledAgeGateContractContract,
      privateStateId: ageGatePrivateStateKey,
      initialPrivateState: { age: 0n },
      args: [],
    })) as unknown as DeployedAgeGateContract;

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedAgeGateContract.deployTxData.public,
      },
    });

    return new AgeGateAPI(deployedAgeGateContract, providers, logger);
  }

  static async join(
    providers: AgeGateProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<AgeGateAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedAgeGateContract = await findDeployedContract<AgeGateContract>(providers, {
      contractAddress,
      compiledContract: CompiledAgeGateContractContract,
      privateStateId: ageGatePrivateStateKey,
      initialPrivateState: await AgeGateAPI.getPrivateState(providers, contractAddress),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedAgeGateContract.deployTxData.public,
      },
    });

    return new AgeGateAPI(deployedAgeGateContract, providers, logger);
  }

  private static async getPrivateState(
    providers: AgeGateProviders,
    contractAddress: ContractAddress,
  ): Promise<AgeGatePrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existingPrivateState = await providers.privateStateProvider.get(ageGatePrivateStateKey);
    return existingPrivateState ?? { age: 0n };
  }
}

export * from './common-types.js';
