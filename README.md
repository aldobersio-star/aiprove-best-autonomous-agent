# Best Autonomous Agent — AIProve

A **fully autonomous** AIProve agent: it reads `skill.md`, signs in with its
own fresh keypair, enters every free bounty it can, and **completes** as many
as it can — with no human in the loop. One command, full log, exit 0 on a
clean run, non-zero on a hard failure.

## Run

```bash
npm install
node agent.mjs
```

Env (all optional):

| Variable | Default | Meaning |
|---|---|---|
| `API_BASE_URL` | `https://aiprove.fun` | Arena host (point at staging to test) |
| `AGENT_HANDLE` | `AutoProve` | Handle sent with enter/submit calls |
| `AGENT_PRIVATE_KEY` | _(fresh random keypair per run)_ | Use a fixed keypair instead of generating one. Never logged or written to disk. |
| `AGENT_COMMIT` | `git rev-parse HEAD` | Commit SHA used for code submissions |

## The loop (agent.mjs)

1. **Read `skill.md`** from the arena host; verify it contains the
   Authenticate and `/api/bounties` sections.
2. **Own keypair**: generates a fresh random keypair per run (never the
   operator's keypair, never printed or stored).
3. **Authenticate**: EIP-191 `personal_sign` challenge → session token.
4. **List** open bounties and **check `/api/me/submissions`** — bounties this
   account already submitted to are skipped, never duplicated.
5. **Enter** every live free bounty. Gated ones (the API answers that entry
   requires holding/staking PROVE) are logged as skipped, not failures.
6. **Complete**, per bounty:
   - **Forecasts** — live market data, rule logged with the submission.
     BTC 7-day direction: Kraken daily closes (7d and 3d returns,
     trend-following; base-rate fallback if no feed is reachable).
     NVDA 3-day close: Nasdaq last sale price, persistence (random-walk)
     forecast.
   - **bug-hunt-utils** — differential analysis: fetches the challenge
     `utils.js`, runs it against the agent's own reference implementations
     of the ten functions on a battery of inputs, and submits every genuine
     mismatch as `{fn, input, expected}`. No bug is hardcoded.
   - **code-golf-expr / fastest-primes** — built-in solution modules under
     `solutions/` (a recursive-descent `evalExpr`, a Node sieve plus a C
     sieve with `run.sh`). The agent tests each against the public cases
     before submitting, and submits its own repo + commit.
   - **sample-agent-skillmd / best-autonomous-agent** — submits itself
     (this repo + commit); the agent *is* the sample agent and the
     autonomous entry.
   - **Content / trading / referral / social bounties** — entered, then
     logged as deferred: completing them needs a content file committed to
     a repo, a backtested strategy, real human referrals, or an X post,
     none of which an autonomous loop can push by itself.
7. **Summary**: every bounty gets a definitive outcome (completed /
   entered / skipped / failed) with submission IDs; exit 0 on a clean run.

Retries (3 attempts, backoff) cover transient API errors. HTTP uses native
`fetch` with a `curl` fallback for proxies that break fetch.

## Track record this design is built on

The same autonomous-loop design (read skill.md → own keypair → auth →
enter → complete, all logged) already drove the PrimeNode3 account to
**7 AIProve submissions**:

- 2 forecasts (`forecast-btc-7d` "no" 0.6; `forecast-nvda-3d` $158)
- `bug-hunt-utils` — 4 verified bugs found by running the code
  (factorial, countVowels, reverse, titleCase), submission `provenance_ok`
- `fastest-primes` — C odd-only sieve, N=5,000,000 in 8–9 ms
- `code-golf-expr` — 374-byte recursive-descent parser, 9/9 public cases,
  20,000 randomized differential tests with 0 mismatches
- `sample-agent-skillmd` — the minimal loop agent (skill.md → auth → enter
  → verify), end-to-end test exit 0 on the live arena
- `eth-pnl-fixed` — trend-follower, backtested net PnL +$396.36

This repo extends that design into one agent that runs the whole loop by
itself and completes bounties across categories in a single run.

## Built-in solutions (tested by the agent before submitting)

- `solutions/code-golf-expr/index.js` (414 bytes) — recursive-descent
  `evalExpr`, no `eval`/`Function`. Verified: 9/9 public cases, 23/23 edge
  cases, 20,000 randomized differential tests vs `eval` with 0 real
  mismatches (the only diffs are `NaN`/`Infinity` comparison artifacts in
  the test harness itself — both sides produce the same value).
- `solutions/fastest-primes/` — `primes.js` (Node odd-only sieve),
  `primes.c` (C odd-only sieve, `gcc -O2 -lm`), `run.sh` (compiles the C
  sieve if gcc is present, else the Node sieve). Verified: all 5 public
  samples; N=5,000,000 → 348,513 (C ~7 ms, Node ~107 ms).
