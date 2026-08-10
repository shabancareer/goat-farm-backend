import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

import { TokenService } from './tokens.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Organisation, OrganisationSchema } from '../organizations/schemas/organization.schema';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt-access' }),
        JwtModule.register({}), // secrets are passed per-sign call in TokenService
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Organisation.name, schema: OrganisationSchema },
        ]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        TokenService,
        JwtAccessStrategy,
        JwtRefreshStrategy,
    ],
    exports: [AuthService, TokenService],
})
export class AuthModule { }
