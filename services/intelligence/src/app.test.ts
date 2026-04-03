import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from './app.js';

test('allows desktop dev origin for endpoint requests', async () => {
  const app = createApp();

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/briefing',
      headers: {
        origin: 'http://127.0.0.1:5173'
      }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['access-control-allow-origin'], 'http://127.0.0.1:5173');
  } finally {
    await app.close();
  }
});

test('omits CORS headers for disallowed origins', async () => {
  const app = createApp();

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/briefing',
      headers: {
        origin: 'https://example.com'
      }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['access-control-allow-origin'], undefined);
  } finally {
    await app.close();
  }
});
