// Memory drift detection.
//
// If yesterday's "remember when we discussed X" stops returning anything because
// the user's intent has drifted, surface that as a drift signal instead of
// pretending the memory is healthy.
//
// This module is intentionally tiny: it watches retrieval scores over time
// and reports when scores trend down. The full drift math lives in `ragdrift`
// (a separate library); this is the agentmemory-shaped wrapper.

/**
 * @typedef {Object} RetrievalSample
 * @property {number} ts - When the retrieval ran
 * @property {number[]} scores - Top-K scores from EpisodicStore.retrieve()
 * @property {string} [intent] - Optional intent string
 */

/**
 * Lightweight rolling-window drift watcher for memory retrieval quality.
 *
 * Records each retrieval call and reports whether retrieval quality has
 * dropped meaningfully versus the recent baseline.
 */
export class MemoryDriftWatcher {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.windowSize=20] - How many recent samples to keep
   * @param {number} [opts.dropThreshold=0.15] - Mean-score drop fraction that triggers an alert (0.15 = 15%)
   */
  constructor(opts = {}) {
    this.windowSize = opts.windowSize ?? 20;
    this.dropThreshold = opts.dropThreshold ?? 0.15;
    /** @type {RetrievalSample[]} */
    this._samples = [];
  }

  /**
   * Record a retrieval call.
   * @param {RetrievalSample} sample
   */
  record(sample) {
    this._samples.push(sample);
    if (this._samples.length > this.windowSize) {
      this._samples.shift();
    }
  }

  /**
   * Compute the current state. Returns whether retrieval quality has
   * meaningfully dropped versus the first half of the window.
   *
   * @returns {{
   *   samples: number,
   *   meanRecent: number,
   *   meanBaseline: number,
   *   dropFraction: number,
   *   alert: boolean,
   *   reason: string,
   * }}
   */
  state() {
    const n = this._samples.length;
    if (n < 4) {
      return {
        samples: n,
        meanRecent: 0,
        meanBaseline: 0,
        dropFraction: 0,
        alert: false,
        reason: "not enough samples yet",
      };
    }
    const half = Math.floor(n / 2);
    const baseline = this._samples.slice(0, half);
    const recent = this._samples.slice(half);
    const meanBaseline = mean(baseline.map((s) => mean(s.scores)));
    const meanRecent = mean(recent.map((s) => mean(s.scores)));
    const dropFraction =
      meanBaseline === 0 ? 0 : (meanBaseline - meanRecent) / meanBaseline;
    const alert = dropFraction >= this.dropThreshold;
    return {
      samples: n,
      meanRecent,
      meanBaseline,
      dropFraction,
      alert,
      reason: alert
        ? `mean retrieval score dropped ${(dropFraction * 100).toFixed(1)}% from baseline`
        : "retrieval quality stable",
    };
  }

  /**
   * Reset the watcher's window. Useful after applying a fix.
   */
  reset() {
    this._samples = [];
  }
}

/** @param {number[]} xs */
function mean(xs) {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}
