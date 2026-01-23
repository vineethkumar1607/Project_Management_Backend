import { inngest } from "../client.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* 
   USER CREATE
   Triggered when a new user signs up in Clerk
   function to create the user data in the database 
   Event: clerk/user.created
 */
export const userCreation = inngest.createFunction(
    { id: "clerk-user-created" },        // unique inngest function id
    { event: "clerk/user.created" },     // event to listen for

    async ({ event }) => {              // handler
        const clerkUser = event.data;

        /*
          Clerk user object contains:
          - id
          - first_name
          - last_name
          - email_addresses[]
          - image_url
        */

        //  full name safely
        const fullName =
            [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") ||
            "User";

        await prisma.user.create({
            data: {
                id: data.id, // Clerk ID 
                name: fullName, // mapping to Prisma `name`
                email: clerkUser.email_addresses[0]?.email_address, // unique email
                image: clerkUser.image_url ?? "", // profile image
            },
        });

        return { success: true };
    }
);

/* 
   USER UPDATE
   Triggered when user updates profile in Clerk
   function to update the user data in the database 
   Event: clerk/user.updated
 */
export const userUpdation = inngest.createFunction(
    { id: "clerk-user-updated" },
    { event: "clerk/user.updated" },

    async ({ event }) => {
        const data = event.data;

        const fullName =
            [data.first_name, data.last_name].filter(Boolean).join(" ") ||
            "User";

        await prisma.user.update({
            where: {
                email: data.email_addresses[0]?.email_address,
            },
            data: {
                name: fullName,
                image: data.image_url || "",
            },
        });

        return { success: true };
    }
);

/* 
   USER DELETE
   Triggered when a user is deleted in Clerk
   function to delete the user data in the database 
   Event: clerk/user.deleted
 */
export const userDeletion = inngest.createFunction(
    { id: "clerk-user-deleted" },
    { event: "clerk/user.deleted" },

    async ({ event }) => {
        const data = event.data;

        await prisma.user.delete({
            where: { id: data.id },
        });

        return { success: true };
    }
);
