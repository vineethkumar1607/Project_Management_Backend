-- AlterTable
ALTER TABLE "WorkspaceSubscription" ADD COLUMN     "pendingBillingCycle" "BillingCycle",
ADD COLUMN     "pendingPlan" "SubscriptionPlan";
