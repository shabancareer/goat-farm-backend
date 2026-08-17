import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    name: string;
}
