import { verifyWebhookSignature, handleSubscriptionActivated, } from "../services/webhookService.js";

export const handleRazorpayWebhook = async (req, res, next) => {
    try {
        const signature = req.headers["x-razorpay-signature"];

        verifyWebhookSignature(req.body, signature);

        const payload = JSON.parse(req.body.toString());

        console.log("Webhook received");

        const event = payload.event;

        console.log(`Received Razorpay webhook: ${event}`);

        switch (event) {

            case "subscription.authenticated":
                console.log("SUBSCRIPTION AUTHENTICATED");
                console.log(payload.payload.subscription.entity);
                break;

            case "subscription.activated":
                console.log("SUBSCRIPTION ACTIVATED");

                await handleSubscriptionActivated(
                    payload.payload.subscription.entity
                );
                break;

            case "subscription.pending":
                console.log("SUBSCRIPTION PENDING");
                console.log(payload.payload.subscription.entity);
                break;

            case "subscription.halted":
                console.log("SUBSCRIPTION HALTED");
                console.log(payload.payload.subscription.entity);
                break;

            case "subscription.charged":
                console.log("SUBSCRIPTION CHARGED");
                console.log(payload.payload.subscription.entity);
                break;

            default:
                console.log(`Unhandled webhook event: ${event}`);
                break;
        }

        return res.status(200).json({ success: true, message: "Webhook processed successfully", });
    } catch (error) {
        next(error);
    }
};


// export const testActivation = async (req, res, next) => {
//     try {
//         await handleSubscriptionActivated({
//             id: "sub_T3UwMKi5XLPyLg",
//             current_start: Math.floor(Date.now() / 1000),
//             current_end: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Test activation completed",
//         });
//     } catch (error) {
//         next(error);
//     }
// };