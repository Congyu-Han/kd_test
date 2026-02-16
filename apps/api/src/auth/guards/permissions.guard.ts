export interface PermissionGuardContext {
  requiredPermissions?: string[];
  user?: {
    permissionCodes?: string[];
  };
}

export class PermissionsGuard {
  canActivate(context: PermissionGuardContext): boolean {
    const required = context.requiredPermissions ?? [];
    if (required.length === 0) {
      return true;
    }

    const codes = new Set(context.user?.permissionCodes ?? []);
    const hasAll = required.every((code) => codes.has(code));
    if (!hasAll) {
      throw new Error('forbidden');
    }

    return true;
  }
}
