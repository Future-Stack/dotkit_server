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

  async handleWebhook(payload: any, signature?: string) {
    // Ideally, verify webhook signature here if WHOP_WEBHOOK_SECRET is set
    // For test mode, we will just parse the payload.
    console.log("Signature: ", signature);
    console.log("Payload: ", payload);
    // Signature verification (optional)
    const webhookSecret = this.configService.get<string>('WHOP_WEBHOOK_SECRET');
    if (!signature) {
      this.logger.warn('Webhook signature missing (signature header not provided).');
    } else if (webhookSecret) {
      const crypto = require('crypto');
      const rawBody = JSON.stringify(payload);
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (signature !== expectedSignature) {
        this.logger.warn('Invalid webhook signature.');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const action = payload.action || payload.type;

    let updatedUser: any = null;

    if (action === 'membership.went_valid' || action === 'membership.activated') {
      updatedUser = await this.handleMembershipValid(payload.data || payload);
    } else if (action === 'membership.went_invalid' || action === 'membership.deactivated' || action === 'membership.canceled') {
      updatedUser = await this.handleMembershipInvalid(payload.data || payload);
    } else if (action === 'payment.succeeded' || action === 'payment.created') {
      const paymentData = payload.data || payload;
      // Only process if it has actually been paid or if it has a paid_at date
      if (paymentData.paid_at || paymentData.status === 'succeeded' || paymentData.status === 'paid') {
        updatedUser = await this.handlePaymentSuccess(paymentData);
      }
    }

    return { status: 'ok', updatedUser };
  }

  private async handleMembershipValid(membership: any) {
    // The membership object contains plan details and user details.
    // E.g., membership.email, membership.user_id, membership.product.name, etc.
    const email = membership.email || membership.user?.email;
    const whopUserId = membership.user_id || membership.user?.id;
    const planName = (membership.product?.name || membership.product?.title || '').toLowerCase();

    // Check if this was a custom program purchase using metadata
    const programId = membership.metadata?.programId || membership.custom_fields?.programId;
    const customUserId = membership.metadata?.userId || membership.custom_fields?.userId;

    if (!email && !customUserId) {
      this.logger.warn('Membership went valid, but no email or userId provided in payload.');
      return;
    }

    let user;
    if (customUserId) {
      user = await this.prisma.user.findUnique({ where: { userId: customUserId } });
    }

    if (!user && whopUserId) {
      user = await this.prisma.user.findUnique({ where: { whopUserId } });
    }

    if (!user && email) {
      user = await this.prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      this.logger.warn(`User not found for membership activation.`);
      return;
    }

    if (programId) {
      const programName = membership.metadata?.programName || membership.plan?.title || 'Custom Program';
      this.logger.log(`User ${user.email} purchased custom program: ${programName} (ID: ${programId})`);

      const updatedUser = await this.prisma.user.update({
        where: { userId: user.userId },
        data: {
          whopUserId,
          subscriptionStatus: 'ACTIVE',
          // Assuming a custom program maps to INDIVIDUAL or keep current tier
          subscriptionTier: user.subscriptionTier === 'NONE' ? 'INDIVIDUAL' : user.subscriptionTier,
        },
      });
      return updatedUser;
    }

    // Determine tier and seats based on plan name (legacy/Whop product flow)
    let subscriptionTier = 'NONE';
    let seatCount = 0;

    if (planName.includes('business')) {
      subscriptionTier = 'BUSINESS';
      if (planName.includes('10')) seatCount = 10;
      else if (planName.includes('5')) seatCount = 5;
      else seatCount = 3; // Default business is 3
    } else if (planName.includes('enterprise')) {
      subscriptionTier = 'ENTERPRISE';
      seatCount = 10; // Minimum 10, handled by manual inquiry
    } else {
      // Default to INDIVIDUAL for standard plans or anything else
      subscriptionTier = 'INDIVIDUAL';
      seatCount = 1;
    }

    const updatedUser = await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        whopUserId,
        subscriptionTier: subscriptionTier as any,
        subscriptionStatus: 'ACTIVE',
        seatCount,
      },
    });

    this.logger.log(`Activated ${subscriptionTier} subscription for ${user.email} with ${seatCount} seats.`);
    return updatedUser;
  }

  private async handleMembershipInvalid(membership: any) {
    const email = membership.email || membership.user?.email;
    const customUserId = membership.metadata?.userId || membership.custom_fields?.userId;
    const whopUserId = membership.user_id || membership.user?.id;

    if (!email && !customUserId && !whopUserId) return;

    let user;
    if (customUserId) {
      user = await this.prisma.user.findUnique({ where: { userId: customUserId } });
    }

    if (!user && whopUserId) {
      user = await this.prisma.user.findUnique({ where: { whopUserId } });
    }

    if (!user && email) {
      user = await this.prisma.user.findUnique({ where: { email } });
    }

    if (!user) return;

    // Revoke access
    const updatedUser = await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        subscriptionStatus: 'INACTIVE',
      },
    });

    // Terminate all active sessions immediately
    await this.prisma.session.deleteMany({
      where: { userId: user.userId },
    });

    this.logger.log(`Revoked subscription and terminated sessions for ${user.email}.`);
    return updatedUser;
  }

  private async handlePaymentSuccess(payment: any) {
    const programId = payment.metadata?.programId;
    const customUserId = payment.metadata?.userId;
    const email = payment.user?.email;
    const whopUserId = payment.user?.id;

    if (!customUserId && !email && !whopUserId) {
      this.logger.warn('Payment succeeded, but no email or userId provided in payload.');
      return;
    }

    let user;
    if (customUserId) {
      user = await this.prisma.user.findUnique({ where: { userId: customUserId } });
    }

    if (!user && whopUserId) {
      user = await this.prisma.user.findUnique({ where: { whopUserId } });
    }

    if (!user && email) {
      user = await this.prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      this.logger.warn(`User not found for payment success.`);
      return;
    }

    const programName = payment.metadata?.programName || payment.product?.title || 'Custom Program';
    this.logger.log(`User ${user.email} successfully paid for custom program: ${programName} (ID: ${programId || 'unknown'})`);

    const updatedUser = await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        whopUserId: payment.user?.id || user.whopUserId,
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: user.subscriptionTier === 'NONE' ? 'INDIVIDUAL' : user.subscriptionTier,
      },
    });

    return updatedUser;
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getUserByWhopId(whopUserId: string) {
    return this.prisma.user.findUnique({ where: { whopUserId } });
  }

}
