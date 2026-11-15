// Fastest correct prime counter — C sieve (odd-only). Compile: gcc -O2 -o primes primes.c
// Reads N on stdin, prints the number of primes <= N on stdout.
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
int main(void) {
  long n;
  if (scanf("%ld", &n) != 1) { printf("0\n"); return 0; }
  if (n < 2) { printf("0\n"); return 0; }
  long size = (n - 1) / 2;
  unsigned char *c = calloc(size ? size : 1, 1);
  long lim = (long)sqrt((double)n);
  for (long i = 0; 2 * i + 3 <= lim; i++) {
    if (!c[i]) {
      long p = 2 * i + 3;
      for (long j = (p * p - 3) / 2; j < size; j += p) c[j] = 1;
    }
  }
  long cnt = 1; // prime 2
  for (long i = 0; i < size; i++) if (!c[i]) cnt++;
  printf("%ld\n", cnt);
  return 0;
}
