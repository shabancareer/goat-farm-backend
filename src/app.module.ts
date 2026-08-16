import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoatModule } from './modules/animals/goat.module';
import { AuthModule } from './modules/auth/auth.module';

import { JwtAccessGuard } from './common/guards/jwt-access.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Connect to MongoDB Atlas
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        console.log('🔄 Connecting to MongoDB Atlas...');
        console.log('📡 Connection string:', uri?.replace(/:[^:]*@/, ':****@')); // Hide password in logs
        return {
          uri: uri,
          dbName: configService.get<string>('MONGODB_DB_NAME'),
          connectionFactory: (connection) => {
            console.log('✅ Successfully connected to MongoDB Atlas!');
            console.log(`📊 Database: ${connection.name}`);
            console.log(`🖥️  Host: ${connection.host}`);
            return connection;
          },
        };
      },
    }),

    // ── Serve uploaded avatars as static files ────────────────────────────
    // Access at: GET /api/v1/uploads/avatars/<filename>
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/api/v1/uploads',
      serveStaticOptions: { index: false },
    }),

    // Enable scheduling for task runner
    ScheduleModule.forRoot(),

    // Import your modules
    GoatModule,
    AuthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAccessGuard },   // 1st: verify access token
    { provide: APP_GUARD, useClass: RolesGuard },        // 2nd: check role level
    { provide: APP_GUARD, useClass: PermissionsGuard },  // 3rd: check permissions
  ],
})
export class AppModule { }
