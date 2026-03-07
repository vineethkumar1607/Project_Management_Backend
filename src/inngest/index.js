/**
 * index.js
 *
 * This file acts as the central registry for all
 * Inngest background functions.
 
 * Instead of importing them individually in server.js,
 * we collect them here and export them as one array.
 */

import { userCreation, userUpdation, userDeletion } from "./users.js";

export const functions = [
  userCreation,
  userUpdation,
  userDeletion,
];