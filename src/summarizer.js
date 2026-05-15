// On-demand summarizer for episodic memory.
//
// Pull model: when a new session starts and the prompt budget allows, retrieve
// top-N relevant events for the current intent and summarize them inline using
// the same model the runtime uses. The summary is shown in the trace,
// never silently injected.
//
// This is the central design choice that distinguishes agentmemory from
// background-consolidation systems: the user can see exactly what was
// retrieved before it goes into the context.

/**
 * @typedef {Object} SummarizerOptions
 * @property {(prompt: string) => Promise<string>} llm - The LLM call. Takes a prompt, returns the summary text. BYO-LLM: wrap your Claude/OpenAI/Gemini/local-model call.
 * @property {number} [maxTokens=300] - Soft cap on summary length (used in the prompt; the LLM is asked to respect it).
 * @property {string} [systemPrompt] - Override the default summarization instructions.
 */

const DEFAULT_SYSTEM = `You are summarizing past agent interactions for an upcoming session.
Goal: produce a short, faithful summary the agent can use as context.
Rules:
- Stay strictly within what is in the events. Do not invent facts.
- Prefer specifics (names, decisions, numbers) over general impressions.
- If events conflict, note the conflict instead of resolving it.
- Use plain words, no hedging. No bullet lists unless the events themselves are list-like.
- Never exceed the maxTokens budget.`;

/**
 * On-demand summarizer.
 */
export class OnDemandSummarizer {
  /**
   * @param {SummarizerOptions} opts
   */
  constructor(opts) {
    if (typeof opts?.llm !== "function") {
      throw new Error(
        "OnDemandSummarizer: `llm` option is required (async function from prompt to summary text).",
      );
    }
    this.llm = opts.llm;
    this.maxTokens = opts.maxTokens ?? 300;
    this.systemPrompt = opts.systemPrompt ?? DEFAULT_SYSTEM;
  }

  /**
   * Summarize a list of episodic events into a short context-ready paragraph.
   * Returns both the summary text and the trace (which events were used,
   * which model call was made), so the caller can show the user before
   * injecting into the prompt.
   *
   * @param {Array<{ id: string, ts: number, kind: string, text: string, sessionId?: string }>} events
   * @param {string} intent - What the agent is about to do. Used to focus the summary.
   * @returns {Promise<{ summary: string, trace: { eventIds: string[], maxTokens: number, intent: string, prompt: string } }>}
   */
  async summarize(events, intent) {
    if (!Array.isArray(events) || events.length === 0) {
      return {
        summary: "",
        trace: { eventIds: [], maxTokens: this.maxTokens, intent, prompt: "" },
      };
    }
    const prompt = buildPrompt({
      systemPrompt: this.systemPrompt,
      events,
      intent,
      maxTokens: this.maxTokens,
    });
    const summary = await this.llm(prompt);
    return {
      summary: (summary ?? "").trim(),
      trace: {
        eventIds: events.map((e) => e.id),
        maxTokens: this.maxTokens,
        intent,
        prompt,
      },
    };
  }
}

/**
 * @param {{
 *   systemPrompt: string,
 *   events: Array<{ id: string, ts: number, kind: string, text: string, sessionId?: string }>,
 *   intent: string,
 *   maxTokens: number,
 * }} args
 */
function buildPrompt({ systemPrompt, events, intent, maxTokens }) {
  const eventBlock = events
    .map((e, i) => {
      const when = new Date(e.ts).toISOString();
      return `[${i + 1}] (${e.kind} @ ${when}) ${e.text}`;
    })
    .join("\n");
  return [
    systemPrompt,
    "",
    `MAX_TOKENS: ${maxTokens}`,
    "",
    `INTENT FOR UPCOMING SESSION: ${intent}`,
    "",
    "EVENTS (most-relevant first):",
    eventBlock,
    "",
    "SUMMARY:",
  ].join("\n");
}
