import { CostModel } from "@midnight-ntwrk/compact-runtime";
import { Contract, type Ledger, ledger } from "../managed/age_gate/contract/index.js";
import { type AgeGatePrivateState, witnesses } from "../witnesses.js";

export class AgeGateSimulator {
  readonly contract: Contract<AgeGatePrivateState>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  circuitContext: any;

  constructor(age: bigint) {
    this.contract = new Contract<AgeGatePrivateState>(witnesses);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = this.contract.initialState({ privateState: { age } });
    this.circuitContext = {
      currentPrivateState: result.currentPrivateState,
      currentZswapLocalState: result.currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: {
        state: result.currentContractState.data,
      },
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): AgeGatePrivateState {
    return this.circuitContext.currentPrivateState as AgeGatePrivateState;
  }

  public verifyEligibility(
    user: Uint8Array,
    threshold: bigint,
    timestamp: bigint,
  ): boolean {
    this.circuitContext = this.contract.impureCircuits.verifyEligibility(
      this.circuitContext,
      user,
      threshold,
      timestamp,
    ).context;
    return true;
  }
}
