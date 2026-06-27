import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { WhopService } from './whop.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { GenerateCheckoutLinkDto } from './dto/generate-checkout-link.dto';

@ApiTags('Whop Webhooks')
@Controller('whop')
export class WhopController {
  constructor(private readonly whopService: WhopService) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Whop webhooks (e.g., membership.went_valid)' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('whop-signature') signature: string,
  ) {
    return this.whopService.handleWebhook(payload, signature);
  }

  @Post('checkout-link')
  @ApiOperation({ summary: 'Generate a checkout link for a plan' })
  async generateCheckoutLink(
    @Body() body: GenerateCheckoutLinkDto,
  ) {
    return this.whopService.generateCheckoutLink(body.companyId, body.productId, body.planType, body.billingPeriod, body.price);
  }
}
