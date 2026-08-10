import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  it('should be defined', () => {
    expect(new PermissionsGuard({} as any)).toBeDefined();
  });
});
