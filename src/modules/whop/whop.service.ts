import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import Whop from '@whop/sdk';

@Injectable()
export class WhopService {
  private readonly logger = new Logger(WhopService.name);
  private whopClient: Whop;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('WHOP_API_KEY') || 'mock-key';
    this.whopClient = new Whop({ apiKey });
  }

  async handleWebhook(payload: any, signature: string) {
    // Ideally, verify webhook signature here if WHOP_WEBHOOK_SECRET is set
    // For test mode, we will just parse the payload.

    this.logger.log(`Received Whop webhook: ${payload.action || payload.type}`);
    this.logger.debug(`Full webhook payload: ${JSON.stringify(payload)}`);

    const action = payload.action || payload.type;

    if (action === 'membership.went_valid') {
      await this.handleMembershipValid(payload.data || payload);
    } else if (action === 'membership.went_invalid') {
      await this.handleMembershipInvalid(payload.data || payload);
    }

    return { status: 'ok' };
  }

  async generateCheckoutLink(companyId: string, productId: string, planType: 'renewal' | 'one_time' = 'renewal', billingPeriod?: number, price?: number) {
    try {
      // Create a plan on the fly to get a checkout link
      const planPayload: any = {
        company_id: companyId,
        product_id: productId,
        plan_type: planType,
        currency: 'usd',
      };

      const finalPrice = price || 10.00; // Default to $10.00 if not provided

      if (planType === 'renewal') {
        planPayload.billing_period = billingPeriod || 30; // default to 30 days if not provided
        planPayload.renewal_price = finalPrice;
        planPayload.initial_price = finalPrice;
      } else {
        planPayload.initial_price = finalPrice;
      }

      const plan = await this.whopClient.plans.create(planPayload);
      return { checkoutUrl: (plan as any).purchase_url || (plan as any).checkout_url };
    } catch (error) {
      this.logger.error('Failed to generate checkout link', error);
      throw new Error('Failed to generate checkout link');
    }
  }

  private async handleMembershipValid(membership: any) {
    // The membership object contains plan details and user details.
    // E.g., membership.email, membership.user_id, membership.product.name, etc.
    const email = membership.email;
    const whopUserId = membership.user_id || membership.user?.id;
    const planName = (membership.product?.name || '').toLowerCase();

    if (!email) {
      this.logger.warn('Membership went valid, but no email provided in payload.');
      return;
    }

    // Determine tier and seats based on plan name
    let subscriptionTier = 'NONE';
    let seatCount = 0;

    if (planName.includes('business')) {
      subscriptionTier = 'BUSINESS';
      if (planName.includes('10')) seatCount = 10;
      else if (planName.includes('5')) seatCount = 5;
      else seatCount = 3; // Default business is 3
    } else if (planName.includes('enterprise')) {
      subscriptionTier = 'ENTERPRISE';
      seatCount = 10; // Or whatever custom logic
    } else {
      subscriptionTier = 'INDIVIDUAL';
      seatCount = 1;
    }

    // Update user in DB
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`User with email ${email} not found for membership activation.`);
      return;
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        whopUserId,
        subscriptionTier: subscriptionTier as any,
        subscriptionStatus: 'ACTIVE',
        seatCount,
      },
    });

    this.logger.log(`Activated ${subscriptionTier} subscription for ${email} with ${seatCount} seats.`);
  }

  private async handleMembershipInvalid(membership: any) {
    const email = membership.email;
    if (!email) return;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    // Revoke access
    await this.prisma.user.update({
      where: { email },
      data: {
        subscriptionStatus: 'INACTIVE',
      },
    });

    // Terminate all active sessions immediately
    await this.prisma.session.deleteMany({
      where: { userId: user.userId },
    });

    this.logger.log(`Revoked subscription and terminated sessions for ${email}.`);
  }
}
