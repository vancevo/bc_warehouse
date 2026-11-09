import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class ApproveUserDto {
  @IsEnum(Role)
  role: Role = Role.STAFF;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
