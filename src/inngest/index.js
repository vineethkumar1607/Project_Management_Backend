import { Inngest } from "inngest";
import { userCreation, userUpdation, userDeletion } from "./users.js";

// client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

//  inngest function to save the user data to the database
// All inngest functions registered
export const functions = [
    userCreation,
    userUpdation,
    userDeletion,
];