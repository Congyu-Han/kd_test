import { describe, expect, it } from 'vitest';
import { middlewareDecision } from '../src/middleware';

describe('auth middleware', () => {
  it('redirects unauthenticated user to /login', () => {
    const next = middlewareDecision('/web/index', null);
    expect(next).toBe('/login');
  });
});
