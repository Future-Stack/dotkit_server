import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserSignUpDto } from './dto/user.singup.dto';
import { ERROR_MESSAGES } from 'src/common/constants';
import * as bcrypt from "bcrypt";
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IEnv } from 'src/config/env.config';
import { MailService } from './mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
@Injectable()
export class AuthService {

    constructor(
        private readonly prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService
    ) { }

    async hast(text: string) {
        const hash = await bcrypt.hash(text, 10);

        return hash;

    }

    async userSignUp(data: UserSignUpDto) {

        const user = await this.prisma.user.findUnique({
            where: {
                email: data.email
            }
        });

        const checkPhone = await this.prisma.user.findUnique({
            where: {
                phone: data.phone
            }
        });
        

        if (user) throw new BadRequestException(ERROR_MESSAGES.USER.USER_ALREADY_EXISTS);
        if (checkPhone) throw new BadRequestException(ERROR_MESSAGES.USER.PHONE_ALREADY_EXISTS);

        const hastPassword = await this.hast(data.password);

        const create = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: hastPassword
            },
            select: {
                userId: true,
                name: true,
                email: true,
                phone: true,
                profile: true,
                role: true
            }
        });

        return create;

    }

    async signIn(data: LoginDto) {
        const { email } = data;

        const user = await this.prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
        }

        if (user.verifidStatus === "SUSPEND") {
            throw new ForbiddenException("Account suspended");
        };

        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) throw new NotFoundException(ERROR_MESSAGES.AUTH.INVALID_PASSWORD);

        const tokens = await this.generateTokens(user.userId, user.email);


        await this.updateRefreshToken(user.userId, tokens.refreshToken);

        const { password, otp, refreshToken, ...rest } = user;

        return {
            message: "Login successful",
            tokens,
            user: rest
        };
    };

    async findUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                userId: userId
            }
        });
        if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);

        const { password, otp, refreshToken, ...rest } = user;

        return rest;
    }

    async generateTokens(userId: string, email: string) {
        const env = this.configService.get<IEnv>("env")
        const payload = { sub: userId, email };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: env?.JWT_CONFIG.JWT_SECRET,
            expiresIn: "7d"
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: env?.JWT_CONFIG.JWT_REFRESH_SECRET,
            expiresIn: "30d"
        });

        return {
            accessToken,
            refreshToken
        };
    };

    async updateRefreshToken(userId: string, refreshToken: string) {
        const hashed = await bcrypt.hash(refreshToken, 10);

        await this.prisma.user.update({
            where: { userId: userId },
            data: {
                refreshToken: hashed
            }
        });
    };

    async refreshToken(userId: string, refreshToken: string) {
        const user = await this.prisma.user.findUnique({
            where: { userId: userId }
        });

        if (!user || !user.refreshToken) {
            throw new ForbiddenException("Access denied");
        }

        const isMatch = await bcrypt.compare(
            refreshToken,
            user.refreshToken
        );

        if (!isMatch) {
            throw new ForbiddenException("Access denied");
        }

        const tokens = await this.generateTokens(user.userId, user.email);

        await this.updateRefreshToken(user.userId, tokens.refreshToken);

        return tokens;
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { userId: userId },
            data: {
                refreshToken: null
            }
        });

        return {
            message: "Logout successful"
        };
    };

    async forgotPassword(data: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (!user) {
            throw new NotFoundException("User not found with this email");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 10 * 60 * 1000;
        const otpValue = `${otp}|${expiry}`;

        await this.prisma.user.update({
            where: { email: data.email },
            data: { otp: otpValue }
        });

        await this.mailService.sendOtpEmail(user.email, otp);

        return {
            message: "OTP sent to your email successfully"
        };
    }

    async resendOtp(data: ResendOtpDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (!user) {
            throw new NotFoundException("User not found with this email");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 10 * 60 * 1000;
        const otpValue = `${otp}|${expiry}`;

        await this.prisma.user.update({
            where: { email: data.email },
            data: { otp: otpValue }
        });

        await this.mailService.sendOtpEmail(user.email, otp);

        return {
            message: "OTP resent to your email successfully"
        };
    }

    async verifyOtp(data: VerifyOtpDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (!user) {
            throw new NotFoundException("User not found");
        }

        if (!user.otp) {
            throw new BadRequestException("No OTP requested for this user");
        }

        const [dbOtp, dbExpiry] = user.otp.split('|');
        if (!dbOtp || !dbExpiry) {
            throw new BadRequestException("Invalid OTP state");
        }

        if (dbOtp !== data.otp) {
            throw new BadRequestException("Invalid OTP code");
        }

        if (Date.now() > Number(dbExpiry)) {
            throw new BadRequestException("OTP has expired");
        }

        await this.prisma.user.update({
            where: { email: data.email },
            data: { otp: null }
        });

        const env = this.configService.get<IEnv>("env");
        const payload = { email: user.email, type: "reset" };
        const token = await this.jwtService.signAsync(payload, {
            secret: env?.JWT_CONFIG.JWT_SECRET,
            expiresIn: "10m"
        });

        return {
            message: "OTP verified successfully",
            token
        };
    }

    async resetPassword(data: ResetPasswordDto) {
        const env = this.configService.get<IEnv>("env");
        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(data.token, {
                secret: env?.JWT_CONFIG.JWT_SECRET
            });
        } catch (error) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        if (!payload || payload.type !== "reset" || !payload.email) {
            throw new BadRequestException("Invalid token type");
        }

        const user = await this.prisma.user.findUnique({
            where: { email: payload.email }
        });
        if (!user) {
            throw new NotFoundException("User not found");
        }

        const hashedPassword = await this.hast(data.newPassword);

        await this.prisma.user.update({
            where: { email: payload.email },
            data: {
                password: hashedPassword,
                otp: null
            }
        });

        return {
            message: "Password reset successful"
        };
    }

    async changePassword(userId: string, data: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { userId }
        });
        if (!user) {
            throw new NotFoundException("User not found");
        }

        const isPasswordValid = await bcrypt.compare(data.oldPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException("Invalid current password");
        }

        const hashedPassword = await this.hast(data.newPassword);

        await this.prisma.user.update({
            where: { userId },
            data: {
                password: hashedPassword
            }
        });

        return {
            message: "Password changed successfully"
        };
    }
}
