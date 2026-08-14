import { Ledger } from "./managed/age_gate/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type AgeGatePrivateState = {
  readonly age: number;
};

export const createAgeGatePrivateState = (age: number): AgeGatePrivateState => ({
  age,
});

export const witnesses = {
  localAge: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    number,
  ] => [privateState, privateState.age],
};
