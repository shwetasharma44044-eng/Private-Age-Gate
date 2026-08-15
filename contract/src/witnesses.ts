import { Ledger } from "./managed/age_gate/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type AgeGatePrivateState = {
  readonly age: bigint;
};

export const createAgeGatePrivateState = (age: bigint): AgeGatePrivateState => ({
  age,
});

export const witnesses = {
  localAge: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    bigint,
  ] => [privateState, privateState.age],
};
