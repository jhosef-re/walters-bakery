import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Insumo, Prisma } from '@prisma/client';
import {
  CreateInsumoDto,
  UpdateInsumoDto,
} from './dto/insumo.dto';
import { ListInsumosQuery } from '../../../common/dto/list-queries.dto';
import { PaginatedResult, toPaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class InsumoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInsumoDto): Promise<Insumo> {
    const dup = await this.prisma.insumo.findUnique({ where: { sku: dto.sku } });
    if (dup) throw new ConflictException(`SKU ${dto.sku} ya registrado`);
    return this.prisma.insumo.create({
      data: {
        sku: dto.sku,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        unidad: dto.unidad,
        costoUnitarioActual: dto.costoUnitarioActual ?? 0,
        virtual: dto.virtual ?? false,
        estado: dto.estado ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateInsumoDto): Promise<Insumo> {
    await this.findByIdOrThrow(id);
    return this.prisma.insumo.update({ where: { id }, data: dto });
  }

  async archivar(id: string): Promise<Insumo> {
    const current = await this.findByIdOrThrow(id);
    if (!current.estado) return current;
    return this.prisma.insumo.update({ where: { id }, data: { estado: false } });
  }

  async findByIdOrThrow(id: string): Promise<Insumo> {
    const i = await this.prisma.insumo.findUnique({ where: { id } });
    if (!i) throw new NotFoundException(`Insumo ${id} no encontrado`);
    return i;
  }

  async findBySkuOrThrow(sku: string): Promise<Insumo> {
    const i = await this.prisma.insumo.findUnique({ where: { sku } });
    if (!i) throw new NotFoundException(`Insumo SKU=${sku} no encontrado`);
    return i;
  }

  async findAll(
    query: ListInsumosQuery,
  ): Promise<PaginatedResult<Insumo>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.InsumoWhereInput = {};
    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: 'insensitive' } },
        { nombre: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.virtual !== undefined) where.virtual = query.virtual;
    if (query.estado !== undefined) where.estado = query.estado;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.insumo.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.insumo.count({ where }),
    ]);
    return toPaginatedResult(rows, total, page, pageSize);
  }
}
