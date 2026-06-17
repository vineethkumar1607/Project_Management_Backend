import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";
import { requireWorkspaceAdmin } from "./authorizationService.js";
import { ensureWorkspaceCustomer } from "./billingService.js";
import { createRazorpaySubscription } from "./razorpaySubscriptionService.js";
import { env } from "../config/env.js";

const planIds = {
    PRO: {
        MONTHLY: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
        QUARTERLY: process.env.RAZORPAY_PRO_QUARTERLY_PLAN_ID,
        YEARLY: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID,
    },

    ENTERPRISE: {
        MONTHLY: process.env.RAZORPAY_ENTERPRISE_MONTHLY_PLAN_ID,
        QUARTERLY: process.env.RAZORPAY_ENTERPRISE_QUARTERLY_PLAN_ID,
        YEARLY: process.env.RAZORPAY_ENTERPRISE_YEARLY_PLAN_ID,
    },
};

export const createSubscription = async ({ workspaceId, userId, plan, billingCycle, }) => {

    console.log({ workspaceId, userId, plan, billingCycle, });


    // Ensure the user is a workspace admin.
    await requireWorkspaceAdmin(
        workspaceId,
        userId,
        "manage billing"
    );

    // Load current workspace subscription.
    const subscription = await prisma.workspaceSubscription.findUnique({
        where: { workspaceId, },
    });

    if (!subscription) {
        throw createError(404, "Workspace subscription not found");
    }
    // If the subscription already exists and is active, prevent creating a new subscription.
    if (subscription.plan === plan && subscription.status === "ACTIVE") {
        throw createError(400, `Workspace is already subscribed to ${plan}`);
    }

    const planHierarchy = { FREE: 0, PRO: 1, ENTERPRISE: 2, };
    // Check if the requested plan is a downgrade. 
    if (planHierarchy[plan] < planHierarchy[subscription.plan]) {
        throw createError(400, "Plan downgrades are not supported");
    }

    const razorpayPlanId = planIds?.[plan]?.[billingCycle];

    if (!razorpayPlanId) {
        throw createError(500, "Billing configuration is invalid"
        );
    }


    // Ensure the workspace has a Razorpay customer.
    const customer = await ensureWorkspaceCustomer(workspaceId);

    const razorpaySubscription = await createRazorpaySubscription({
        planId: razorpayPlanId, customerId: customer.customerId,
    });

    await prisma.workspaceSubscription.update({
        where: { workspaceId },
        data: {
            pendingPlan: plan,
            pendingBillingCycle: billingCycle,
            razorpaySubscriptionId: razorpaySubscription.id,
        },
    });


    return {
        subscriptionId: razorpaySubscription.id,
        customerId: customer.customerId,
        razorpayKey: env.RAZORPAY_KEY_ID,
    };
};