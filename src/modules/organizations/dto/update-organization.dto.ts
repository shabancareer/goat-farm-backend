import { IsOptional, IsString, IsBoolean, MinLength } from 'class-validator';

export class UpdateOrganizationDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
