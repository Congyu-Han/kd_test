import { middlewareDecision } from '../middleware';

export async function runPhase1Smoke(): Promise<boolean> {
  const redirected = middlewareDecision('/web/index', null);
  if (redirected !== '/login') {
    return false;
  }

  const allowed = middlewareDecision('/web/index', 'token');
  return allowed === '/web/index';
}
