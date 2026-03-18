/*
authmiddleware.js
Protects API routes by ensuring the user is authenticated.

This middleware uses Clerk's req.auth() to verify the user session.
If the user is not authenticated, the request is blocked.
*/

export const authMiddleware = async (req, res, next) => {
    try {

        // Get authentication info from Clerk
        const { userId } = await req.auth();

        // If no userId exists, user is not authenticated
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        // Attach userId to request object 
        req.userId = userId;

        // Allows request to continue to the next middleware/controller
        next();

    } catch (error) {
        console.error("Auth middleware error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });

    }
};