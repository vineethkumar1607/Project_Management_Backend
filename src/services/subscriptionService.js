import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";
import { requireWorkspaceAdmin } from "./authorizationService.js";

export const createSubscription = async ({ workspaceId, userId, plan, billingCycle, }) => {

    console.log({ workspaceId, userId, plan, billingCycle, });


    // Ensure the user is a workspace admin.
    await requireWorkspaceAdmin(
        workspaceId,
        userId,
        "manage billing"
    );

    // 
    const subscription = await prisma.workspaceSubscription.findUnique({
        where: { workspaceId, },
    });

    if (!subscription) {
        throw createError(404, "Workspace subscription not found");
    }
    return {
        message: "Workspace authorization successful",
        currentPlan: subscription.plan,
        currentStatus: subscription.status,
        requestedPlan: plan,
        requestedBillingCycle: billingCycle,
    };
};