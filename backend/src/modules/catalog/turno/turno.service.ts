import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Turno } from '@prisma/client';
import {
  CreateTurnoDto,
  UpdateTurnoDto,
} from './dto/turno.dto';
import {
  TurnoInput,
  validateShape,
  turnosOverlap,
} from './turno-window';

@Injectable()
export class TurnoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sucursalId: string, dto: CreateTurnoDto): Promise<Turno> {
    await this.ensureSucursal(sucursalId);
    this.assertShape(dto.horaInicio, dto.horaFin, dto.cruzaMedianoche ?? false);
    await this.assertNoOverlap(sucursalId, {
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      cruzaMedianoche: dto.cruzaMedianoche ?? false,
    });
    return this.prisma.turno.create({
      data: {
        sucursalId,
        nombre: dto.nombre,
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        cruzaMedianoche: dto.cruzaMedianoche ?? false,
        orden: dto.orden ?? 1,
      },
    });
  }

  async update(turnoId: string, dto: UpdateTurnoDto): Promise<Turno> {
    const current = await this.findByIdOrThrow(turnoId);
    const merged = {
      horaInicio: dto.horaInicio ?? current.horaInicio,
      horaFin: dto.horaFin ?? current.horaFin,
      cruzaMedianoche: dto.cruzaMedianoche ?? current.cruzaMedianoche,
      orden: dto.orden ?? current.orden,
      nombre: dto.nombre ?? current.nombre,
      estado: dto.estado ?? current.estado,
    };
    this.assertShape(merged.horaInicio, merged.horaFin, merged.cruzaMedianoche);
    if (dto.horaInicio || dto.horaFin || dto.cruzaMedianoche !== undefined) {
      await this.assertNoOverlap(
        current.sucursalId,
        {
          horaInicio: merged.horaInicio,
          horaFin: merged.horaFin,
          cruzaMedianoche: merged.cruzaMedianoche,
        },
        turnoId,
      );
    }
    return this.prisma.turno.update({
      where: { id: turnoId },
      data: {
        nombre: merged.nombre,
        horaInicio: merged.horaInicio,
        horaFin: merged.horaFin,
        cruzaMedianoche: merged.cruzaMedianoche,
        orden: merged.orden,
        estado: merged.estado,
      },
    });
  }

  async archivar(turnoId: string): Promise<Turno> {
    const current = await this.findByIdOrThrow(turnoId);
    if (!current.estado) return current;
    return this.prisma.turno.update({ where: { id: turnoId }, data: { estado: false } });
  }

  async findByIdOrThrow(id: string): Promise<Turno> {
    const t = await this.prisma.turno.findUnique({ where: { id } });
    if (!t) throw new NotFoundException(`Turno ${id} no encontrado`);
    return t;
  }

  async findBySucursal(sucursalId: string, onlyActive = true): Promise<Turno[]> {
    await this.ensureSucursal(sucursalId);
    return this.prisma.turno.findMany({
      where: { sucursalId, ...(onlyActive ? { estado: true } : {}) },
      orderBy: { orden: 'asc' },
    });
  }

  // --- privados ---

  private async ensureSucursal(sucursalId: string): Promise<void> {
    const s = await this.prisma.sucursal.findUnique({ where: { id: sucursalId } });
    if (!s) throw new NotFoundException(`Sucursal ${sucursalId} no encontrada`);
  }

  private assertShape(ini: string, fin: string, cruza: boolean): void {
    try {
      validateShape(ini, fin, cruza);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  private async assertNoOverlap(
    sucursalId: string,
    candidate: TurnoInput,
    excludeTurnoId?: string,
  ): Promise<void> {
    const other = await this.prisma.turno.findMany({
      where: {
        sucursalId,
        estado: true,
        ...(excludeTurnoId ? { NOT: { id: excludeTurnoId } } : {}),
      },
    });
    for (const o of other) {
      const oInput: TurnoInput = {
        horaInicio: o.horaInicio,
        horaFin: o.horaFin,
        cruzaMedianoche: o.cruzaMedianoche,
      };
      if (turnosOverlap(candidate, oInput)) {
        throw new BadRequestException(
          `El turno se traslapa con "${o.nombre}" (${o.horaInicio}-${o.horaFin}${o.cruzaMedianoche ? ', cruza medianoche' : ''})`,
        );
      }
    }
    if (excludeTurnoId) {
      const me = await this.prisma.turno.findUnique({ where: { id: excludeTurnoId } });
      if (me) {
        const conflicting = other.find((o) => o.orden === me.orden);
        if (conflicting) {
          throw new BadRequestException(
            `Ya existe un turno con orden ${me.orden} en esta sucursal`,
          );
        }
      }
    }
  }
}
