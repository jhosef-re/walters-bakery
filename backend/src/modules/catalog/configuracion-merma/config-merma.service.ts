import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfiguracionMerma } from '@prisma/client';
import {
  CreateConfiguracionMermaDto,
  UpdateConfiguracionMermaDto,
} from './dto/config-merma.dto';

@Injectable()
export class ConfiguracionMermaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConfiguracionMermaDto): Promise<ConfiguracionMerma> {
    if (dto.defaultGeneral && (dto.productoTerminadoId || dto.insumoId)) {
      throw new BadRequestException(
        'defaultGeneral=true solo aplica al umbral general (sin productoTerminadoId ni insumoId)',
      );
    }
    if (!dto.defaultGeneral && !dto.productoTerminadoId && !dto.insumoId) {
      throw new BadRequestException(
        'Debes especificar defaultGeneral=true o un productoTerminadoId o insumoId',
      );
    }

    if (dto.defaultGeneral) {
      const existing = await this.prisma.configuracionMerma.findFirst({
        where: { defaultGeneral: true },
      });
      if (existing) {
        throw new ConflictException(
          'Ya existe un umbral general. Usa PATCH sobre ese registro.',
        );
      }
    }

    return this.prisma.configuracionMerma.create({
      data: {
        umbral: dto.umbral,
        defaultGeneral: dto.defaultGeneral ?? false,
        productoTerminadoId: dto.defaultGeneral ? null : dto.productoTerminadoId,
        insumoId: dto.defaultGeneral ? null : dto.insumoId,
      },
    });
  }

  async update(id: string, dto: UpdateConfiguracionMermaDto): Promise<ConfiguracionMerma> {
    const current = await this.findByIdOrThrow(id);
    return this.prisma.configuracionMerma.update({
      where: { id },
      data: {
        umbral: dto.umbral ?? current.umbral,
        defaultGeneral: dto.defaultGeneral ?? current.defaultGeneral,
      },
    });
  }

  async findByIdOrThrow(id: string): Promise<ConfiguracionMerma> {
    const c = await this.prisma.configuracionMerma.findUnique({ where: { id } });
    if (!c) throw new NotFoundException(`ConfiguracionMerma ${id} no encontrada`);
    return c;
  }

  async findAll(): Promise<ConfiguracionMerma[]> {
    return this.prisma.configuracionMerma.findMany({
      orderBy: [{ defaultGeneral: 'desc' }, { umbral: 'asc' }],
    });
  }

  /**
   * Resuelve el umbral aplicable segun prioridad:
   *   1. override por productoTerminadoId
   *   2. override por insumoId
   *   3. default general
   *   4. 0 si nada coincide
   */
  async resolveThreshold(productoId?: string, insumoId?: string): Promise<number> {
    if (productoId) {
      const hit = await this.prisma.configuracionMerma.findFirst({
        where: { productoTerminadoId: productoId },
      });
      if (hit) return hit.umbral;
    }
    if (insumoId) {
      const hit = await this.prisma.configuracionMerma.findFirst({
        where: { insumoId },
      });
      if (hit) return hit.umbral;
    }
    const general = await this.prisma.configuracionMerma.findFirst({
      where: { defaultGeneral: true },
    });
    return general?.umbral ?? 0;
  }
}
