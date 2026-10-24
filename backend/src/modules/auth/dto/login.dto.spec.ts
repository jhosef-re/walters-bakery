import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('acepta correo valido + password >= 6', () => {
    const dto = plainToInstance(LoginDto, {
      correo: 'admin@walters.local',
      password: 'admin123',
    });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza correo no email', () => {
    const dto = plainToInstance(LoginDto, { correo: 'no-email', password: 'admin123' });
    const errors = validateSync(dto);
    expect(errors.some((e) => e.property === 'correo')).toBe(true);
  });

  it('rechaza password < 6', () => {
    const dto = plainToInstance(LoginDto, { correo: 'admin@walters.local', password: 'short' });
    const errors = validateSync(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
