import { Reflector } from '@nestjs/core';
import { JwtAccessGuard } from './jwt-access.guard';

describe('JwtAccessGuard', () => {
  it('should be defined', () => {
    const reflector = new Reflector();
    expect(new JwtAccessGuard(reflector)).toBeDefined();
  });
});
