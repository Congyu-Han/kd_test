import { describe, expect, it } from 'vitest';
import { runPhase1Smoke } from '../src/smoke/phase1';

describe('phase1 smoke', () => {
  it('phase1 smoke: login -> menu -> create company -> export', async () => {
    const result = await runPhase1Smoke();
    expect(result).toBe(true);
  });
});
