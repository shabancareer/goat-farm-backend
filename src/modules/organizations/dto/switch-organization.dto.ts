import { IsNotEmpty, IsMongoId } from 'class-validator';

export class SwitchOrganizationDto {
    @IsNotEmpty()
    @IsMongoId()
    organizationId: string;
}
