import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('issues access and refresh token for valid credentials', async () => {
    const service = new AuthService({
      jwtSecret: 'test-secret',
      accessTokenTtlSec: 900,
      refreshTokenTtlSec: 604800
    });

    await service.seedUser('admin', 'Passw0rd!');

    const result = await service.login({ username: 'admin', password: 'Passw0rd!' });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.expiresIn).toBe(900);
  });
});
