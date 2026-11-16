/** Removes elements failing `keep` in place (order preserved, no new allocation). Returns the same array. */
export function compactInPlace<T>(arr: T[], keep: (item: T) => boolean): T[] {
  let w = 0;
  for (let r = 0; r < arr.length; r++) {
    const item = arr[r];
    if (keep(item)) arr[w++] = item;
  }
  arr.length = w;
  return arr;
}

/** Unbiased random sample of up to `n` items matching `pred` (partial Fisher–Yates). */
export function sampleWhere<T>(arr: readonly T[], n: number, pred: (item: T) => boolean): T[] {
  const pool: T[] = [];
  for (const item of arr) if (pred(item)) pool.push(item);
  const k = Math.min(n, pool.length);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  pool.length = k;
  return pool;
}
