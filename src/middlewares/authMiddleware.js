/*
authmiddleware.js
Protects API routes by ensuring the user is authenticated.

This middleware uses Clerk's req.auth() to verify the user session.
If the user is not authenticated, the request is blocked.
*/
import { createError } from "../utils/error.js";

export const authMiddleware = async (req, res, next) => {
    try {

        // Get authentication info from Clerk
        const { userId } = await req.auth();

        // If no userId exists, user is not authenticated
        if (!userId) {
            return next(createError(401, "Unauthorized access"));
        }

        // Attach userId to request object 
        req.userId = userId;

        // Allows request to continue to the next middleware/controller
        return next();

    } catch (error) {
        return next(error);
    }
};
