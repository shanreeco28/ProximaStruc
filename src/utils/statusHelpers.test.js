import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getStatusStyle } from './statusHelpers.js';

describe('getStatusStyle', () => {
  test('returns red style for Delayed status', () => {
    const style = getStatusStyle('Delayed');
    assert.match(style, /bg-red-50/);
    assert.match(style, /text-red-700/);
  });

  test('returns emerald style for Cast status without dates', () => {
    const style = getStatusStyle('Cast');
    assert.match(style, /bg-emerald-50/);
    assert.match(style, /text-emerald-700/);
  });

  test('returns red bold style for Late Cast (actual > target)', () => {
    const target = '2023-01-01';
    const actual = '2023-01-02';
    const style = getStatusStyle('Cast', target, actual);
    assert.match(style, /bg-red-50/);
    assert.match(style, /font-bold/);
  });

  test('returns emerald bold style for Early Cast (actual < target)', () => {
    const target = '2023-01-02';
    const actual = '2023-01-01';
    const style = getStatusStyle('Cast', target, actual);
    assert.match(style, /bg-emerald-50/);
    assert.match(style, /font-bold/);
  });

  test('returns white/slate style for On Time Cast (actual === target)', () => {
    const target = '2023-01-01';
    const actual = '2023-01-01';
    const style = getStatusStyle('Cast', target, actual);
    assert.match(style, /bg-white/);
    assert.match(style, /text-slate-700/);
  });

  test('returns default slate style for other statuses (e.g. Scheduled)', () => {
    const style = getStatusStyle('Scheduled');
    assert.match(style, /bg-slate-100/);
    assert.match(style, /text-slate-600/);
  });

  test('returns emerald style for Cast if one date is missing', () => {
    const style1 = getStatusStyle('Cast', '2023-01-01', null);
    assert.match(style1, /bg-emerald-50/);

    const style2 = getStatusStyle('Cast', null, '2023-01-01');
    assert.match(style2, /bg-emerald-50/);
  });
});
