import { betterAuth } from 'better-auth';
import type { BetterAuthOptions } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma, Role } from 'database';
import { Queue } from 'bullmq';

const mailQueue = new Queue('send-mail', {
  connection: {
    host: process.env.REDIS_HOST!,
    port: Number(process.env.REDIS_PORT!),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

const authOptions: BetterAuthOptions = {
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [process.env.STOREFRONT_URL!, process.env.ADMIN_URL!],

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: true,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: Role.EMPLOYEE,
      },
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: true,
      disableSignUp: false,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const username = email.split('@')[0];
        if (type === 'email-verification' || type === 'sign-in') {
          await mailQueue.add('send-verification-email', {
            email,
            username,
            code: otp,
          });
        } else if (type === 'forget-password') {
          await mailQueue.add('send-password-reset-email', {
            email,
            username,
            code: otp,
          });
        }
      },
      otpLength: 6,
      expiresIn: 10 * 60, // 10 minutes
    }),
  ],
};

export const auth = betterAuth(authOptions);
