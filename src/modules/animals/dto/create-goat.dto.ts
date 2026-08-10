import {
    IsString,
    IsEnum,
    IsNumber,
    IsDateString,
    Min,
    Max,
    IsInt,
    IsOptional,
    IsMongoId,
    MinLength,
    MaxLength,
    IsBoolean,
    Matches,
    ValidateIf
} from 'class-validator';
import { Types } from 'mongoose';

export enum GoatGender {
    MALE = 'Male',
    FEMALE = 'Female'
}

export enum PurchaseType {
    OWN = 'Own',
    PURCHASE = 'Purchase'
}

export enum GoatType {
    BUK = 'BUK',
    WETHER = 'Wether',
    DOE = 'Doe'
}

export enum BreedType {
    BEETAL = 'Beetal',
    TEDDY = 'Teddy',
    NACHI = 'Nachi',
    DDP = 'Dera Din Panah (DDP)',
    BARBARI = 'Barbari',
    POTHWARI = 'Pothwari/Potohari',
    HAIRY = 'Hairy/Kajli'
}

export class CreateGoatDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Matches(/^[a-zA-Z0-9\s]+$/, { message: 'Animal name can only contain letters, numbers and spaces' })
    animalName: string;

    @IsEnum(GoatGender)
    gender: GoatGender;

    @IsEnum(PurchaseType)
    purchaseType: PurchaseType;

    @IsOptional()
    @IsDateString()
    dateOfBirth: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    estimatedAgeYears?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(11)
    estimatedAgeMonths?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(30)
    estimatedAgeDays?: number;

    @IsOptional()
    @IsBoolean()
    isEstimatedDOB?: boolean;

    @IsOptional()
    @IsDateString()
    purchaseDate: string;

    @IsEnum(GoatType)
    type: GoatType;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    kiddingCapacity: number;

    @IsNumber()
    tagId: number;

    @IsNumber()
    @Min(0.5)
    @Max(200)
    weight: number;

    @IsEnum(BreedType)
    breedType: BreedType;

    @IsOptional()
    @ValidateIf((o, val) => val !== null) // Skips validation if the value is explicitly null
    @IsNumber()
    motherId?: number | null;

    @IsOptional()
    @ValidateIf((o, val) => val !== null) // Skips validation if the value is explicitly null
    @IsNumber()
    fatherId?: number | null;

    @IsString()
    partition: string;

    @IsString()
    site: string;

    @ValidateIf(o => o.purchaseType === PurchaseType.PURCHASE)
    @IsNumber()
    @Min(0)
    purchasePrice: number;

    @ValidateIf(o => o.purchaseType === PurchaseType.PURCHASE)
    @IsString()
    purchaseFrom: string;

    @IsOptional()
    @IsMongoId()
    sire?: Types.ObjectId;

    @IsOptional()
    @IsMongoId()
    dam?: Types.ObjectId;
}
