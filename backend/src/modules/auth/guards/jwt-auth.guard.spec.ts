import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

function makeContext(): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class Dummy {},
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('permite acceso si la ruta esta marcada con @Public() (handler)', () => {
    const ctx = makeContext();
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === IS_PUBLIC_KEY ? true : undefined,
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('delega al AuthGuard de passport si la ruta no es publica', () => {
    const ctx = makeContext();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    // canActivate debe invocar super.canActivate (la estrategia jwt-access
    // real) y NO devolver true inmediato como hace en el caso publico.
    // Espiamos el metodo del padre a traves del prototipo de la subclase.
    const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(guard));
    const parentSpy = vi
      .spyOn(parentProto as never, 'canActivate')
      .mockReturnValue(true as never);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(parentSpy).toHaveBeenCalledWith(ctx);
  });

  it('permite acceso si @Public() esta en el class aunque no en el handler', () => {
    const ctx = makeContext();
    // getAllAndOverride recibe [handler, class]; devolvemos true cuando
    // el reflector pregunta por IS_PUBLIC_KEY sin importar el target.
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === IS_PUBLIC_KEY ? true : undefined,
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
