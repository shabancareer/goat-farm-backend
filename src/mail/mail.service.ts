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

    async sendEmployeeInvitationEmail(email: string, name: string, token: string, tempPassword?: string) {
        const verifyUrl = `http://localhost:5173/auth/login?verified=true&token=${token}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Goat Farm - You have been invited as an Employee',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #2e7d32;">Welcome to Goat Farm Management System, ${name}!</h2>
                    <p>You have been added to the system by your Administrator.</p>
                    ${tempPassword ? `<p style="background-color: #f5f5f5; padding: 12px; border-radius: 5px;"><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>` : ''}
                    <p>Please click the button below to verify your email address, activate your account, and set up your permanent password:</p>
                    <p style="margin: 25px 0; text-align: center;">
                        <a href="${verifyUrl}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email & Setup Account</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p><a href="${verifyUrl}" style="color: #2e7d32; word-break: break-all;">${verifyUrl}</a></p>
                    <p style="font-size: 12px; color: #777;">This invitation link will expire in 24 hours.</p>
                </div>
            `,
        });
    }
}

