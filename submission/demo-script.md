# IGR Demo Script (4 minutes)

## 0:00–0:30 — The Problem

"Prediction markets are supposed to find truth. But what happens when a single whale with 5 million tokens can override evidence from Reuters, the AP, and government officials?"

"In March 2025, a $7 million Polymarket market was forced to resolve YES on a Ukraine mineral deal — despite zero government confirmation. In July 2025, $237 million in bets on Zelenskyy wearing a suit were resolved NO — despite photographic evidence from multiple agencies."

"This is the problem IGR solves."

---

## 0:30–1:15 — What IGR Does

"IGR | Input-Governed Resolution is a policy-gated resolution system that refuses to auto-resolve when evidence is ambiguous or conflicting."

"Here's how it works:"

[Show architecture diagram]

"Step 1: Collect evidence from multiple sources — each with a quality score. Official government sources get 0.95. Manipulated market prices get 0.20."

"Step 2: AI deliberation. A proposer analyzes the weighted evidence. A challenger pressure-tests the conclusion."

"Step 3: Eight policy gates. Any failure triggers HOLD — meaning a human must review before resolution."

---

## 1:15–2:30 — Live Demo: Real Cases

### Ukraine mineral deal replay

[Terminal: `npm run replay -- --case=simulation/input/replay/case-ukraine-deal --policy=configs/policy.v1.json --out=simulation/output/reports`]

"Let's replay the Ukraine deal case. Five sources: US State Department says no deal. Ukraine Foreign Ministry says reports are inaccurate. Reuters and AP confirm no signed agreement. Only the Polymarket price — manipulated by whale voting — says YES."

"IGR's weighted analysis: 0.217 — heavily NO. Official sources dominate because they have quality score 0.95 versus the market's 0.20."

"Result: HOLD_FOR_REVIEW. Reason codes: deviation too high, low confidence, conflict score high."

"In reality, Polymarket auto-resolved YES. Users lost $7 million. IGR would have blocked this."

### Zelenskyy suit replay

[Terminal: `npm run replay -- --case=simulation/input/replay/case-zelenskyy-suit --policy=configs/policy.v1.json --out=simulation/output/reports`]

"Now the suit case. Reuters, AP, and Getty all have photos showing formal attire. But BBC's analysis says a blazer isn't technically a suit. And the Polymarket resolution — driven by whale votes — says NO."

"IGR sees the conflict: photo evidence says YES, but there's significant interpretive disagreement. Weighted average 0.718 — YES-leaning, but the disagreement score is 0.344."

"Result: HOLD_FOR_REVIEW. IGR recognizes this is human-judgment territory."

---

## 2:30–3:15 — Live Chainlink Integration

[Terminal: `npm run live -- --scenario=edge`]

"IGR also works with numeric markets using real on-chain data."

"Here we're reading live BTC price from four sources — Chainlink mainnet oracle, Binance, Coinbase, and CoinGecko. The threshold is set at current price — so source disagreement of even $50–$200 matters."

"You can see each policy rule being evaluated. When all pass, IGR recommends auto-resolve. When they don't, it holds."

---

## 3:15–3:45 — What Makes This Different

"The key insight is simple: not all sources are equal."

"A government press release should outweigh a token-weighted vote. Photo evidence from Reuters should outweigh an anonymous Twitter poll."

"IGR enforces this with quality-weighted analysis and deterministic policy gates. Every decision produces an auditable report with integrity hashes."

"It's not about replacing human judgment. It's about preventing whales from replacing it first."

---

## 3:45–4:00 — Close

"IGR | Input-Governed Resolution. Safe, auditable resolution for prediction markets."

"All code, replay cases, and reports are reproducible with `npm test` and `npm run replay`."

"Thank you."
