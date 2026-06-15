import express from "express";
import { testEnsureWorkspaceCustomer } from "../controllers/billingController.js";

const router = express.Router();

router.get(
    "/test-customer/:workspaceId",
    testEnsureWorkspaceCustomer
);

export default router;