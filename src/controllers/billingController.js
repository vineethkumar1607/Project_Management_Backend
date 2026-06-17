import { z } from "zod";

import { ensureWorkspaceCustomer } from "../services/billingService.js";
import { createSubscription } from "../services/subscriptionService.js";

const createSubscriptionSchema = z.object({
    workspaceId: z.string().startsWith("org_"),

    plan: z.enum([
        "PRO",
        "ENTERPRISE",
    ]),

    billingCycle: z.enum([
        "MONTHLY",
        "QUARTERLY",
        "YEARLY",
    ]),
});

export const createWorkspaceSubscription = async (req, res, next) => {
    try {

        const validatedData = createSubscriptionSchema.parse(req.body);

        const result = await createSubscription({
            ...validatedData,
            // TEMPORARY
            userId: "user_3AeeaMWhc6iJvolEhvllQN78o3W",
        });

        return res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {
        next(error);
    }
};

export const testEnsureWorkspaceCustomer = async (
    req,
    res,
    next
) => {
    try {

        const { workspaceId } = req.params;

        const result =
            await ensureWorkspaceCustomer(
                workspaceId
            );

        return res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {

        next(error);

    }
};