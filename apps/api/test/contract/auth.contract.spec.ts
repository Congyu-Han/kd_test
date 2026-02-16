import { describe, expect, it } from 'vitest';
import { AuthService } from '../../src/auth/auth.service';

describe('auth contract', () => {
  it('returns accessToken and refreshToken', async () => {
    const service = new AuthService({
      jwtSecret: 'contract-secret',
      accessTokenTtlSec: 900,
      refreshTokenTtlSec: 604800
    });

    await service.seedUser('contract-user', 'Passw0rd!');
    const data = await service.login({ username: 'contract-user', password: 'Passw0rd!' });

    expect(data.accessToken).toBeTruthy();
    expect(data.refreshToken).toBeTruthy();
  });
});
