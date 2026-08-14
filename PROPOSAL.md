# Project Proposal: ZK Private Age Gate

## 1. Chosen Idea: Age & Eligibility Gate

Our project is a privacy-preserving **Age Gate / Eligibility Gate** dApp built on the Midnight Network. It enables users to cryptographically prove that they meet a minimum age requirement (e.g., 18 or 21) without revealing their actual date of birth, age, or identity.

---

## 2. Why This Problem Matters

Age verification is a critical requirement across multiple industries, including:
- **Age-restricted content platforms** (gaming, adult entertainment, streaming).
- **Regulated commerce** (alcohol delivery, tobacco, pharmaceuticals).
- **Gambling and prediction markets**.

The current solutions are highly flawed:
- **Web2 approach:** Users upload government IDs or fill out forms. This exposes highly sensitive personally identifiable information (PII) to central servers, making it vulnerable to database hacks, identity theft, and corporate tracking.
- **Traditional Blockchain approach:** Users make public assertions or store metadata on-chain. Since blockchains like Ethereum are public by default, storing an age or ID hash publicly linkable to a wallet address permanently doxxes the user.

---

## 3. How Midnight Network Uniquely Solves This

Midnight’s dual-state (public + private) ledger architecture and **Compact** language allow us to solve this problem optimally:

1. **Rational Privacy (Private Witness):** The user's age is treated as a *private witness* (`localAge()`) that never leaves their device. The ZK circuit runs off-chain inside the browser, verifying the mathematical inequality `age >= threshold` locally.
2. **Selective Disclosure:** The compiler ensures that only the boolean eligibility status (`true`), the transaction timestamp, and the wallet identifier are disclosed to the public ledger. No raw age value is ever stored, logged, or sent to a node.
3. **Public Verifiability:** Anyone can verify the resulting on-chain state to confirm that the wallet has been validated, providing trust without sacrificing anonymity.
