import { JwtAccessGuard } from './jwt-access.guard';

describe('JwtAccessGuard', () => {
  it('should be defined', () => {
    expect(new JwtAccessGuard()).toBeDefined();
  });
});
