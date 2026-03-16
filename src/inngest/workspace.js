import { inngest } from "./client.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/*
Handles workspace creation when a new organization is created in Clerk.

This function synchronizes the Clerk organization with our internal
workspace model and ensures the creator becomes an ADMIN member.

The use of upsert makes the operation idempotent and safe for retries,
which is important in event-driven systems like Inngest.
*/
export const workspaceCreation = inngest.createFunction(
    { id: "workspace-created-from-clerk" },

    // Fired when Clerk emits the organization.created event
    { event: "clerk/organization.created" },

    async ({ event, step }) => {

        // Organization payload coming from Clerk
        const org = event.data;

        /*
        Create or update the workspace.
    
        Upsert guarantees idempotency:
        - If the workspace does not exist → it is created
        - If it already exists → metadata is updated
    
        This protects the system against duplicate events or retries.
        */
        const workspace = await step.run("upsert-workspace", async () => {
            return prisma.workspace.upsert({
                where: { id: org.id },

                update: {
                    name: org.name,
                    slug: org.slug,
                    imageUrl: org.image_url ?? "",
                },

                create: {
                    id: org.id,
                    name: org.name,
                    slug: org.slug,
                    ownerId: org.created_by,
                    imageUrl: org.image_url ?? "",
                },
            });
        });

        /*
        Ensure the organization creator is also a workspace member.
    
        Even though the user is the workspace owner, the membership
        record is required for permission checks and workspace queries.
    
        Upsert prevents duplicate membership entries if the event
        is retried by Inngest.
        */
        await step.run("add-owner-as-member", async () => {
            return prisma.workspaceMember.upsert({
                where: {
                    userId_workspaceId: {
                        userId: org.created_by,
                        workspaceId: org.id,
                    },
                },

                update: {},

                create: {
                    userId: org.created_by,
                    workspaceId: org.id,
                    role: "ADMIN",
                },
            });
        });

        // Return metadata useful for debugging and execution logs
        return {
            success: true,
            workspaceId: workspace.id,
        };
    }
);



/*
Handles workspace metadata updates when a Clerk organization changes.

Whenever properties like name, slug, or image are modified in Clerk,
this function keeps the internal workspace record synchronized.
*/
export const workspaceUpdated = inngest.createFunction(
    { id: "workspace-updated-from-clerk" },

    // Fired when Clerk emits the organization.updated event
    { event: "clerk/organization.updated" },

    async ({ event, step }) => {

        const org = event.data;

        /*
        Update workspace metadata to reflect the latest state
        from Clerk. Since the workspace is guaranteed to exist,
        a direct update operation is sufficient here.
        */
        await step.run("update-workspace", async () => {
            return prisma.workspace.update({
                where: { id: org.id },
                data: {
                    name: org.name,
                    slug: org.slug,
                    imageUrl: org.image_url ?? "",
                },
            });
        });
    }
);




/*
Handles workspace deletion when a Clerk organization is removed.

This ensures our internal database stays consistent with Clerk.
When an organization is deleted, the corresponding workspace
is removed from our database as well.
*/
export const workspaceDeleted = inngest.createFunction(
    { id: "workspace-deleted-from-clerk" },

    // Fired when Clerk emits the organization.deleted event
    { event: "clerk/organization.deleted" },

    async ({ event, step }) => {

        // Organization payload coming from Clerk
        const org = event.data;

        /*
        Delete the workspace associated with the organization.
    
        Because of cascading relations defined in Prisma schema,
        related entities like projects, members, tasks, etc
        will also be deleted automatically depending on the
        onDelete configuration.
        */
        await step.run("delete-workspace", async () => {
            return prisma.workspace.delete({
                where: { id: org.id }
            });
        });

        return {
            success: true,
            workspaceId: org.id
        };
    }
);



/*
Synchronizes organization membership from Clerk into the WorkspaceMember table.

Whenever a user joins an organization in Clerk, this event ensures that
the corresponding workspace membership exists in the database.

The function is idempotent and retry-safe because it uses upsert with
a composite unique key (userId + workspaceId).
*/
export const workspaceMemberCreated = inngest.createFunction(
    { id: "workspace-member-created-from-clerk" },

    // Triggered when a user joins a Clerk organization
    { event: "clerk/organizationMembership.created" },

    async ({ event, step }) => {

        // Membership payload received from Clerk
        const membership = event.data;

        // Map Clerk role to internal WorkspaceRole enum
        const role =
            membership.role === "org:admin" ? "ADMIN" : "MEMBER";

        /*
        Insert or update workspace membership.
    
        The composite unique key ensures one user cannot have
        multiple memberships in the same workspace.
        */
        await step.run("upsert-workspace-member", async () => {
            return prisma.workspaceMember.upsert({
                where: {
                    userId_workspaceId: {
                        userId: membership.public_user_data.user_id,
                        workspaceId: membership.organization.id,
                    },
                },

                update: {
                    role,
                },

                create: {
                    userId: membership.public_user_data.user_id,
                    workspaceId: membership.organization.id,
                    role,
                },
            });
        });

        return { success: true };
    }
);