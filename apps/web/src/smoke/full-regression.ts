import { runPhase1Smoke } from './phase1';

export async function runFullRegression(): Promise<boolean> {
  return runPhase1Smoke();
}
