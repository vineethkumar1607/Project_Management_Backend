import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

/**
 * Step 1: Redirect user to Google OAuth consent screen
 * -----------------------------------------------
 * This endpoint does NOT log the user in.
 * It simply redirects them to Google with the proper
 * permissions (scope) and with our callback URL.
 */
router.get("/google", (req, res) => {
    // Google OAuth settings
    const redirectUri = `${process.env.SERVER_URL}/auth/google/callback`;

    const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";

    // These are the required query parameters for Google OAuth
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,   // Your Google OAuth Client ID
        redirect_uri: redirectUri,                // Backend callback URL
        response_type: "code",                    // Google will return ?code= in redirect
        scope: [
            "openid",
            "profile",
            "email",
        ].join(" "),                               // Space-separated scopes
        access_type: "offline",                    // Needed to get refresh_token once
        prompt: "consent"                          // Force Google to show account chooser
    });

    // Redirect the user to Google for login
    res.redirect(`${googleAuthUrl}?${params.toString()}`);
});

export default router;
