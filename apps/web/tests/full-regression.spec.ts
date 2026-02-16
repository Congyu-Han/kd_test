import { describe, expect, it } from 'vitest';
import { runFullRegression } from '../src/smoke/full-regression';

describe('full regression', () => {
  it('phase2 full regression smoke', async () => {
    const ok = await runFullRegression();
    expect(ok).toBe(true);
  });
});
