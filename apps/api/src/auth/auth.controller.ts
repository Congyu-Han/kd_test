import type { LoginDto } from './dto/login.dto';
import { AuthService, type AuthTokenResponse } from './auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login(dto: LoginDto): Promise<AuthTokenResponse> {
    return this.authService.login(dto);
  }

  refresh(refreshToken: string): Promise<AuthTokenResponse> {
    return this.authService.refresh(refreshToken);
  }

  logout(username: string): { success: boolean } {
    this.authService.logout(username);
    return { success: true };
  }
}
