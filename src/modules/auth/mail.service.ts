import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { IEnv } from 'src/config/env.config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;
  private sendGridApiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const env = this.configService.get<IEnv>('env');
    const emailConfig = env?.SMTP_EMAIL_CONFIG;

    if (!emailConfig) {
      throw new Error('SMTP email configuration is missing');
    }

    this.fromEmail = emailConfig.EMAIL_FROM;
    this.fromName = emailConfig.EMAIL_FROM_NAME;
    this.sendGridApiKey = process.env.SENDGRID_API_KEY;

    // Initialize SMTP transporter as a fallback
    this.transporter = nodemailer.createTransport({
      host: emailConfig.EMAIL_HOST,
      port: Number(emailConfig.EMAIL_PORT) || 587,
      secure: Number(emailConfig.EMAIL_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: emailConfig.EMAIL_USER,
        pass: emailConfig.EMAIL_PASSWORD,
      },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333333; text-align: center;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your account. Use the following 6-digit One-Time Password (OTP) to proceed with resetting your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background-color: #F3F4F6; padding: 10px 20px; border-radius: 5px; border: 1px solid #E5E7EB;">
            ${otp}
          </span>
        </div>
        <p>This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777777; text-align: center;">
          This is an automated email, please do not reply directly.
        </p>
      </div>
    `;

    // If SendGrid API Key is configured, use the Web API (sends via HTTPS on port 443)
    if (this.sendGridApiKey && this.sendGridApiKey !== 'your_sendgrid_api_key_here') {
      try {
        await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [
              {
                to: [{ email: to }],
              },
            ],
            from: {
              email: this.fromEmail,
              name: this.fromName,
            },
            subject: 'Password Reset OTP Code',
            content: [
              {
                type: 'text/html',
                value: htmlContent,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${this.sendGridApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );
        console.log(`Email sent via SendGrid Web API successfully to ${to}`);
        return;
      } catch (error) {
        console.error('Failed to send email via SendGrid Web API:', error.response?.data || error.message);
        throw new InternalServerErrorException('Failed to send verification email via API');
      }
    }

    // Fallback to SMTP
    console.log('SendGrid API Key not configured or empty. Falling back to SMTP...');
    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to,
      subject: 'Password Reset OTP Code',
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent via SMTP successfully to ${to}`);
    } catch (error) {
      console.error('Failed to send OTP email via SMTP:', error);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }
}
