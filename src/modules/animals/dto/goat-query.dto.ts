import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { BreedType, GoatGender, GoatType } from './create-goat.dto';

export class GoatQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(GoatGender)
    gender?: GoatGender;

    @IsOptional()
    @IsEnum(BreedType)
    breedType?: BreedType;

    @IsOptional()
    @IsEnum(GoatType)
    type?: GoatType;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minWeight?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxWeight?: number;

    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;

    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}
