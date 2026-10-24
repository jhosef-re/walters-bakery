import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvSchema, validateEnv } from './env.schema';

function fromEnv(env: Record<string, string>): Record<string, unknown> {
  return { ...env };
}

describe('env.schema', () => {
  const valid: Record<string, string> = {
    NODE_ENV: 'development',
    PORT: '3000',
    CORS_ORIGIN: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://user:pass@host:5432/db',
    JWT_ACCESS_SECRET: 'this-is-a-long-enough-secret-aaaa',
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_SECRET: 'this-is-a-long-enough-secret-bbbb',
    JWT_REFRESH_TTL: '7d',
  };

  it('accepts a complete valid env', () => {
    const result = validateEnv(fromEnv(valid));
    expect(result.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe('3000');
  });

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    const env = { ...valid };
    delete (env as Record<string, string>).JWT_ACCESS_SECRET;
    expect(() => validateEnv(fromEnv(env))).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('throws when JWT_ACCESS_SECRET is shorter than 16 chars', () => {
    expect(() =>
      validateEnv(fromEnv({ ...valid, JWT_ACCESS_SECRET: 'short' })),
    ).toThrow(/16 caracteres/);
  });

  it('throws when NODE_ENV is not a valid value', () => {
    expect(() =>
      validateEnv(fromEnv({ ...valid, NODE_ENV: 'staging' })),
    ).toThrow();
  });

  it('throws when PORT is not numeric', () => {
    expect(() => validateEnv(fromEnv({ ...valid, PORT: 'abc' }))).toThrow();
  });

  it('rejects invalid DATABASE_URL format implicitly via type', () => {
    const inst = plainToInstance(EnvSchema, fromEnv({ ...valid, DATABASE_URL: '' }));
    const errors = validateSync(inst, { skipMissingProperties: false });
    expect(errors.length).toBeGreaterThan(0);
  });
});
