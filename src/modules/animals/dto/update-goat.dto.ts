import { PartialType } from '@nestjs/mapped-types';
import { CreateGoatDto } from './create-goat.dto';

export class UpdateGoatDto extends PartialType(CreateGoatDto) { }
