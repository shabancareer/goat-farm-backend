import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organisation, OrganisationSchema } from './schemas/organization.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Organisation.name, schema: OrganisationSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [OrganizationsController],
    providers: [OrganizationsService],
    exports: [OrganizationsService],
})
export class OrganizationsModule { }
