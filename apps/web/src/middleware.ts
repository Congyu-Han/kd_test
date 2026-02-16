export function middlewareDecision(pathname: string, accessToken: string | null): string {
  if (pathname.startsWith('/web') && !accessToken) {
    return '/login';
  }

  if (pathname === '/login' && accessToken) {
    return '/web/index';
  }

  return pathname;
}
