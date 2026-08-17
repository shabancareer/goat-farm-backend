import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    statusMessage?: string;
}
