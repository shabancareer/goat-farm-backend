// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    async sendVerificationEmail(email: string, name: string, token: string) {
        const verifyUrl = `http://localhost:3000/auth/verify-email?token=${token}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Goat Farm - Verify Your Email Address',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Welcome to Goat Farm System, ${name}!</h2>
                    <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
                    <p style="margin: 25px 0;">
                        <a href="${verifyUrl}" style="background-color: #2e7d32; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
                    </p>
                    <p>Or copy and paste this link in your browser:</p>
                    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                    <p>This verification link will expire in 24 hours.</p>
                </div>
            `,
        });
    }
}

