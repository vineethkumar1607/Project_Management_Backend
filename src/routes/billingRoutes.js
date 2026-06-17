import express from "express";
import { testEnsureWorkspaceCustomer, createWorkspaceSubscription, } from "../controllers/billingController.js";

const router = express.Router();

router.get("/test-customer/:workspaceId", testEnsureWorkspaceCustomer);
router.post("/subscriptions", createWorkspaceSubscription);

export default router;