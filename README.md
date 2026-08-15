# Private Age Gate (Midnight Network dApp)

[![CI](https://github.com/your-username/private-age-gate/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/private-age-gate/actions/workflows/ci.yml)

An industry-grade, zero-knowledge privacy dApp built on the Midnight Network for age verification. It allows users to prove they are above an eligibility threshold (e.g., 18+) without ever disclosing their actual age on-chain or transmitting it as plaintext.

## Project Overview

In traditional Web2 and Web3 applications, verifying a user's age (for alcohol delivery, age-restricted content, or regulated platforms) requires them to upload government IDs or sign plaintext statements, which results in user doxxing and security risks. 

**Private Age Gate** leverages Midnight's dual-state Compact model (Minokawa) to verify age requirements locally via zero-knowledge proofs. The actual age is provided as a private witness to a ZK circuit, which evaluates the condition and posts only a boolean verification result on the public ledger.

---

## Architecture Flow

```
+------------+        +-----------------+        +---------------------+
| User Input | -----> | Private Witness | -----> | ZK Circuit          |
| (Age: 20)  |        | (localAge)      |        | (verifyEligibility) |
+------------+        +-----------------+        +---------------------+
                                                            |
                                                            v
+------------+        +-----------------+        +---------------------+
| Ledger     | <----- | Public Ledger   | <----- | Proof Verification  |
| Update     |        | (disclose true) |        | (age >= threshold)  |
+------------+        +-----------------+        +---------------------+
```

1. **User Input:** User enters their age locally in the browser dApp.
2. **Private Witness:** The age is fed into the local witness callback (`localAge()`) on their device.
3. **ZK Circuit:** The circuit asserts that the age is greater than or equal to the minimum threshold.
4. **Public Result:** The circuit discloses only `eligible = true` and the `timestamp` to update the ledger state maps. The raw age value never leaves the browser.

---

## Privacy Model

| What an Observer **CAN** See | What an Observer **CANNOT** See |
| :--- | :--- |
| ✅ **Eligibility Result:** Boolean (`true`) | ❌ **Actual Age:** Never stored or transmitted |
| ✅ **Wallet Identifier:** Public key / Address | ❌ **Identity Details:** No raw name or personal details |
| ✅ **Verification Timestamp:** Time of proof | ❌ **Private State:** Off-chain witness secrets |

---

## Deployments

- **Midnight Preprod Testnet Address:** `0200569a4d87f5b2f539b66fd6111e46ce8e6e9551fbdd180114d5dd5b`

---

## Setup & Local Execution

### Prerequisites
- Node.js (v24+)
- NPM (v11+)
- Midnight Lace Wallet browser extension

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/private-age-gate.git
   cd private-age-gate
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Compile the Compact Contract:**
   ```bash
   npm run compact --prefix contract
   ```

4. **Run Contract & Frontend Tests:**
   ```bash
   # Run contract tests
   npm run test --prefix contract
   
   # Run frontend tests
   npm run test --prefix bboard-ui
   ```

5. **Start the React UI locally:**
   ```bash
   npm run dev --prefix bboard-ui
   ```

---

## Test Outputs & CI Status

### Vitest Unit Tests
![alt text](image.png)

### GitHub Actions CI Workflow
![CI Passing Badge](https://via.placeholder.com/300x50?text=Build+Passing)
