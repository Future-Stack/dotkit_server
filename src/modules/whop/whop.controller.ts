import { Controller, Post, Body, Headers, HttpCode, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhopService } from './whop.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Query } from '@nestjs/common';

@ApiTags('Whop Webhooks')
@Controller('whop')
export class WhopController {
  constructor(
    private readonly whopService: WhopService,
    private readonly configService: ConfigService,
  ) { }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Whop webhooks (e.g., membership.went_valid)' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('whop-signature') signature?: string,
  ) {
    return this.whopService.handleWebhook(payload, signature);
  }

  @Get('success')
  @ApiOperation({ summary: 'Return success with optional user info' })
  async handlePaymentSuccessRedirect(@Query('email') email?: string, @Query('whopUserId') whopUserId?: string) {
    let user: any = null;
    if (email) {
      user = await this.whopService.getUserByEmail(email);
    } else if (whopUserId) {
      user = await this.whopService.getUserByWhopId(whopUserId);
    }
    if (user) {
      return { success: true, user };
    }
    return { success: true };
  }

  @Get('cancel')
  @ApiOperation({ summary: 'Redirect after cancelled payment' })
  handlePaymentCancelRedirect() {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    // return res.redirect(`${frontendUrl}/payment-cancelled`);
    return {
      success: false
    };
  }
}
