import { razorpayClient } from "../config/razorpay.js";
import { createError } from "../utils/error.js";

export const createRazorpaySubscription = async ({ planId, 
    // customerId, 
}) => {
    try {
        const subscription = await razorpayClient.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 100,
            // customer_id: customerId,
        });

        console.log("RAZORPAY SUBSCRIPTION", subscription);

        return subscription;

    } catch (error) {
        console.error("RAZORPAY SUBSCRIPTION CREATION ERROR:", error);

        throw createError(500, "Failed to create subscription");
    }
};