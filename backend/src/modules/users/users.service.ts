import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateUserDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto/create-user.dto';
import {
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { toPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { ListUsersQuery } from '../../common/dto/list-queries.dto';
import { Prisma, Usuario } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly auth: AuthService,
  ) {}

  async create(dto: CreateUserDto): Promise<Usuario> {
    const existente = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });
    if (existente) {
      throw new ConflictException(`Ya existe un usuario con correo ${dto.correo}`);
    }
    if (dto.sucursalId) {
      await this.ensureSucursalExists(dto.sucursalId);
    }
    const passwordHash = await this.auth.hashPassword(dto.password);
    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        passwordHash,
        rol: dto.rol,
        sucursalId: dto.sucursalId,
        debeCambiarPassword: true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorId: string,
  ): Promise<Usuario> {
    const current = await this.findByIdOrThrow(id);
    const data: Prisma.UsuarioUpdateInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.rol !== undefined) data.rol = dto.rol;
    if (dto.sucursalId !== undefined) {
      if (dto.sucursalId) await this.ensureSucursalExists(dto.sucursalId);
      data.sucursal = dto.sucursalId
        ? { connect: { id: dto.sucursalId } }
        : { disconnect: true };
    }
    if (dto.estado !== undefined) data.estado = dto.estado;

    const updated = await this.prisma.usuario.update({
      where: { id },
      data,
    });
    await this.writeBitacora(current, updated, actorId);
    return updated;
  }

  async resetPassword(
    id: string,
    dto: ResetPasswordDto,
    actorId: string,
  ): Promise<Usuario> {
    const current = await this.findByIdOrThrow(id);
    const passwordHash = await this.auth.hashPassword(dto.nuevaPassword);
    const updated = await this.prisma.usuario.update({
      where: { id },
      data: {
        passwordHash,
        ultimoCambioPassword: new Date(),
        debeCambiarPassword: dto.debeCambiarPassword ?? true,
      },
    });
    await this.writeBitacora(
      current,
      updated,
      actorId,
      [{ campo: 'passwordHash', anterior: '***', nuevo: '***' }],
    );
    return updated;
  }

  async changeOwnPassword(
    user: AuthenticatedUser,
    passwordActual: string,
    passwordNueva: string,
  ): Promise<Usuario> {
    const full = await this.findByIdOrThrow(user.id);
    const matches = await bcrypt.compare(passwordActual, full.passwordHash);
    if (!matches) {
      throw new ConflictException('La contrasena actual no coincide');
    }
    const passwordHash = await this.auth.hashPassword(passwordNueva);
    return this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        passwordHash,
        ultimoCambioPassword: new Date(),
        debeCambiarPassword: false,
      },
    });
  }

  async deactivate(id: string, actorId: string): Promise<Usuario> {
    const current = await this.findByIdOrThrow(id);
    const updated = await this.prisma.usuario.update({
      where: { id },
      data: { estado: false },
    });
    await this.writeBitacora(current, updated, actorId);
    return updated;
  }

  findByCorreo(correo: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { correo } });
  }

  findById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string): Promise<Usuario> {
    const u = await this.prisma.usuario.findUnique({
      where: { id },
      include: { sucursal: true },
    });
    if (!u) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return u;
  }

  async findAll(
    query: ListUsersQuery,
  ): Promise<PaginatedResult<Usuario>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.UsuarioWhereInput | undefined = query.search
      ? {
          OR: [
            { nombre: { contains: query.search, mode: 'insensitive' } },
            { correo: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { sucursal: { select: { id: true, nombre: true, codigo: true } } },
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return toPaginatedResult(rows, total, page, pageSize);
  }

  // --- privados ---

  private async ensureSucursalExists(id: string): Promise<void> {
    const suc = await this.prisma.sucursal.findUnique({ where: { id } });
    if (!suc) {
      throw new NotFoundException(`Sucursal ${id} no encontrada`);
    }
  }

  private async writeBitacora(
    anterior: Usuario,
    nuevo: Usuario,
    actorId: string,
    extras: { campo: string; anterior?: string | null; nuevo?: string | null }[] = [],
  ): Promise<void> {
    const tracked: Array<{
      campo: string;
      anterior: string;
      nuevo: string;
    }> = [];
    if (anterior.nombre !== nuevo.nombre)
      tracked.push({ campo: 'nombre', anterior: anterior.nombre, nuevo: nuevo.nombre });
    if (anterior.rol !== nuevo.rol)
      tracked.push({ campo: 'rol', anterior: anterior.rol, nuevo: nuevo.rol });
    if ((anterior.sucursalId ?? null) !== (nuevo.sucursalId ?? null))
      tracked.push({
        campo: 'sucursalId',
        anterior: anterior.sucursalId ?? '',
        nuevo: nuevo.sucursalId ?? '',
      });
    if (anterior.estado !== nuevo.estado)
      tracked.push({ campo: 'estado', anterior: String(anterior.estado), nuevo: String(nuevo.estado) });
    for (const e of extras) {
      tracked.push({ campo: e.campo, anterior: e.anterior ?? '', nuevo: e.nuevo ?? '' });
    }
    if (tracked.length === 0) return;
    await this.prisma.auditoriaCambio.createMany({
      data: tracked.map((t) => ({
        usuarioId: actorId,
        entidad: 'Usuario',
        entidadId: nuevo.id,
        campo: t.campo,
        valorAnterior: t.anterior,
        valorNuevo: t.nuevo,
      })),
    });
  }
}
