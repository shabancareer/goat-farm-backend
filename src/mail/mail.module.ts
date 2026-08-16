import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('MAIL_HOST', 'sandbox.smtp.mailtrap.io'),
                    port: config.get<number>('MAIL_PORT', 2525),
                    secure: false,
                    auth: {
                        user: config.get<string>('MAIL_USER'),
                        pass: config.get<string>('MAIL_PASSWORD'),
                    },
                },
                defaults: {
                    from: config.get<string>('MAIL_FROM', '"Goat Farm Management" <noreply@goatfarm.com>'),
                },
            }),
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }

