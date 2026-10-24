import { SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Marca una ruta con los roles permitidos. Leido por RolesGuard.
 * Ejemplo: @Roles(Rol.administrador_general, Rol.gerente_sucursal)
 */
export const Roles = (
  ...roles: Rol[]
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
