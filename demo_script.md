# Demo Video Script: Private Age Gate (1 Minute)

### **[0:00 - 0:10] Introduction**
- **Visual:** Show the landing page of the "Midnight Private Age Gate" dApp. Cursor hovers over the "Connect Wallet" / "Deploy" section.
- **Audio:** "Hi everyone! Welcome to our Private Age Gate dApp built on the Midnight Network. Today, I'll show you how a user can prove they are older than 18 without ever sharing their actual age on-chain."

### **[0:10 - 0:25] Step 1: Wallet Connection & Contract Setup**
- **Visual:** Click on "Deploy New Age Gate Contract." Lace wallet popup opens, click "Sign/Authorize." The UI transitions to show "Verify Age Eligibility" with the contract address.
- **Audio:** "First, we connect our Lace wallet and deploy our ZK Age Gate contract. The wallet dApp connector handshakes securely, exposing only our public key to the contract."

### **[0:25 - 0:45] Step 2: Local Age Witness & ZK Proof Generation**
- **Visual:** Enter `20` in the "YOUR AGE" input field, keep `18` as the threshold. Click "Generate ZK Proof & Verify." Show the loading spinner saying "Generating ZK proof off-chain...".
- **Audio:** "Now, I enter my age as 20. When I click verify, a zero-knowledge proof is generated *locally* on my machine. My age is handled entirely as a private witness. It is never sent to any server or indexer."

### **[0:45 - 0:55] Step 3: Result Verification & Privacy Validation**
- **Visual:** Loading spinner completes. A big green `✅ Eligible` badge appears. Show the verification timestamp. Scroll down to show the "How This Works" privacy panel.
- **Audio:** "And there we go! The transaction is finalized on the ledger. We get a verified 'Eligible' badge. Under the privacy model, anyone can see our wallet is verified, but my actual age—20—remains completely hidden and private."

### **[0:55 - 1:00] Outro**
- **Visual:** Show the passing GitHub CI badge and repository links.
- **Audio:** "An industry-grade, private-by-design solution built on Midnight. Thank you!"
