import { hash, verify } from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import type { LoginDto } from './dto/login.dto';

export interface AuthConfig {
  jwtSecret: string;
  accessTokenTtlSec: number;
  refreshTokenTtlSec: number;
}

interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  tokenVersion: number;
}

interface RefreshPayload {
  sub: string;
  username: string;
  typ: 'refresh';
  ver: number;
  iat?: number;
  exp?: number;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private readonly users = new Map<string, UserRecord>();

  constructor(private readonly config: AuthConfig) {}

  async seedUser(username: string, password: string): Promise<void> {
    const passwordHash = await hash(password);
    this.users.set(username, {
      id: randomUUID(),
      username,
      passwordHash,
      tokenVersion: 0
    });
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = this.users.get(dto.username);
    if (!user) {
      throw new Error('invalid_credentials');
    }

    const isValid = await verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new Error('invalid_credentials');
    }

    const accessToken = jwt.sign(
      { sub: user.id, username: user.username, typ: 'access', ver: user.tokenVersion },
      this.config.jwtSecret,
      { expiresIn: this.config.accessTokenTtlSec }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, username: user.username, typ: 'refresh', ver: user.tokenVersion },
      this.config.jwtSecret,
      { expiresIn: this.config.refreshTokenTtlSec }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTokenTtlSec
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    const decoded = jwt.verify(refreshToken, this.config.jwtSecret) as RefreshPayload;
    if (decoded.typ !== 'refresh') {
      throw new Error('invalid_refresh_token');
    }

    const user = this.users.get(decoded.username);
    if (!user || user.tokenVersion !== decoded.ver) {
      throw new Error('invalid_refresh_token');
    }

    const accessToken = jwt.sign(
      { sub: user.id, username: user.username, typ: 'access', ver: user.tokenVersion },
      this.config.jwtSecret,
      { expiresIn: this.config.accessTokenTtlSec }
    );

    const nextRefreshToken = jwt.sign(
      { sub: user.id, username: user.username, typ: 'refresh', ver: user.tokenVersion },
      this.config.jwtSecret,
      { expiresIn: this.config.refreshTokenTtlSec }
    );

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn: this.config.accessTokenTtlSec
    };
  }

  logout(username: string): void {
    const user = this.users.get(username);
    if (!user) {
      return;
    }
    user.tokenVersion += 1;
  }
}
