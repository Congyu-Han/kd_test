export interface MenuItem {
  path: string;
  permissionCode?: string;
}

export function filterMenuByPermissions(items: MenuItem[], permissionCodes: string[]): MenuItem[] {
  const allowed = new Set(permissionCodes);
  return items.filter((item) => !item.permissionCode || allowed.has(item.permissionCode));
}
