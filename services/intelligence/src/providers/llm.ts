import type { LlmBriefingDraft, LlmProvider } from './types.js';
import { asNumber, asString, fetchJson, isRecord } from './utils.js';

function assertLlmDraft(value: unknown): LlmBriefingDraft {
  if (!isRecord(value)) {
    throw new Error('LLM briefing payload must be an object');
  }

  const headline = asString(value.headline);
  const summary = asString(value.summary);
  const bulletsValue = value.bullets;

  if (!headline || !summary || !Array.isArray(bulletsValue)) {
    throw new Error('LLM payload is missing headline/summary/bullets');
  }

  const bullets = bulletsValue.filter((item): item is string => typeof item === 'string').slice(0, 3);
  if (bullets.length === 0) {
    throw new Error('LLM payload produced no bullets');
  }

  const confidence = asNumber(value.confidence);
  const draft: LlmBriefingDraft = {
    headline,
    summary,
    bullets
  };

  if (confidence !== undefined) {
    draft.confidence = Math.max(0, Math.min(1, confidence));
  }

  return draft;
}

export class OpenAiCompatibleLlmProvider implements LlmProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async generateBriefing(args: {
    contextJson: string;
    model: string;
    timeoutMs: number;
  }): Promise<LlmBriefingDraft> {
    const payload = await fetchJson({
      url: `${this.baseUrl.replace(/\/$/, '')}/chat/completions`,
      method: 'POST',
      body: JSON.stringify({
        model: args.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You generate concise market briefings. Respond only as JSON with keys: headline (string), summary (string), bullets (string[]), confidence (0..1).'
          },
          {
            role: 'user',
            content: args.contextJson
          }
        ]
      }),
      timeoutMs: args.timeoutMs,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!isRecord(payload) || !Array.isArray(payload.choices) || payload.choices.length === 0) {
      throw new Error('Unexpected LLM response envelope');
    }

    const firstChoice = payload.choices[0];
    if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
      throw new Error('LLM response missing message payload');
    }

    const content = asString(firstChoice.message.content);
    if (!content) {
      throw new Error('LLM response had empty content');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'invalid JSON';
      throw new Error(`LLM output is not valid JSON: ${message}`);
    }

    return assertLlmDraft(parsed);
  }
}
