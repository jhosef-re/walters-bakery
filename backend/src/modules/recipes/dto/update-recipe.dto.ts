import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { RecetaDetalleInput } from './create-recipe.dto';

/**
 * Reemplazo del detalle de la receta vigente.
 * Semantica PUT: si viene `detalle`, se sustituye por completo.
 * Si no viene, no-op.
 *
 * No se permite cambiar `productoTerminadoId` (identidad de la receta).
 * Para cambios mayores (nuevo producto o cambio de receta base) usar
 * POST /api/recipes/:id/clone y archivar la anterior.
 */
export class UpdateRecetaDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecetaDetalleInput)
  detalle?: RecetaDetalleInput[];
}
