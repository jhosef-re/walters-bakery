import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserSummary {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  sucursalId: string | null;
  debeCambiarPassword: boolean;
}

export interface LoginResult {
  user: AuthUserSummary;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private buildPayload(user: Pick<Usuario, 'id' | 'correo' | 'rol' | 'sucursalId'>): JwtPayload {
    return {
      sub: user.id,
      correo: user.correo,
      rol: user.rol,
      sucursalId: user.sucursalId,
    };
  }

  private signAccess(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
    });
  }

  private signRefresh(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL') ?? '7d',
    });
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.users.findByCorreo(dto.correo);
    if (!user || !user.estado) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload = this.buildPayload(user);
    const accessToken = this.signAccess(payload);
    const refreshToken = this.signRefresh(payload);

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        sucursalId: user.sucursalId,
        debeCambiarPassword: user.debeCambiarPassword,
      },
      accessToken,
      refreshToken,
    };
  }

  async issueTokensForRefresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.users.findById(payload.sub);
      if (!user || !user.estado) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }
      const newPayload = this.buildPayload(user);
      return {
        accessToken: this.signAccess(newPayload),
        refreshToken: this.signRefresh(newPayload),
      };
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
