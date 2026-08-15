import { CostModel } from "@midnight-ntwrk/compact-runtime";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Contract, ledger } from "../managed/age_gate/contract/index.js";
import { type AgeGatePrivateState, witnesses } from "../witnesses.js";
import { type AgeLedger } from "./compact-types.js";

export class AgeGateSimulator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly contract: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private circuitContext: any;

  constructor(age: bigint) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.contract = new (Contract as any)(witnesses);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const result: any = this.contract.initialState({ privateState: { age } });
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

  public getLedger(): AgeLedger {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    return ledger(this.circuitContext.currentQueryContext.state) as any;
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
