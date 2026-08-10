import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoatController } from './goat.controller';
import { GoatService } from './goat.service';
import { Goat, GoatSchema } from './schemas/goat.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Goat.name, schema: GoatSchema }]),
    ],
    controllers: [GoatController],
    providers: [GoatService],
    exports: [GoatService],
})
export class GoatModule { }
