import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number(),

    NODE_ENV: z.enum(["development", "production",]),

    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),

    CLERK_PUBLISHABLE_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),

    INNGEST_DEV: z.string().optional(),
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),

    SENDER_EMAIL: z.string().email(),

    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number(),

    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),

    FRONTEND_URL: z.string().url(),

    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

    RAZORPAY_PRO_MONTHLY_PLAN_ID: z.string().min(1),
    RAZORPAY_PRO_QUARTERLY_PLAN_ID: z.string().min(1),
    RAZORPAY_PRO_YEARLY_PLAN_ID: z.string().min(1),

    RAZORPAY_ENTERPRISE_MONTHLY_PLAN_ID: z.string().min(1),
    RAZORPAY_ENTERPRISE_QUARTERLY_PLAN_ID: z.string().min(1),
    RAZORPAY_ENTERPRISE_YEARLY_PLAN_ID: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {

    console.error("\n Invalid environment configuration\n");

    Object.entries(result.error.flatten().fieldErrors).forEach(([key, errors]) => {

        console.error(`• ${key}: ${errors.join(", ")}`)
    });

    console.error("\nFix the above environment variables and restart the server.\n");

    process.exit(1);
}

export const env = result.data;