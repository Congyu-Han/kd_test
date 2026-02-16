import { describe, expect, it } from 'vitest';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  it('rejects user without required permission code', () => {
    const guard = new PermissionsGuard();

    const context = {
      requiredPermissions: ['user.manage.write'],
      user: { permissionCodes: ['user.manage.read'] }
    };

    expect(() => guard.canActivate(context)).toThrow('forbidden');
  });
});
