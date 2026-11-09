import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };
  const config = {
    get: jest.fn((_key: string, fallback?: string) => fallback ?? 'team.brightchamps.com'),
  };
  const service = new AuthService(prisma as never, jwt as never, config as never);

  beforeEach(() => jest.clearAllMocks());

  it('only accepts the exact company email domain', async () => {
    await expect(service.register({
      fullName: 'Test User',
      email: 'user@team.brightchamps.com.example.com',
      password: 'Password@123',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('creates a valid company account in pending status', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1', email: 'user@team.brightchamps.com', fullName: 'Test User', status: 'PENDING', createdAt: new Date(),
    });
    const result = await service.register({
      fullName: ' Test User ',
      email: 'USER@team.brightchamps.com',
      password: 'Password@123',
    });
    expect(result.user.status).toBe('PENDING');
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: 'user@team.brightchamps.com', status: 'PENDING', role: 'STAFF' }),
    }));
  });

  it('does not allow a pending account to log in', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@team.brightchamps.com',
      fullName: 'Test User',
      passwordHash: await hash('Password@123', 4),
      role: 'STAFF',
      status: 'PENDING',
      mustChangePassword: false,
    });
    await expect(service.login({ email: 'user@team.brightchamps.com', password: 'Password@123' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });
});
