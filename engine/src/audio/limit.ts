/**
 * A look-ahead peak limiter (Remotion's ffmpeg has no limiter filter). No sample of the result
 * goes past `ceiling`. The gain starts going down `rampMs` before a peak, so it never drops in
 * one sample (a click), and comes back up `holdMs` after it, so a run of peaks in one word
 * doesn't make the gain flutter. Returns a new array.
 */
export function limitPeaks(samples: Float32Array, rate: number, ceiling: number, { rampMs = 5, holdMs = 30 } = {}): Float32Array {
  const n = samples.length;
  const half = Math.max(1, Math.round((rampMs * rate) / 1000 / 2));
  const ahead = 2 * half;
  const hold = Math.max(half, Math.round((holdMs * rate) / 1000));
  // The gain each sample needs on its own.
  const need = new Float32Array(n);
  let any = false;
  for (let i = 0; i < n; i++) {
    const level = Math.abs(samples[i]!);
    need[i] = level > ceiling ? ceiling / level : 1;
    if (level > ceiling) any = true;
  }
  if (!any) return samples.slice();
  // The lowest need from `hold` samples back to `ahead` samples on (a sliding minimum).
  const floor = new Float32Array(n);
  const window: number[] = [];
  let head = 0;
  for (let i = 0, j = 0; i < n; i++) {
    for (; j < n && j <= i + ahead; j++) {
      while (window.length > head && need[window[window.length - 1]!]! >= need[j]!) window.pop();
      window.push(j);
    }
    while (window[head]! < i - hold) head++;
    floor[i] = need[window[head]!]!;
  }
  // Smoothed by a running mean over ±half: every sample in the mean around a peak has that
  // peak inside its window, so the gain at the peak is never above what it needs.
  const out = new Float32Array(n);
  let sum = 0;
  for (let i = 0; i < Math.min(n, half); i++) sum += floor[i]!;
  for (let i = 0; i < n; i++) {
    if (i + half < n) sum += floor[i + half]!;
    if (i - half - 1 >= 0) sum -= floor[i - half - 1]!;
    const count = Math.min(n - 1, i + half) - Math.max(0, i - half) + 1;
    const value = samples[i]! * Math.min(1, sum / count);
    out[i] = Math.max(-ceiling, Math.min(ceiling, value));
  }
  return out;
}
