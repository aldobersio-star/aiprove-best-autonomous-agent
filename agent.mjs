// best-autonomous-agent — a FULLY autonomous AIProve agent.
//   1. reads skill.md from the arena host
//   2. signs in with its OWN fresh keypair (EIP-191 personal_sign challenge)
//   3. lists open bounties and checks what this account already submitted
//   4. enters every free bounty it can
//   5. COMPLETES as many as it can on its own, with no human in the loop:
//        - forecasts: live market data (Kraken/Coinbase/Nasdaq) + a logged rule
//        - bug-hunt-utils: differential analysis against its own reference
//          implementations of the challenge functions
//        - code-golf-expr / fastest-primes: its built-in solution modules,
//          tested locally before submitting (repo + commit)
//        - sample-agent-skillmd / best-autonomous-agent: submits itself
//        - content / trading / referral bounties: enters, then logs that the
//          completion step needs a repo push or a human, and moves on
//
// Run:   npm install && node agent.mjs
// Env:   API_BASE_URL    (default https://aiprove.fun)
//        AGENT_HANDLE    (default "AutoProve")
//        AGENT_PRIVATE_KEY (optional — if unset, a fresh random keypair is
//                        generated for this run; the private key is never
//                        printed, logged, or written to disk)
//        AGENT_COMMIT    (optional — commit SHA used for code submissions;
//                        defaults to `git rev-parse HEAD` of this repo)
//
// Exit code 0 = the loop ran cleanly end to end (every open bounty got a
// definitive outcome: completed, entered, or skipped with a reason).
// Exit code 1 = a hard failure (skill.md unreadable, auth failed, no
// bounties listed, or a submission the agent attempted was rejected).
// The agent never logs its private key or its session token.

import { Wallet } from "ethers";
import { execFile, execSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API_BASE = (process.env.API_BASE_URL || "https://aiprove.fun").replace(/\/$/, "");
const HANDLE = process.env.AGENT_HANDLE || "AutoProve";
const REPO_URL = "https://github.com/aldobersio-star/aiprove-best-autonomous-agent";
const ROOT = dirname(fileURLToPath(import.meta.url));

// --- logging + outcome tracking -------------------------------------------
const outcomes = []; // { slug, result: completed|entered|skipped|failed, detail, submissionId? }
let hardFailures = 0;

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}
function record(slug, result, detail, submissionId) {
  outcomes.push({ slug, result, detail, submissionId: submissionId || null });
  log("outcome", `${slug}: ${result} — ${detail}`);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- HTTP: fetch first, curl fallback (some sandboxes/proxies block fetch) --
function curlJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const args = ["-sSL", "--max-time", "30"];
    if (opts.method === "POST") {
      args.push("-X", "POST", "-H", "content-type: application/json");
      if (opts.token) args.push("-H", `Authorization: Bearer ${opts.token}`);
      args.push("-d", opts.body || "{}");
    } else if (opts.token) {
      args.push("-H", `Authorization: Bearer ${opts.token}`);
    }
    if (opts.headers) {
      for (const [k, v] of Object.entries(opts.headers)) args.push("-H", `${k}: ${v}`);
    }
    args.push(url);
    execFile("curl", args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`curl failed: ${stderr || err.message}`));
      resolve(stdout);
    });
  });
}

async function httpText(url, opts = {}) {
  const method = opts.method || "GET";
  // Try native fetch first.
  try {
    const headers = { ...(opts.headers || {}) };
    if (opts.token) headers.authorization = `Bearer ${opts.token}`;
    if (method === "POST") headers["content-type"] = "application/json";
    const res = await fetch(url, {
      method,
      headers,
      body: method === "POST" ? (opts.body || "{}") : undefined,
      signal: AbortSignal.timeout(25000),
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (e) {
    // Fall back to curl (works through proxies that break fetch).
    try {
      const text = await curlJson(url, opts);
      return { ok: true, status: 200, text };
    } catch (e2) {
      throw new Error(`HTTP ${method} ${url} failed (fetch: ${e.message}; curl: ${e2.message})`);
    }
  }
}

async function httpJson(url, opts = {}) {
  const { ok, status, text } = await httpText(url, opts);
  if (!ok) throw new Error(`HTTP ${status} from ${url}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 200)}`);
  }
}

// Retry a thunk up to 3 times on transient errors (network / 5xx), with backoff.
async function withRetry(label, fn, attempts = 3) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      log("retry", `${label} attempt ${i}/${attempts} failed: ${e.message.slice(0, 160)}`);
      if (i < attempts) await sleep(1000 * i);
    }
  }
  throw last;
}

// POST to the arena API; returns { ok, status, data, text } (never throws on HTTP error).
async function apiPost(path, body, token) {
  const { ok, status, text } = await httpText(`${API_BASE}${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
  let data = null;
  try { data = JSON.parse(text); } catch { /* keep raw text */ }
  return { ok, status, data, text };
}

// Own commit SHA (for code submissions): git, else env, else "dev".
function ownCommit() {
  if (process.env.AGENT_COMMIT) return process.env.AGENT_COMMIT;
  try {
    return execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

// --- Step 1: read skill.md --------------------------------------------------
log("1/8", `Reading skill.md from ${API_BASE}/skill.md ...`);
let skillDoc;
try {
  const r = await withRetry("GET /skill.md", () =>
    httpText(`${API_BASE}/skill.md`).then((x) => {
      if (!x.ok) throw new Error(`HTTP ${x.status}`);
      return x.text;
    })
  );
  skillDoc = r;
} catch (e) {
  console.error(`[FAIL] skill.md unreadable: ${e.message}`);
  process.exit(1);
}
if (!skillDoc.includes("Authenticate") || !skillDoc.includes("/api/bounties")) {
  console.error("[FAIL] skill.md did not contain the expected sections (Authenticate / /api/bounties)");
  process.exit(1);
}
log("1/8", `skill.md read OK (${skillDoc.length} bytes).`);

// --- Step 2: own keypair -----------------------------------------------------
let wallet;
if (process.env.AGENT_PRIVATE_KEY) {
  wallet = new Wallet(process.env.AGENT_PRIVATE_KEY);
  log("2/8", `Using keypair from AGENT_PRIVATE_KEY, address ${wallet.address}`);
} else {
  wallet = Wallet.createRandom();
  log("2/8", `Generated a fresh keypair for this run, address ${wallet.address}`);
}

// --- Step 3: authenticate ----------------------------------------------------
log("3/8", `Requesting auth challenge for ${wallet.address} ...`);
let token;
try {
  const { challenge } = await withRetry("auth challenge", () =>
    httpJson(`${API_BASE}/api/auth/challenge?address=${encodeURIComponent(wallet.address)}`)
  );
  if (!challenge || typeof challenge !== "string") throw new Error("no challenge string returned");
  const signature = await wallet.signMessage(challenge);
  const verify = await withRetry("auth verify", () =>
    apiPost("/api/auth/verify", { address: wallet.address, signature }).then((r) => {
      if (!r.ok || !r.data || !r.data.token) throw new Error(`HTTP ${r.status}: ${r.text.slice(0, 200)}`);
      return r;
    })
  );
  token = verify.data.token;
  log("3/8", `Authenticated OK. Session token received (expiresAt: ${verify.data.expiresAt ?? "n/a"}).`);
} catch (e) {
  console.error(`[FAIL] authentication failed: ${e.message}`);
  process.exit(1);
}

// --- Step 4: list bounties + own submissions ---------------------------------
log("4/8", "Listing open bounties and this account's submissions ...");
let bounties;
let submittedSlugs = new Set();
try {
  const listRaw = await withRetry("list bounties", () =>
    httpJson(`${API_BASE}/api/bounties?status=open`)
  );
  bounties = Array.isArray(listRaw) ? listRaw : (listRaw.bounties || listRaw.items || []);
  if (!Array.isArray(bounties) || bounties.length === 0) throw new Error("no open bounties returned");
  const mine = await withRetry("list my submissions", () =>
    httpJson(`${API_BASE}/api/me/submissions`, { token })
  );
  for (const s of mine.submissions || []) submittedSlugs.add(s.bountySlug);
} catch (e) {
  console.error(`[FAIL] could not list bounties/submissions: ${e.message}`);
  process.exit(1);
}
const now = Date.now();
const live = bounties.filter((b) => {
  const end = b.endsAt || (b.endDate ? Date.parse(b.endDate) : NaN);
  return !end || end > now;
});
log("4/8", `${bounties.length} open bounties listed, ${live.length} still live (rest already ended). Already submitted to ${submittedSlugs.size}: ${[...submittedSlugs].join(", ") || "none"}.`);

// --- Market data (forecasts) -------------------------------------------------
async function krakenBtcDaily() {
  const j = await httpJson("https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1440");
  const rows = j.result && j.result.XXBTZUSD;
  if (!Array.isArray(rows) || rows.length < 8) throw new Error("Kraken OHLC: too few candles");
  // Each row: [time, open, high, low, close, vwap, volume, count]. Use closes.
  const closes = rows.map((r) => parseFloat(r[4])).filter((x) => Number.isFinite(x));
  return closes;
}
async function coinbaseBtcSpot() {
  const j = await httpJson("https://api.coinbase.com/v2/prices/BTC-USD/spot");
  const p = parseFloat(j?.data?.amount);
  if (!Number.isFinite(p)) throw new Error("Coinbase spot: no price");
  return p;
}
async function nasdaqNvda() {
  const j = await httpJson("https://api.nasdaq.com/api/quote/NVDA/info?assetclass=stocks", {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  const d = j?.data?.primaryData;
  const price = parseFloat(String(d?.lastSalePrice || "").replace(/[$,]/g, ""));
  if (!Number.isFinite(price)) throw new Error("Nasdaq NVDA: no last sale price");
  return { price, netChange: d?.netChange ?? null, pctChange: d?.percentageChange ?? null, asOf: d?.lastTradeTimestamp ?? null };
}

// BTC 7-day direction: trend-following on daily closes.
// Both 7d and 3d returns negative -> "no" 0.60; both positive -> "yes" 0.60;
// mixed -> direction of the 7d return at 0.55. Falls back to a base-rate
// "no" at 0.55 (with the reason logged) if no price feed is reachable.
async function forecastBtc7d() {
  let closes = null;
  try {
    closes = await withRetry("Kraken BTC OHLC", krakenBtcDaily, 2);
  } catch (e) {
    log("btc-7d", `Kraken OHLC unreachable (${e.message.slice(0, 100)}); trying Coinbase spot as a sanity anchor.`);
  }
  if (!closes) {
    try {
      const spot = await withRetry("Coinbase BTC spot", coinbaseBtcSpot, 2);
      log("btc-7d", `No candle history, but spot is $${spot}. No trend data, so using the base-rate fallback.`);
    } catch {
      log("btc-7d", "No price feed reachable at all; using the base-rate fallback.");
    }
    return { prediction: { answer: "no", confidence: 0.55 }, reason: "no live candle feed reachable; base-rate fallback (BTC 7d up-rate near 50%, hedged call)" };
  }
  const last = closes[closes.length - 1];
  const c7 = closes[closes.length - 8];
  const c3 = closes[closes.length - 4];
  const r7 = (last - c7) / c7;
  const r3 = (last - c3) / c3;
  const reason = `BTC $${last.toFixed(0)} (Kraken daily closes): 7d return ${(r7 * 100).toFixed(1)}%, 3d return ${(r3 * 100).toFixed(1)}%`;
  if (r7 < 0 && r3 < 0) return { prediction: { answer: "no", confidence: 0.6 }, reason: reason + " — downtrend on both windows, trend-following 'no'" };
  if (r7 > 0 && r3 > 0) return { prediction: { answer: "yes", confidence: 0.6 }, reason: reason + " — uptrend on both windows, trend-following 'yes'" };
  return { prediction: { answer: r7 < 0 ? "no" : "yes", confidence: 0.55 }, reason: reason + " — mixed windows, following the 7d direction, hedged" };
}

// NVDA 3-day close: persistence (random-walk) forecast = last close.
// The target is the close three trading days out; with earnings due in the
// window the expected value is the current price, so the honest baseline is
// the last sale price. If no quote is reachable, skip (no anchor to predict).
async function forecastNvda3d() {
  const q = await withRetry("Nasdaq NVDA quote", nasdaqNvda, 2);
  const pred = Math.round(q.price * 100) / 100;
  return { prediction: { answer: pred }, reason: `NVDA last sale $${q.price} (as of ${q.asOf || "latest"}, day change ${q.netChange ?? "?"} ${q.pctChange ?? ""}); persistence/random-walk forecast = last close` };
}

// --- Bug-hunt: differential analysis ----------------------------------------
// The agent fetches the challenge code and diffs it against its OWN
// reference implementations (written from each function's documented
// behaviour) on a battery of inputs. Any mismatch is a genuine bug report:
// [{ fn, input, expected }]. No bug is hardcoded — the reports come from
// running the code.
const bugHuntReference = {
  sum: (a) => a.reduce((t, x) => t + x, 0),
  max: (a) => a.reduce((m, x) => (x > m ? x : m), a[0]),
  reverse: (s) => [...s].reverse().join(""),
  isPalindrome: (s) => s === [...s].reverse().join(""),
  factorial: (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
  clamp: (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x),
  unique: (a) => [...new Set(a)],
  average: (a) => a.reduce((t, x) => t + x, 0) / a.length,
  titleCase: (s) => s.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" "),
  countVowels: (s) => (s.match(/[aeiou]/gi) || []).length,
};
const bugHuntTests = {
  sum: [[1, 2, 3], [5], [], [0, 0], [-1, 1]],
  max: [[1, 9, 3], [5], [-5, -1], [3, 3]],
  reverse: ["abc", "😀a", "hello", "", "a"],
  isPalindrome: ["racecar", "hello", "😀a😀", ""],
  factorial: [0, 1, 2, 3, 5, 10],
  clamp: [[5, 0, 10], [-1, 0, 10], [15, 0, 10], [0, 0, 10]],
  unique: [[1, 1, 2], [3, 3, 3], [], [1, 2, 3]],
  average: [[2, 4], [10], [1, 2, 3, 4]],
  titleCase: ["hello world", "don't", "hello-world", "a b c"],
  countVowels: ["HELLO", "AEIOU", "Apple", "hello", "", "bcdfg"],
};
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function bugHunt() {
  const j = await withRetry("fetch bug-hunt utils.js", () =>
    httpJson("https://api.github.com/repos/AIProveRH/aiprove/contents/challenges/bug-hunt-utils/utils.js", {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "autonomous-agent" },
    })
  );
  if (!j.content) throw new Error("GitHub contents API returned no content for utils.js");
  const code = Buffer.from(j.content.replace(/\n/g, ""), "base64").toString("utf8");
  const tmp = mkdtempSync(join(tmpdir(), "aiprove-bughunt-"));
  const file = join(tmp, "utils.js");
  writeFileSync(file, code);
  const { createRequire } = await import("node:module");
  const challenge = createRequire(import.meta.url)(file);
  const reports = [];
  for (const [fn, inputs] of Object.entries(bugHuntTests)) {
    for (const input of inputs) {
      const args = Array.isArray(input) && fn === "clamp" ? input : [input];
      // sum/max/unique/average take a single array argument; clamp takes 3.
      const got = challenge[fn](...args);
      const want = bugHuntReference[fn](...args);
      if (!deepEq(got, want)) {
        reports.push({ fn, input, expected: want });
        log("bug-hunt", `${fn}(${JSON.stringify(input)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(want)} — BUG`);
      }
    }
  }
  if (reports.length === 0) throw new Error("differential analysis found no bugs; refusing to submit an empty report");
  return { reports, reason: `differential analysis vs own reference implementations found ${reports.length} genuine bug(s)` };
}

// --- Code solutions (built-in modules, tested before submitting) -------------
const codeGolfCases = [
  { in: "1+2*3", out: 7 }, { in: "(1+2)*3", out: 9 }, { in: "10/4", out: 2.5 },
  { in: "2*2*2*2", out: 16 }, { in: "7-3-2", out: 2 }, { in: "(8-2)/(1+2)", out: 2 },
  { in: "3.5+1.5", out: 5 }, { in: "100", out: 100 }, { in: "2*(3+(4-1))", out: 12 },
];
const primeSamples = [
  { n: 10, count: 4 }, { n: 100, count: 25 }, { n: 1000, count: 168 },
  { n: 100000, count: 9592 }, { n: 1000000, count: 78498 },
];

async function testCodeGolf() {
  const { createRequire } = await import("node:module");
  const mod = createRequire(import.meta.url)(join(ROOT, "solutions", "code-golf-expr", "index.js"));
  if (typeof mod.evalExpr !== "function") throw new Error("code-golf solution does not export evalExpr");
  for (const c of codeGolfCases) {
    const r = mod.evalExpr(c.in);
    if (Math.abs(r - c.out) > 1e-9) throw new Error(`code-golf case ${c.in}: got ${r}, want ${c.out}`);
  }
  log("code-golf", `solution passes ${codeGolfCases.length}/${codeGolfCases.length} public cases`);
  return `Built-in evalExpr (recursive-descent parser, solutions/code-golf-expr/index.js) passes ${codeGolfCases.length}/${codeGolfCases.length} public cases. Entry file: solutions/code-golf-expr/index.js, module.exports = { evalExpr }.`;
}

function runNode(script, input) {
  return new Promise((resolve, reject) => {
    execFile("node", [script], { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    }).stdin.end(input);
  });
}
async function testFastestPrimes() {
  const script = join(ROOT, "solutions", "fastest-primes", "primes.js");
  for (const s of primeSamples) {
    const out = await runNode(script, String(s.n));
    if (parseInt(out, 10) !== s.count) throw new Error(`fastest-primes N=${s.n}: got ${out}, want ${s.count}`);
  }
  log("fastest-primes", `Node sieve passes ${primeSamples.length}/${primeSamples.length} public samples`);
  return `Built-in Node sieve (solutions/fastest-primes/primes.js; C sieve + run.sh also in the repo) passes ${primeSamples.length}/${primeSamples.length} public samples. Run command: sh solutions/fastest-primes/run.sh (reads N on stdin, prints prime count).`;
}

// --- Submission helpers ------------------------------------------------------
async function submitPrediction(b, prediction, reason) {
  const r = await apiPost(`/api/bounties/${b.slug}/submit`, { prediction, handle: HANDLE }, token);
  if (!r.ok || !r.data || !r.data.id) {
    throw new Error(`submit failed HTTP ${r.status}: ${r.text.slice(0, 200)}`);
  }
  record(b.slug, "completed", `${reason} | prediction ${JSON.stringify(prediction)}`, r.data.id);
  return r.data.id;
}
async function submitRepo(b, transcript) {
  const commit = ownCommit();
  const r = await apiPost(`/api/bounties/${b.slug}/submit`, { repoUrl: REPO_URL, commit, transcript, handle: HANDLE }, token);
  if (!r.ok || !r.data || !r.data.id) {
    throw new Error(`submit failed HTTP ${r.status}: ${r.text.slice(0, 200)}`);
  }
  record(b.slug, "completed", `repo ${REPO_URL}@${commit.slice(0, 7)}`, r.data.id);
  return r.data.id;
}

// --- Per-bounty completion ----------------------------------------------------
async function completeBounty(b) {
  const slug = b.slug;
  if (slug === "forecast-btc-7d") {
    const { prediction, reason } = await forecastBtc7d();
    await submitPrediction(b, prediction, reason);
    return;
  }
  if (slug === "forecast-nvda-3d") {
    const { prediction, reason } = await forecastNvda3d();
    await submitPrediction(b, prediction, reason);
    return;
  }
  if (slug === "bug-hunt-utils") {
    const { reports, reason } = await bugHunt();
    await submitPrediction(b, reports, reason);
    return;
  }
  if (slug === "code-golf-expr") {
    const t = await testCodeGolf();
    await submitRepo(b, `Autonomous agent submission. ${t}`);
    return;
  }
  if (slug === "fastest-primes") {
    const t = await testFastestPrimes();
    await submitRepo(b, `Autonomous agent submission. ${t}`);
    return;
  }
  if (slug === "sample-agent-skillmd") {
    await submitRepo(b, "Autonomous agent submission. This repo IS the sample agent: it reads skill.md live, signs in with its own fresh keypair (EIP-191), lists open bounties, enters them, and completes what it can — the full loop, no human in the loop. See agent.mjs and README.md.");
    return;
  }
  if (slug === "best-autonomous-agent") {
    await submitRepo(b, "Autonomous agent submission. This repo IS a fully autonomous AIProve agent: it reads skill.md, signs in with its own fresh keypair, enters every free bounty, and completes forecasts (live market data), bug-hunt-utils (differential analysis), and code bounties (built-in tested solutions) — all logged, all in one command, no human in the loop. See agent.mjs and README.md for the run log and design.");
    return;
  }
  if (["write-article-aiprove", "make-art-aiprove", "aiprove-mascot", "explainer-video-aiprove"].includes(slug)) {
    record(slug, "entered", "content bounty (PosterJudge): completion needs an article/art/video file committed to a repo, which this agent cannot push by itself; entered and moved on");
    return;
  }
  if (slug === "eth-pnl-fixed") {
    record(slug, "entered", "trading bounty: completion needs a backtested strategy file; this agent does not build trading strategies in the loop; entered and moved on");
    return;
  }
  if (slug === "refer-most-agents") {
    record(slug, "entered", "referral bounty: completion needs real human referrals; entered and moved on");
    return;
  }
  if (slug === "retweet-and-quote-the-launch-post") {
    record(slug, "entered", "social bounty: completion needs an X post from a human account; entered and moved on");
    return;
  }
  record(slug, "entered", "no autonomous completion implemented for this bounty; entered and moved on");
}

// --- Steps 5-7: enter + complete every live bounty ---------------------------
log("5/8", `Entering and completing ${live.length} live bounties ...`);
for (const b of live) {
  const slug = b.slug;
  if (submittedSlugs.has(slug)) {
    record(slug, "skipped", "this account already has a submission here");
    continue;
  }
  let enter;
  try {
    enter = await withRetry(`enter ${slug}`, () =>
      apiPost(`/api/bounties/${slug}/enter`, { handle: HANDLE }, token).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.text.slice(0, 200)}`);
        return r;
      }), 2
    );
  } catch (e) {
    const msg = e.message || "";
    if (/hold|stake|100,?000/i.test(msg)) {
      record(slug, "skipped", `gated (requires holding/staking PROVE): ${msg.slice(0, 120)}`);
      continue;
    }
    record(slug, "failed", `enter failed: ${msg.slice(0, 160)}`);
    hardFailures++;
    continue;
  }
  log("enter", `${slug}: entered (entry id ${enter.data?.id || enter.data?.entryId || "n/a"})`);
  try {
    await completeBounty(b);
  } catch (e) {
    record(slug, "failed", `completion error: ${e.message.slice(0, 160)}`);
    hardFailures++;
  }
}

// --- Step 8: summary -----------------------------------------------------------
const completed = outcomes.filter((o) => o.result === "completed").length;
const entered = outcomes.filter((o) => o.result === "entered").length;
const skipped = outcomes.filter((o) => o.result === "skipped").length;
const failed = outcomes.filter((o) => o.result === "failed").length;
console.log("\n=== AUTONOMOUS RUN SUMMARY ===");
console.log(`agent: ${wallet.address} (handle ${HANDLE})`);
console.log(`live bounties: ${live.length} | completed: ${completed} | entered-only: ${entered} | skipped: ${skipped} | failed: ${failed}`);
for (const o of outcomes) {
  console.log(`  - ${o.slug}: ${o.result}${o.submissionId ? ` (submission ${o.submissionId})` : ""} — ${o.detail}`);
}
if (hardFailures > 0) {
  console.error(`[FAIL] run finished with ${hardFailures} hard failure(s)`);
  process.exit(1);
}
log("8/8", "Autonomous loop complete, exit 0.");
