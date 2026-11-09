import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { AuthUser } from '../common/auth.types';
import { ChangePasswordDto, LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const domain = email.split('@')[1];
    const allowedDomain = this.config.get('ALLOWED_EMAIL_DOMAIN', 'team.brightchamps.com').toLowerCase();
    if (domain !== allowedDomain) {
      throw new BadRequestException(`Chỉ chấp nhận email @${allowedDomain}.`);
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email này đã được đăng ký.');

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        passwordHash: await hash(dto.password, 12),
        status: 'PENDING',
        role: 'STAFF',
      },
      select: { id: true, email: true, fullName: true, status: true, createdAt: true },
    });
    return { message: 'Đăng ký thành công. Tài khoản đang chờ admin duyệt.', user };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }
    if (user.status === 'PENDING') {
      throw new UnauthorizedException('Tài khoản đang chờ admin duyệt.');
    }
    if (user.status !== 'APPROVED') {
      throw new UnauthorizedException('Tài khoản đã bị từ chối hoặc khóa.');
    }
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return {
      accessToken,
      user: this.publicUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.publicUser(user);
  }

  async changePassword(authUser: AuthUser, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: authUser.id } });
    if (!(await compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng.');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(dto.newPassword, 12), mustChangePassword: false },
    });
    return { message: 'Đổi mật khẩu thành công.' };
  }

  private publicUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    mustChangePassword: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
