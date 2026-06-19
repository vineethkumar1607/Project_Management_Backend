import crypto from "crypto";
import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";

export const verifyWebhookSignature = (payload, signature) => {
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest("hex");

    if (expectedSignature !== signature) {
        throw createError(400, "Invalid webhook signature");
    }

    return true;
};

export const handleSubscriptionActivated = async (subscriptionData) => {

      console.log( "Subscription activation payload:", subscriptionData);
    const razorpaySubscriptionId = subscriptionData.id;

    const subscription = await prisma.workspaceSubscription.findUnique({
        where: { razorpaySubscriptionId, },
    });

    if (!subscription) {
        console.warn(`Subscription not found for Razorpay ID: ${razorpaySubscriptionId}`);
        return;
    }


    if (!subscription.pendingPlan || !subscription.pendingBillingCycle) {
        console.warn(`No pending upgrade found for subscription: ${subscription.id}`);
        return;
    }

    await prisma.workspaceSubscription.update({
        where: { id: subscription.id, },
        data: {
            plan: subscription.pendingPlan,
            billingCycle: subscription.pendingBillingCycle,
            status: "ACTIVE",

            pendingPlan: null,
            pendingBillingCycle: null,
            currentPeriodStart: new Date(subscriptionData.current_start * 1000),
            currentPeriodEnd: new Date(subscriptionData.current_end * 1000),
        },
    });

    console.log(`Subscription activated: ${subscription.id}`);
};