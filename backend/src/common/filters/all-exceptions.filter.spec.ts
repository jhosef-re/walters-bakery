import { ArgumentsHost, BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface MockResponse {
  statusCode: number;
  body: Record<string, unknown> | null;
  status: (code: number) => MockResponse;
  json: (b: Record<string, unknown>) => MockResponse;
}

function makeHost(): {
  host: ArgumentsHost;
  res: MockResponse;
} {
  const status = (code: number): MockResponse => {
    res.statusCode = code;
    return res;
  };
  const json = (b: Record<string, unknown>): MockResponse => {
    res.body = b;
    return res;
  };
  const res: MockResponse = {
    statusCode: 200,
    body: null,
    status,
    json,
  };

  const req = { url: '/api/test', method: 'GET' };
  const host: ArgumentsHost = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
      getNext: () => undefined,
    }),
  } as unknown as ArgumentsHost;

  return { host, res };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    // silenciar el logger durante tests
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formatea errores HTTP 4xx con cuerpo unificado', () => {
    const { host, res } = makeHost();
    filter.catch(new BadRequestException('campo invalido'), host);
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'campo invalido',
      path: '/api/test',
    });
    expect(res.body).toHaveProperty('timestamp');
  });

  it('mapea errores desconocidos a 500', () => {
    const boom = new Error('algo revento');
    const { host, res } = makeHost();
    filter.catch(boom, host);
    expect(res.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.body).toMatchObject({
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      path: '/api/test',
    });
  });

  it('respeta getStatus() de HttpException para tipos no BadRequest', () => {
    const { host, res } = makeHost();
    filter.catch(new HttpException('forbidden', 403), host);
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ message: 'forbidden' });
  });
});
