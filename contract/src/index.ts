/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

export * from "./managed/age_gate/contract/index.js";
export * from "./witnesses";

import * as CompiledAgeGateContract from "./managed/age_gate/contract/index.js";
import * as Witnesses from "./witnesses";

export const CompiledAgeGateContractContract: any = CompiledContract.make(
  "AgeGate",
  CompiledAgeGateContract.Contract as any,
).pipe(
  (CompiledContract.withWitnesses as any)(Witnesses.witnesses),
  (CompiledContract.withCompiledFileAssets as any)("./managed/age_gate"),
);
