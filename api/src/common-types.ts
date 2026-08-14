import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { AgeGatePrivateState, Contract } from '../../contract/src/index';

export const ageGatePrivateStateKey = 'ageGatePrivateState';
export type PrivateStateId = typeof ageGatePrivateStateKey;

export type PrivateStates = {
  readonly ageGatePrivateState: AgeGatePrivateState;
};

export type AgeGateContract = Contract<AgeGatePrivateState>;

export type AgeGateCircuitKeys = Exclude<keyof AgeGateContract['impureCircuits'], number | symbol>;

export type AgeGateProviders = MidnightProviders<AgeGateCircuitKeys, PrivateStateId, AgeGatePrivateState>;

export type DeployedAgeGateContract = FoundContract<AgeGateContract>;

export type AgeGateDerivedState = {
  readonly isEligible: boolean;
  readonly timestamp: bigint | undefined;
  readonly userPublicKey: string;
};
