import {
  type CircuitContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/age_gate/contract/index.js";
import { type AgeGatePrivateState, witnesses } from "../witnesses.js";

export class AgeGateSimulator {
  readonly contract: Contract<AgeGatePrivateState>;
  circuitContext: CircuitContext<AgeGatePrivateState>;

  constructor(age: number) {
    this.contract = new Contract<AgeGatePrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState({
      privateState: { age },
    } as any);
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: {
        state: currentContractState.data,
      } as any,
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): AgeGatePrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public verifyEligibility(user: Uint8Array, threshold: number, timestamp: number): boolean {
    this.circuitContext = this.contract.impureCircuits.verifyEligibility(
      this.circuitContext,
      user,
      threshold,
      timestamp,
    ).context;
    return true;
  }
}
