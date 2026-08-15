import { AgeGateSimulator } from "./age-gate-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("AgeGate smart contract", () => {
  it("allows verification when age is above or equal to threshold", () => {
    const user = randomBytes(32);
    const simulator = new AgeGateSimulator(20n);
    const threshold = 18n;
    const timestamp = BigInt(Date.now());

    const success = simulator.verifyEligibility(user, threshold, timestamp);
    expect(success).toBe(true);

    const ledgerState = simulator.getLedger();
    expect(ledgerState.eligible.get(user)).toBe(true);
    expect(ledgerState.verification_timestamp.get(user)).toBe(timestamp);
  });

  it("fails verification when age is below threshold", () => {
    const user = randomBytes(32);
    const simulator = new AgeGateSimulator(16n);
    const threshold = 18n;
    const timestamp = BigInt(Date.now());

    expect(() => {
      simulator.verifyEligibility(user, threshold, timestamp);
    }).toThrow("User age is below the required threshold");

    const ledgerState = simulator.getLedger();
    expect(ledgerState.eligible.has(user)).toBe(false);
  });

  it("does not leak the private age value into the public ledger state", () => {
    const user = randomBytes(32);
    const simulator = new AgeGateSimulator(25n);
    const threshold = 18n;
    const timestamp = BigInt(Date.now());

    simulator.verifyEligibility(user, threshold, timestamp);

    const ledgerState = simulator.getLedger();
    expect(ledgerState.eligible.get(user)).toBe(true);
    expect(ledgerState.verification_timestamp.get(user)).toBe(timestamp);
    const ledgerAsRecord = ledgerState as Record<string, unknown>;
    expect(ledgerAsRecord["age"]).toBeUndefined();
    expect(Object.keys(ledgerState)).not.toContain("age");
  });
});
