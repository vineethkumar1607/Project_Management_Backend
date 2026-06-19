import prisma from "../config/prisma.js";
import { razorpayClient } from "../config/razorpay.js";
import { createError } from "../utils/error.js";

// This function ensures that a Razorpay customer exists for the given workspace. If not, it creates one and stores the customer ID in the database.
export const ensureWorkspaceCustomer = async (workspaceId) => {
  
    if (!workspaceId) {
        throw createError(400,"Workspace ID is required");
    }

  //  Checks if a subscription record exists for the workspace and if it has a Razorpay customer ID
    const subscription =await prisma.workspaceSubscription.findUnique({
            where: {workspaceId, },
            select: {razorpayCustomerId: true,},
        });

 
    if (!subscription) {
        throw createError( 404, "Workspace subscription not found");
    }

// If customer ID already exists, return it 
    if (subscription.razorpayCustomerId) {

        return {
            customerId: subscription.razorpayCustomerId,
            isExisting: true,
        };
    }


   // Fetchs workspace details to create Razorpay customer
    const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId,},
            select: {id: true,name: true, },
        });

    if (!workspace) {
        throw createError(404,"Workspace not found" );
    }


// Creates Razorpay customer and store the customer ID
    try {
        const customer =  await razorpayClient.customers.create({
                name: workspace.name,
                fail_existing: 0,
            });

       
       // Store the Razorpay customer ID in our database
        await prisma.workspaceSubscription.update({
            where: {workspaceId},
            data: {razorpayCustomerId:customer.id,},
        });

      // Return the Razorpay customer ID
        return {
            customerId: customer.id,
            isExisting: false,
        };

    } catch (error) {

        console.error("RAZORPAY CUSTOMER CREATION ERROR:",error );
        throw createError(500,"Failed to initialize billing" );
    }
};