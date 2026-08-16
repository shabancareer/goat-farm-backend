import {
  IsEmail, IsString, MinLength, IsEnum,
  IsOptional, IsNotEmpty, IsBoolean, MaxLength,
} from 'class-validator';
import { Role } from '../enums/role.enum';

// ── Auth DTOs ─────────────────────────────────────────────────────────────────

/** Called once when the software is purchased */
export class RegisterSuperOwnerDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString() @MinLength(8)
  password: string;

  @IsString() @IsNotEmpty()
  organizationName: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString() @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsString() @IsNotEmpty()
  refreshToken: string;
}

// ── User management DTOs ──────────────────────────────────────────────────────

/** Owner/SuperOwner creates a new user and assigns their role */
export class CreateUserDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString() @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;
}

export class UpdateUserRoleDto {
  @IsString() @IsNotEmpty()
  userId: string;

  @IsEnum(Role)
  newRole: Role;
}

// ── Profile DTOs ──────────────────────────────────────────────────────────────

/** Any user updates their own profile (all fields optional) */
export class UpdateProfileDto {
  @IsString() @IsNotEmpty() @IsOptional()
  name?: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsBoolean() @IsOptional()
  isAvailable?: boolean;

  @IsString() @MaxLength(120) @IsOptional()
  statusMessage?: string;
}

/** Owner/Manager updates another user's profile — includes target userId */
export class AdminUpdateProfileDto extends UpdateProfileDto {
  @IsString() @IsNotEmpty()
  userId: string;
}

export class ChangePasswordDto {
  @IsString() @IsNotEmpty()
  currentPassword: string;

  @IsString() @MinLength(8)
  newPassword: string;
}

// ── Email Verification DTOs ───────────────────────────────────────────────────

export class VerifyEmailDto {
  @IsString() @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}