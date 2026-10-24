import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

interface MockRequest {
  user?: { id: string; correo: string; rol: string; sucursalId: string | null };
}

function makeContext(req: MockRequest): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class Dummy {},
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  const handlerCtx = (user: MockRequest['user'], rolesKey?: string[]) => {
    const ctx = makeContext({ user });
    const getAllAndOverride = reflector.getAllAndOverride.bind(reflector);
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key, _targets) => {
      if (key === ROLES_KEY) return rolesKey;
      return getAllAndOverride(key, _targets as never);
    });
    return ctx;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('permite acceso si la ruta no tiene @Roles()', () => {
    const ctx = handlerCtx(
      { id: 'u1', correo: 'u@x.com', rol: 'auditor', sucursalId: null },
      undefined,
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite acceso si el rol del usuario esta en la lista', () => {
    const ctx = handlerCtx(
      { id: 'u1', correo: 'admin@x.com', rol: 'administrador_general', sucursalId: null },
      ['administrador_general'],
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lanza ForbiddenException si el rol no esta en la lista', () => {
    const ctx = handlerCtx(
      { id: 'u1', correo: 'u@x.com', rol: 'auditor', sucursalId: null },
      ['administrador_general'],
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('lanza ForbiddenException si no hay usuario en el request', () => {
    const ctx = handlerCtx(undefined, ['administrador_general']);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('permite acceso si el usuario tiene uno de varios roles requeridos', () => {
    const ctx = handlerCtx(
      { id: 'u1', correo: 'g@x.com', rol: 'gerente_sucursal', sucursalId: 'SUC-001' },
      ['administrador_general', 'gerente_sucursal'],
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
