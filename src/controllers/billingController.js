import { ensureWorkspaceCustomer } from "../services/billingService.js";

export const testEnsureWorkspaceCustomer = async (req, res, next) => {
    try {

        const { workspaceId } = req.params;

        const result = await ensureWorkspaceCustomer(workspaceId);

        res.status(200).json({ success: true, data: result });

    } catch (error) {

        next(error);

    }
};