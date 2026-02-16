import { describe, expect, it } from 'vitest';
import { UserService } from './user.service';

describe('UserService', () => {
  it('returns paged user list with role names', async () => {
    const service = new UserService();
    await service.seed({ username: 'alice', roles: ['运营管理员'], department: '运营部' });

    const result = await service.list({ page: 1, pageSize: 20 });

    expect(result.items[0].roles).toEqual(['运营管理员']);
    expect(result.total).toBe(1);
  });
});
