import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

function makeAuth() {
  const users: any[] = [];
  const prisma: any = {
    user: {
      findUnique: jest.fn(async ({ where }: any) => users.find((u) => u.email === where.email || u.id === where.id) ?? null),
      create: jest.fn(async ({ data }: any) => {
        const u = { id: users.length + 1, role: 'customer', createdAt: new Date(), phone: null, ...data };
        users.push(u);
        return u;
      }),
    },
  };
  const jwt = new JwtService({ secret: 'test' });
  const config: any = { get: (_: string, d: string) => d };
  return { service: new AuthService(prisma, jwt, config), users, jwt };
}

describe('AuthService', () => {
  it('registers with a hashed password and returns a token without the hash', async () => {
    const { service, users, jwt } = makeAuth();
    const res = await service.register({ fullName: 'Test', email: 'Test@Mail.com', password: 'secret1' });
    expect(users[0].email).toBe('test@mail.com');
    expect(users[0].passwordHash).not.toBe('secret1');
    expect(res.user).not.toHaveProperty('passwordHash');
    expect(jwt.verify(res.accessToken).sub).toBe(1);
  });

  it('rejects duplicate emails', async () => {
    const { service } = makeAuth();
    await service.register({ fullName: 'A', email: 'a@a.com', password: 'secret1' });
    await expect(service.register({ fullName: 'B', email: 'a@a.com', password: 'secret1' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('logs in with the right password only', async () => {
    const { service } = makeAuth();
    await service.register({ fullName: 'A', email: 'a@a.com', password: 'secret1' });
    await expect(service.login({ email: 'a@a.com', password: 'secret1' })).resolves.toHaveProperty('accessToken');
    await expect(service.login({ email: 'a@a.com', password: 'wrong!' })).rejects.toThrow(UnauthorizedException);
  });
});
