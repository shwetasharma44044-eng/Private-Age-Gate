import {
  AgeGateAPI,
  type AgeGateCircuitKeys,
  type AgeGateProviders,
  type DeployedAgeGateAPI,
  ageGatePrivateStateKey,
} from '../../../api/src/index';
import { type ContractAddress, fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import semver from 'semver';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { type AgeGatePrivateState } from '../../../contract/src/index';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';

export interface InProgressAgeGateDeployment {
  readonly status: 'in-progress';
}

export interface DeployedAgeGateDeployment {
  readonly status: 'deployed';
  readonly api: DeployedAgeGateAPI;
}

export interface FailedAgeGateDeployment {
  readonly status: 'failed';
  readonly error: Error;
}

export type AgeGateDeployment = InProgressAgeGateDeployment | DeployedAgeGateDeployment | FailedAgeGateDeployment;

export interface DeployedAgeGateAPIProvider {
  readonly ageGateDeployments$: Observable<Array<Observable<AgeGateDeployment>>>;
  readonly resolve: (contractAddress?: ContractAddress) => Observable<AgeGateDeployment>;
}

export class BrowserDeployedAgeGateManager implements DeployedAgeGateAPIProvider {
  readonly #deploymentsSubject: BehaviorSubject<Array<BehaviorSubject<AgeGateDeployment>>>;
  #initializedProviders: Promise<AgeGateProviders> | undefined;

  constructor(private readonly logger: Logger) {
    this.#deploymentsSubject = new BehaviorSubject<Array<BehaviorSubject<AgeGateDeployment>>>([]);
    this.ageGateDeployments$ = this.#deploymentsSubject;
  }

  readonly ageGateDeployments$: Observable<Array<Observable<AgeGateDeployment>>>;

  resolve(contractAddress?: ContractAddress): Observable<AgeGateDeployment> {
    const deployments = this.#deploymentsSubject.value;
    let deployment = deployments.find(
      (d) => d.value.status === 'deployed' && d.value.api.deployedContractAddress === contractAddress,
    );

    if (deployment) {
      return deployment;
    }

    deployment = new BehaviorSubject<AgeGateDeployment>({
      status: 'in-progress',
    });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress);
    } else {
      void this.deployDeployment(deployment);
    }

    this.#deploymentsSubject.next([...deployments, deployment]);
    return deployment;
  }

  private getProviders(): Promise<AgeGateProviders> {
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  private async deployDeployment(deployment: BehaviorSubject<AgeGateDeployment>): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await AgeGateAPI.deploy(providers, this.logger);

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<AgeGateDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await AgeGateAPI.join(providers, contractAddress, this.logger);

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

const initializeProviders = async (logger: Logger): Promise<AgeGateProviders> => {
  const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
  const connectedAPI = await connectToWallet(logger, networkId);
  const zkConfigPath = window.location.origin;
  const keyMaterialProvider = new FetchZkConfigProvider<AgeGateCircuitKeys>(zkConfigPath, fetch.bind(window));
  const config = await connectedAPI.getConfiguration();
  const privateStateProvider = inMemoryPrivateStateProvider<string, AgeGatePrivateState>();
  const shieldedAddresses = await connectedAPI.getShieldedAddresses();
  
  return {
    privateStateProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(config.proverServerUri!, keyMaterialProvider),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        try {
          logger.info({ tx, ttl }, 'Balancing transaction via wallet');
          const serializedTx = toHex(tx.serialize());
          const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (e) {
          logger.error({ error: e }, 'Error balancing transaction via wallet');
          throw e;
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        const txId = txIdentifiers[0];
        logger.info({ txIdentifiers }, 'Submitted transaction via wallet');
        return txId;
      },
    },
  };
};

const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> => {
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Check for wallet connector API');
      }),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Compatible wallet connector API found. Connecting.');
      }),
      take(1),
      timeout({
        first: 10_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');
            return new Error('Could not find Midnight Lace wallet. Extension installed?');
          }),
      }),
      concatMap(async (initialAPI) => {
        const connectedAPI = await initialAPI.connect(networkId);
        const connectionStatus = await connectedAPI.getConnectionStatus();
        logger.info(connectionStatus, 'Wallet connector API enabled status');
        return connectedAPI;
      }),
      timeout({
        first: 10_000,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API has failed to respond');
            return new Error('Midnight Lace wallet has failed to respond. Extension enabled?');
          }),
      }),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              logger.error('Unable to enable connector API: ' + error);
              return new Error('Application is not authorized');
            })
          : apis,
      ),
    ),
  );
};
