import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CloneRecetaDto,
  CreateRecetaDto,
} from './dto/create-recipe.dto';
import { UpdateRecetaDto } from './dto/update-recipe.dto';

type RecetaConDetalle = Prisma.RecetaGetPayload<{
  include: {
    detalle: {
      include: { insumo: true; productoTerminado: true };
    };
    productoTerminado: true;
  };
}>;

@Injectable()
export class RecipesService {
  private readonly include = {
    detalle: { include: { insumo: true, productoTerminado: true } },
    productoTerminado: true,
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecetaDto): Promise<RecetaConDetalle> {
    await this.ensureProductoCanHaveReceta(dto.productoTerminadoId);
    this.validateDetalle(dto.detalle);
    return this.prisma.receta.create({
      data: {
        productoTerminadoId: dto.productoTerminadoId,
        version: 1,
        vigenteDesde: new Date(),
        vigenteHasta: null,
        detalle: {
          create: dto.detalle.map((d) => ({
            insumoId: d.insumoId,
            productoTerminadoId: null,
            cantidad: new Prisma.Decimal(d.cantidad),
            unidad: d.unidad,
          })),
        },
      },
      include: this.include,
    });
  }

  async clone(turnoId: string, _dto: CloneRecetaDto): Promise<RecetaConDetalle> {
    const original = await this.findByIdOrThrow(turnoId);
    return this.prisma.$transaction(async (tx) => {
      await tx.receta.update({
        where: { id: original.id },
        data: { vigenteHasta: new Date() },
      });
      return tx.receta.create({
        data: {
          productoTerminadoId: original.productoTerminadoId,
          version: original.version + 1,
          vigenteDesde: new Date(),
          vigenteHasta: null,
          detalle: {
            create: original.detalle.map((d) => ({
              insumoId: d.insumoId,
              productoTerminadoId: d.productoTerminadoId ?? null,
              cantidad: d.cantidad,
              unidad: d.unidad,
            })),
          },
        },
        include: this.include,
      });
    });
  }

  async findByIdOrThrow(id: string): Promise<RecetaConDetalle> {
    const r = await this.prisma.receta.findUnique({
      where: { id },
      include: this.include,
    });
    if (!r) throw new NotFoundException(`Receta ${id} no encontrada`);
    return r;
  }

  async findByProducto(productoId: string): Promise<RecetaConDetalle[]> {
    return this.prisma.receta.findMany({
      where: { productoTerminadoId: productoId },
      orderBy: { version: 'desc' },
      include: this.include,
    });
  }

  async findAll(): Promise<RecetaConDetalle[]> {
    return this.prisma.receta.findMany({
      orderBy: [{ productoTerminadoId: 'asc' }, { version: 'desc' }],
      include: this.include,
    });
  }

  async findVigente(productoId: string): Promise<RecetaConDetalle | null> {
    return this.prisma.receta.findFirst({
      where: { productoTerminadoId: productoId, vigenteHasta: null },
      include: this.include,
    });
  }

  async update(id: string, dto: UpdateRecetaDto): Promise<RecetaConDetalle> {
    if (dto.detalle) {
      this.validateDetalle(dto.detalle);
    }
    const exists = await this.findByIdOrThrow(id);
    if (!exists.vigenteHasta) {
      throw new ConflictException(
        `La receta ${id} esta vigente. Para editarla sin versionar, primero archivala; para crear una nueva version, usa POST /api/recipes/:id/clone.`,
      );
    }
    if (!dto.detalle) return exists;
    return this.prisma.$transaction(async (tx) => {
      await tx.recetaDetalle.deleteMany({ where: { recetaId: id } });
      return tx.receta.update({
        where: { id },
        data: {
          detalle: {
            create: dto.detalle!.map((d) => ({
              insumoId: d.insumoId,
              productoTerminadoId: null,
              cantidad: new Prisma.Decimal(d.cantidad),
              unidad: d.unidad,
            })),
          },
        },
        include: this.include,
      });
    });
  }

  // --- privados ---

  private async ensureProductoCanHaveReceta(productoId: string): Promise<void> {
    const p = await this.prisma.productoTerminado.findUnique({
      where: { id: productoId },
    });
    if (!p) {
      throw new NotFoundException(`Producto ${productoId} no encontrado`);
    }
    const existing = await this.prisma.receta.findFirst({
      where: { productoTerminadoId: productoId, vigenteHasta: null },
    });
    if (existing) {
      throw new ConflictException(
        `El producto ${productoId} ya tiene una receta vigente (id=${existing.id}). Usa POST /api/recipes/:id/clone para versionar.`,
      );
    }
  }

  private validateDetalle(detalle: CreateRecetaDto['detalle']): void {
    if (!detalle.length) {
      throw new BadRequestException('detalle no puede estar vacio');
    }
    const seen = new Set<string>();
    for (const d of detalle) {
      if (d.cantidad <= 0) {
        throw new BadRequestException(
          `cantidad de insumo ${d.insumoId} debe ser > 0`,
        );
      }
      if (seen.has(d.insumoId)) {
        throw new BadRequestException(
          `insumo ${d.insumoId} duplicado en el detalle`,
        );
      }
      seen.add(d.insumoId);
    }
  }
}
