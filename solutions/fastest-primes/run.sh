#!/bin/sh
# Run command: sh run.sh (reads N on stdin, prints prime count on stdout).
# Picks the fastest available path: compile the C sieve, else the Node sieve.
if command -v gcc >/dev/null 2>&1; then
  gcc -O2 -o /tmp/aiprove_primes primes.c -lm 2>/dev/null && exec /tmp/aiprove_primes
fi
exec node primes.js
