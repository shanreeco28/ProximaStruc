import test from 'node:test';
import assert from 'node:assert';
import { enhanceActivityDescription } from './aiEnhancer.js';

test('enhanceActivityDescription handles empty text', async () => {
  const result = await enhanceActivityDescription('');
  assert.strictEqual(result, '');
});

test('enhanceActivityDescription handles whitespace text', async () => {
  const result = await enhanceActivityDescription('   ');
  assert.strictEqual(result, '   ');
});

test('enhanceActivityDescription throws error when API key is missing', async () => {
  // Mock import.meta.env
  global.import = {
    meta: {
      env: {}
    }
  };

  try {
    await enhanceActivityDescription('Some text');
    assert.fail('Expected an error to be thrown');
  } catch (error) {
    assert.strictEqual(error.message, 'Missing VITE_GEMINI_API_KEY environment variable. Cannot enhance text.');
  }
});
