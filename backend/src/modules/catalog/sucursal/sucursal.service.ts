import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Sucursal } from '@prisma/client';
import {
  CreateSucursalDto,
  UpdateSucursalDto,
} from './dto/sucursal.dto';
import {
  PaginatedResult,
  toPaginatedResult,
} from '../../../common/dto/pagination.dto';
import { ListSucursalesQuery } from '../../../common/dto/list-queries.dto';

@Injectable()
export class SucursalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSucursalDto): Promise<Sucursal> {
    const dup = await this.prisma.sucursal.findUnique({
      where: { codigo: dto.codigo },
    });
    if (dup) {
      throw new ConflictException(`Codigo ${dto.codigo} ya registrado`);
    }
    return this.prisma.sucursal.create({
      data: {
        codigo: dto.codigo,
        nombre: dto.nombre,
        direccion: dto.direccion,
        tipo: dto.tipo,
        estado: dto.estado ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateSucursalDto): Promise<Sucursal> {
    await this.findByIdOrThrow(id);
    return this.prisma.sucursal.update({
      where: { id },
      data: dto,
    });
  }

  async archivar(id: string): Promise<Sucursal> {
    const current = await this.findByIdOrThrow(id);
    if (!current.estado) return current;
    return this.prisma.sucursal.update({
      where: { id },
      data: { estado: false },
    });
  }

  async findByIdOrThrow(id: string): Promise<Sucursal> {
    const s = await this.prisma.sucursal.findUnique({ where: { id } });
    if (!s) throw new NotFoundException(`Sucursal ${id} no encontrada`);
    return s;
  }

  async findAll(
    query: ListSucursalesQuery,
  ): Promise<PaginatedResult<Sucursal>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SucursalWhereInput = {};
    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { codigo: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.tipo) where.tipo = query.tipo;
    if (query.estado !== undefined) where.estado = query.estado;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sucursal.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { codigo: 'asc' },
      }),
      this.prisma.sucursal.count({ where }),
    ]);
    return toPaginatedResult(rows, total, page, pageSize);
  }
}
