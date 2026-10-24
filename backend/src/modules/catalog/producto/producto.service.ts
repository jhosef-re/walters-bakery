import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductoTerminado, Prisma } from '@prisma/client';
import {
  CreateProductoTerminadoDto,
  UpdateProductoTerminadoDto,
} from './dto/producto.dto';
import { ListProductosQuery } from '../../../common/dto/list-queries.dto';
import { PaginatedResult, toPaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class ProductoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductoTerminadoDto): Promise<ProductoTerminado> {
    const dup = await this.prisma.productoTerminado.findUnique({
      where: { sku: dto.sku },
    });
    if (dup) throw new ConflictException(`SKU ${dto.sku} ya registrado`);
    return this.prisma.productoTerminado.create({
      data: {
        sku: dto.sku,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        unidad: dto.unidad,
        vidaUtilDias: dto.vidaUtilDias ?? 1,
        precioVenta: dto.precioVenta,
        reutilizable: dto.reutilizable ?? false,
        tipoReuso: dto.tipoReuso ?? 'none',
        estado: dto.estado ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateProductoTerminadoDto): Promise<ProductoTerminado> {
    await this.findByIdOrThrow(id);
    return this.prisma.productoTerminado.update({ where: { id }, data: dto });
  }

  async archivar(id: string): Promise<ProductoTerminado> {
    const current = await this.findByIdOrThrow(id);
    if (!current.estado) return current;
    return this.prisma.productoTerminado.update({
      where: { id },
      data: { estado: false },
    });
  }

  async findByIdOrThrow(id: string): Promise<ProductoTerminado> {
    const p = await this.prisma.productoTerminado.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Producto ${id} no encontrado`);
    return p;
  }

  async findBySkuOrThrow(sku: string): Promise<ProductoTerminado> {
    const p = await this.prisma.productoTerminado.findUnique({ where: { sku } });
    if (!p) throw new NotFoundException(`Producto SKU=${sku} no encontrado`);
    return p;
  }

  async findAll(
    query: ListProductosQuery,
  ): Promise<PaginatedResult<ProductoTerminado>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ProductoTerminadoWhereInput = {};
    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: 'insensitive' } },
        { nombre: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.reutilizables) where.reutilizable = true;
    if (query.unidad) where.unidad = query.unidad;
    if (query.estado !== undefined) where.estado = query.estado;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.productoTerminado.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.productoTerminado.count({ where }),
    ]);
    return toPaginatedResult(rows, total, page, pageSize);
  }
}
