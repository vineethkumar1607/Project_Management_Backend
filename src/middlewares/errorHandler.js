import { ZodError } from "zod";

export const errorHandler = (err, req, res, next) => {

    // Zod validation errors
    if (err instanceof ZodError) {

        const errors = {};

        err.issues.forEach(issue => {
            errors[issue.path.join(".")] = issue.message;
        });

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    const statusCode = err.statusCode || 500;

    console.error("ERROR:", err);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};