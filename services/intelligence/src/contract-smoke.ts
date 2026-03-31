import { createApp } from './app.js';
import {
  assertAlertsResponse,
  assertBriefingResponse,
  assertStoriesResponse,
  assertTickersResponse
} from './api/validation.js';

async function run(): Promise<void> {
  const app = createApp();

  try {
    const briefing = await app.inject({ method: 'GET', url: '/briefing' });
    const stories = await app.inject({ method: 'GET', url: '/stories' });
    const tickers = await app.inject({ method: 'GET', url: '/tickers' });
    const alerts = await app.inject({ method: 'GET', url: '/alerts' });

    if ([briefing, stories, tickers, alerts].some((response) => response.statusCode !== 200)) {
      throw new Error('One or more endpoint smoke requests failed');
    }

    assertBriefingResponse(briefing.json());
    assertStoriesResponse(stories.json());
    assertTickersResponse(tickers.json());
    assertAlertsResponse(alerts.json());

    console.log('Contract smoke checks passed for /briefing, /stories, /tickers, /alerts');
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
