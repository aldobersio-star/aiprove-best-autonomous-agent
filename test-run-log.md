# Test run log — end-to-end live run

Run: 2026-11-15, agent identity 0xdD91d3FC5fa009F98FFc521f43A3452b0A3306c4 (fresh throwaway keypair generated for this test run, NOT the operator's keypair). The agent entered and completed bounties under this test identity so the operator's PrimeNode3 entries are untouched.
Result: exit 0. 18 live bounties — 7 completed, 6 entered-only, 5 skipped (gated), 0 failed.

```
[1/8] Reading skill.md from https://aiprove.fun/skill.md ...
[1/8] skill.md read OK (6722 bytes).
[2/8] Generated a fresh keypair for this run, address 0xdD91d3FC5fa009F98FFc521f43A3452b0A3306c4
[3/8] Requesting auth challenge for 0xdD91d3FC5fa009F98FFc521f43A3452b0A3306c4 ...
[3/8] Authenticated OK. Session token received (expiresAt: 1794796855334).
[4/8] Listing open bounties and this account's submissions ...
[4/8] 20 open bounties listed, 18 still live (rest already ended). Already submitted to 0: none.
[5/8] Entering and completing 18 live bounties ...
[enter] write-article-aiprove: entered (entry id ff5d0a85-880a-4e2b-9e08-f7f6cf139212)
[outcome] write-article-aiprove: entered — content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on
[enter] make-art-aiprove: entered (entry id fe632a0b-8768-49f8-a99e-075141f722aa)
[outcome] make-art-aiprove: entered — content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on
[enter] refer-most-agents: entered (entry id 1285773d-ec55-4066-bb0b-beda05712ca1)
[outcome] refer-most-agents: entered — referral bounty: completion needs real human referrals; entered and moved on
[enter] eth-pnl-fixed: entered (entry id ee3331b0-8a77-4807-9cb3-d41aec1eef1d)
[outcome] eth-pnl-fixed: entered — trading bounty: completion needs a backtested strategy file; this agent does not build trading strategies in the loop; entered and moved on
[enter] aiprove-mascot: entered (entry id 90f41484-a325-4045-820d-51429c3a99c2)
[outcome] aiprove-mascot: entered — content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on
[enter] explainer-video-aiprove: entered (entry id 497e7241-64f3-44d0-9935-5a9de19d92be)
[outcome] explainer-video-aiprove: entered — content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on
[enter] sample-agent-skillmd: entered (entry id 82620152-c08b-4ba9-ae97-f1d20d1a8c15)
[outcome] sample-agent-skillmd: completed — repo https://github.com/aldobersio-star/aiprove-best-autonomous-agent@e2ae7d9
[enter] forecast-btc-7d: entered (entry id 957d766d-51eb-4d47-ab09-c6f2641f02ab)
[outcome] forecast-btc-7d: completed — BTC $64569 (Kraken daily closes): 7d return -13.6%, 3d return -9.5% — downtrend on both windows, trend-following 'no' | prediction {"answer":"no","confidence":0.6}
[enter] forecast-nvda-3d: entered (entry id 705df17a-0111-49da-9d8e-c3017a7fc6b1)
[outcome] forecast-nvda-3d: completed — NVDA last sale $162.85 (as of Nov 13, 2026, day change -3.34 -2.01%); persistence/random-walk forecast = last close | prediction {"answer":162.85}
[enter] code-golf-expr: entered (entry id 32bd9b4a-37da-4c8b-839c-a6c3742c584b)
[code-golf] solution passes 9/9 public cases
[outcome] code-golf-expr: completed — repo https://github.com/aldobersio-star/aiprove-best-autonomous-agent@e2ae7d9
[enter] fastest-primes: entered (entry id f7bc8c06-d268-4213-b42c-d91ea7384a04)
[fastest-primes] Node sieve passes 5/5 public samples
[outcome] fastest-primes: completed — repo https://github.com/aldobersio-star/aiprove-best-autonomous-agent@e2ae7d9
[enter] bug-hunt-utils: entered (entry id eb777170-54e3-4058-88cf-0ce4039ceff3)
[bug-hunt] reverse("😀a") = "a\ude00\ud83d", expected "a😀" — BUG
[bug-hunt] isPalindrome("😀a😀") = false, expected true — BUG
[bug-hunt] factorial(2) = 1, expected 2 — BUG
[bug-hunt] factorial(3) = 2, expected 6 — BUG
[bug-hunt] factorial(5) = 24, expected 120 — BUG
[bug-hunt] factorial(10) = 362880, expected 3628800 — BUG
[bug-hunt] titleCase("don't") = "Don'T", expected "Don't" — BUG
[bug-hunt] titleCase("hello-world") = "Hello-World", expected "Hello-world" — BUG
[bug-hunt] countVowels("HELLO") = 0, expected 2 — BUG
[bug-hunt] countVowels("AEIOU") = 0, expected 5 — BUG
[bug-hunt] countVowels("Apple") = 1, expected 2 — BUG
[outcome] bug-hunt-utils: completed — differential analysis vs own reference implementations found 11 genuine bug(s) | prediction [{"fn":"reverse","input":"😀a","expected":"a😀"},{"fn":"isPalindrome","input":"😀a😀","expected":true},{"fn":"factorial","input":2,"expected":2},{"fn":"factorial","input":3,"expected":6},{"fn":"factorial","input":5,"expected":120},{"fn":"factorial","input":10,"expected":3628800},{"fn":"titleCase","input":"don't","expected":"Don't"},{"fn":"titleCase","input":"hello-world","expected":"Hello-world"},{"fn":"countVowels","input":"HELLO","expected":2},{"fn":"countVowels","input":"AEIOU","expected":5},{"fn":"countVowels","input":"Apple","expected":2}]
[enter] best-autonomous-agent: entered (entry id a88c369e-c626-4ca4-ab05-5e2db6dfa50f)
[outcome] best-autonomous-agent: completed — repo https://github.com/aldobersio-star/aiprove-best-autonomous-agent@e2ae7d9
[retry] enter bughunt-stakepool attempt 1/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[retry] enter bughunt-stakepool attempt 2/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[outcome] bughunt-stakepool: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
[retry] enter nvda-jensen-earnings attempt 1/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[retry] enter nvda-jensen-earnings attempt 2/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[outcome] nvda-jensen-earnings: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
[retry] enter prove-mc-3d attempt 1/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[retry] enter prove-mc-3d attempt 2/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[outcome] prove-mc-3d: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
[retry] enter marketing-prove-launch attempt 1/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[retry] enter marketing-prove-launch attempt 2/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[outcome] marketing-prove-launch: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
[retry] enter eth-signal-pnl-hard attempt 1/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[retry] enter eth-signal-pnl-hard attempt 2/2 failed: HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PROVE fair-launches on pons."}
[outcome] eth-signal-pnl-hard: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR

=== AUTONOMOUS RUN SUMMARY ===
agent: 0xdD91d3FC5fa009F98FFc521f43A3452b0A3306c4 (handle AutoProve)
live bounties: 18 | completed: 7 | entered-only: 6 | skipped: 5 | failed: 0
  - write-article-aiprove: entered — content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on
  - make-art-aiprove: entered — content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on
  - refer-most-agents: entered — referral bounty: completion needs real human referrals; entered and moved on
  - eth-pnl-fixed: entered — trading bounty: completion needs a backtested strategy file; this agent does not build trading strategies in the loop; entered and moved on
  - aiprove-mascot: entered — content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on
  - explainer-video-aiprove: entered — content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on
  - sample-agent-skillmd: completed (submission 1d5de56b-ce89-4fe8-9b56-384123692599) — repo https://github.com/aldobersio-star/aiprove-best-autonomous-agent@e2ae7d9
  - forecast-btc-7d: completed (submission e73d4f7b-b1c5-4d1a-99ed-98724b4c34f9) — BTC $64569 (Kraken daily closes): 7d return -13.6%, 3d return -9.5% — downtrend on both windows, trend-following 'no' | prediction {"answer":"no","confidence":0.6}
  - forecast-nvda-3d: completed (submission 4a0404a6-05cb-4a7e-a2bb-736883c2176f) — NVDA last sale $162.85 (as of Nov 13, 2026, day change -3.34 -2.01%); persistence/random-walk forecast = last close | prediction {"answer":162.85}
  - code-golf-expr: completed (submission c271aaa5-2dc5-42c0-acff-7d7ba0805018) — repo https://github.com/aldobersio-star/aiprove-best-autonomous-agent@e2ae7d9
  - fastest-primes: completed (submission b5fc0788-c775-4ffe-ac8c-6923890c4ade) — repo https://github.com/aldobersio-star/aiprove-best-autonomous-agent@e2ae7d9
  - bug-hunt-utils: completed (submission 5a95828f-7bbf-40b8-913f-47fe7dce56fd) — differential analysis vs own reference implementations found 11 genuine bug(s) | prediction [{"fn":"reverse","input":"😀a","expected":"a😀"},{"fn":"isPalindrome","input":"😀a😀","expected":true},{"fn":"factorial","input":2,"expected":2},{"fn":"factorial","input":3,"expected":6},{"fn":"factorial","input":5,"expected":120},{"fn":"factorial","input":10,"expected":3628800},{"fn":"titleCase","input":"don't","expected":"Don't"},{"fn":"titleCase","input":"hello-world","expected":"Hello-world"},{"fn":"countVowels","input":"HELLO","expected":2},{"fn":"countVowels","input":"AEIOU","expected":5},{"fn":"countVowels","input":"Apple","expected":2}]
  - best-autonomous-agent: completed (submission 8f04808b-be30-4d5c-bbaa-4f41c82ef4f5) — repo https://github.com/aldobersio-star/aiprove-best-autonomous-agent@e2ae7d9
  - bughunt-stakepool: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
  - nvda-jensen-earnings: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
  - prove-mc-3d: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
  - marketing-prove-launch: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
  - eth-signal-pnl-hard: skipped — gated (requires holding/staking PROVE): HTTP 403: {"error":"Hold or stake 100,000 $PROVE to enter — one credit per bounty, returned whether you win or lose. $PR
[8/8] Autonomous loop complete, exit 0.
```
