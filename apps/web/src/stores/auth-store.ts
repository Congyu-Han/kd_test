export interface SessionState {
  accessToken: string | null;
  permissionCodes: string[];
}

export class AuthStore {
  private state: SessionState = {
    accessToken: null,
    permissionCodes: []
  };

  setSession(accessToken: string, permissionCodes: string[]): void {
    this.state = { accessToken, permissionCodes };
  }

  clearSession(): void {
    this.state = { accessToken: null, permissionCodes: [] };
  }

  get snapshot(): SessionState {
    return this.state;
  }
}
