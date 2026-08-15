import { CostModel } from "@midnight-ntwrk/compact-runtime";
import { Contract, type Ledger, ledger } from "../managed/age_gate/contract/index.js";
import { type AgeGatePrivateState, witnesses } from "../witnesses.js";

export class AgeGateSimulator {
  readonly contract: Contract<AgeGatePrivateState>;
  // The compact-runtime CircuitContext shape varies by SDK version; use unknown for safety
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  circuitContext: any;

  constructor(age: bigint) {
    this.contract = new Contract<AgeGatePrivateState>(witnesses);
    // initialState accepts a plain object at runtime; cast through unknown to satisfy
    // the generated ConstructorContext type which differs between compiler versions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = this.contract.initialState({ privateState: { age } } as any);
    this.circuitContext = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      currentPrivateState: result.currentPrivateState,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      currentZswapLocalState: result.currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        state: result.currentContractState.data,
      },
    };
  }

  public getLedger(): Ledger {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): AgeGatePrivateState {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.circuitContext.currentPrivateState as AgeGatePrivateState;
  }

  public verifyEligibility(
    user: Uint8Array,
    threshold: bigint,
    timestamp: bigint,
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.circuitContext = this.contract.impureCircuits.verifyEligibility(
      this.circuitContext,
      user,
      threshold,
      timestamp,
    ).context;
    return true;
  }
}
