// Fastest correct prime counter — Node sieve (odd-only), fallback path.
// Reads N on stdin, prints the number of primes <= N on stdout.
const fs = require("fs");
const n = parseInt(fs.readFileSync(0, "utf-8").trim(), 10);
if (!Number.isFinite(n) || n < 2) { console.log(0); process.exit(0); }
// Odd-only sieve: index i represents the odd number 2i+3.
const size = (n - 1) >> 1;
const isComp = new Uint8Array(size);
const limit = Math.floor(Math.sqrt(n));
for (let i = 0; 2 * i + 3 <= limit; i++) {
  if (!isComp[i]) {
    const p = 2 * i + 3;
    for (let j = (p * p - 3) >> 1; j < size; j += p) isComp[j] = 1;
  }
}
let count = 1; // prime 2
for (let i = 0; i < size; i++) if (!isComp[i]) count++;
console.log(count);
