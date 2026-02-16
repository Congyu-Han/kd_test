export interface PermissionMetadata {
  permissionCodes: string[];
}

export function Permission(...permissionCodes: string[]): PermissionMetadata {
  return { permissionCodes };
}
