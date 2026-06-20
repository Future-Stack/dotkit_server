import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserSignUpDto } from './dto/user.singup.dto';
import { SUCCESS_MESSAGES } from 'src/common/constants';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';
import { GetCurrentUser } from 'src/common/decorator/get-current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles("ELEVATOR")
  // @Get("elevator-data")
  // getElevatorData() {
  //   return "Only elevator";
  // }

  @Post("user-singup")
  @ApiOperation({ summary: "User SignUp (Only Can User)" })
  async userSignUp(@Body() data: UserSignUpDto) {
    const result = await this.authService.userSignUp(data);

    return {
      success: true,
      message: SUCCESS_MESSAGES.AUTH.REGISTRATION_SUCCESS,
      data: result
    }
  }

  @Post("login")
  @ApiOperation({ summary: "User, Elevetor & Admin Login" })
  async signIn(@Body() data: LoginDto) {
    const result = await this.authService.signIn(data);

    return {
      success: true,
      result
    }

  }

  @Post("refresh-token")
  async refreshToken(@Body() body: RefreshTokenDto) {
    const { userId, refreshToken } = body;

    const result = await this.authService.refreshToken(
      userId,
      refreshToken
    );

    return {
      success: true,
      message: "Token refreshed successfully",
      data: result
    };
  }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@GetCurrentUser() user: any) {
    const userId = user?.userId;

    const result = await this.authService.findUser(userId)

    return {
      success: true,
      user: result
    }
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Forgot Password (generates OTP and sends to email)" })
  async forgotPassword(@Body() data: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(data);
    return {
      success: true,
      ...result
    };
  }

  @Post("resend-otp")
  @ApiOperation({ summary: "Resend OTP to email" })
  async resendOtp(@Body() data: ResendOtpDto) {
    const result = await this.authService.resendOtp(data);
    return {
      success: true,
      ...result
    };
  }

  @Post("verify-otp")
  @ApiOperation({ summary: "Verify OTP and return temporary password reset token" })
  async verifyOtp(@Body() data: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(data);
    return {
      success: true,
      ...result
    };
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password using temporary reset token" })
  async resetPassword(@Body() data: ResetPasswordDto) {
    const result = await this.authService.resetPassword(data);
    return {
      success: true,
      ...result
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @ApiOperation({ summary: "Change password (logged in user)" })
  async changePassword(@GetCurrentUser() user: any, @Body() data: ChangePasswordDto) {
    const userId = user?.userId;
    const result = await this.authService.changePassword(userId, data);
    return {
      success: true,
      ...result
    };
  }
}
