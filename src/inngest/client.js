/**
 * client.js
 *
 * This file initializes the Inngest client.
 * The client is responsible for sending and receiving events.
 *
 * Keeping it separate avoids circular dependencies
 * and keeps the architecture clean.
 */

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "project-management",
});