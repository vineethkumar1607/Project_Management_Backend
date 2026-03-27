import { inngest } from "./client.js";
import prisma from "../config/prisma.js";
import { sendEmail } from "../utils/email.js";

/*
  Inngest function responsible for notifying the assigned user
  when a new task is created.

  The function relies on the database as the source of truth
  and avoids trusting event payloads for critical data such as assignee.
*/
export const sendTaskCreatedEmail = inngest.createFunction(
    { id: "send-task-created-email" },
    { event: "task/created" },

    async ({ event, step }) => {
        const { taskId, origin } = event.data;

        /*
          Fetch the latest task state from the database.
          This ensures consistency in case the task was updated
          after the event was emitted.
        */
        const task = await step.run("fetch-task", async () => {
            return prisma.task.findUnique({
                where: { id: taskId },
                include: {
                    project: true,
                    assignee: true,
                },
            });
        });

        if (!task) {
            throw new Error("Task not found");
        }

        /*
          Extract assignee information from the database.
          The system supports a single assignee per task.
        */
        const user = task.assignee;

        if (!user || !user.email) {
            console.warn("No valid assignee found for task");
            return;
        }

        /*
          Build frontend URL for navigation from email.
          Falls back to environment variable if origin is not provided.
        */
        const baseUrl = origin || process.env.FRONTEND_URL;
        const taskUrl = `${baseUrl}/task/${task.id}`;

        /*
          Format due date for human-readable display.
          Locale-based formatting improves readability for users.
        */
        const formattedDueDate = task.due_date
            ? new Date(task.due_date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : "No due date";

        /*
          Email template designed for clarity and structure.
          Includes task metadata and a call-to-action button.
        */
        const html = `
      <div style="font-family:Arial, sans-serif; background:#f4f5f7; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:white; border-radius:8px; padding:20px;">
          
          <h2 style="color:#172b4d;">🚀 New Task Assigned</h2>
          
          <p style="color:#5e6c84;">
            You have been assigned a new task. Please review the details below.
          </p>

          <div style="padding:15px; border:1px solid #dfe1e6; border-radius:6px; margin:15px 0;">
            
            <h3 style="margin:0 0 10px 0; color:#172b4d;">
              ${task.name}
            </h3>

            <p style="color:#5e6c84; margin:0 0 10px 0;">
              ${task.description || "No description provided"}
            </p>

            <p style="font-size:14px; color:#7a869a; margin:5px 0;">
              <strong>Project:</strong> ${task.project?.name || "N/A"}
            </p>

            <p style="font-size:14px; color:#7a869a; margin:5px 0;">
              <strong>Due Date:</strong> ${formattedDueDate}
            </p>

          </div>

          <a href="${taskUrl}" 
             style="
                display:inline-block;
                padding:10px 20px;
                background:#0052cc;
                color:white;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;
             ">
             👉 View Task
          </a>

          <p style="margin-top:20px; font-size:12px; color:#7a869a;">
            If you did not expect this assignment, please contact your administrator.
          </p>

        </div>
      </div>
    `;

        /*
          Send email using centralized email utility.
          Errors are propagated so that Inngest can retry the step.
        */
        await sendEmail({
            to: user.email,
            subject: `🚀 New Task in ${task.project?.name || "your project"}`,
            html,
        });

        console.log(`Email successfully sent to ${user.email}`);
    }
);

/*
  Inngest function responsible for sending a reminder email
  on the task due date.

  This function demonstrates delayed execution using Inngest
  and ensures the task state is revalidated before sending email.
*/
export const sendTaskDueReminderEmail = inngest.createFunction(
    { id: "send-task-due-reminder-email" },
    { event: "task/created" },

    async ({ event, step }) => {
        const { taskId, origin } = event.data;

        /*
          Fetch task from DB to get due date and assignee.
          Always rely on DB for latest state.
        */
        const task = await step.run("fetch-task-initial", async () => {
            return prisma.task.findUnique({
                where: { id: taskId },
                include: {
                    assignee: true,
                    project: true,
                },
            });
        });

        if (!task) return;

        /*
          If no due date exists, there is nothing to schedule.
        */
        if (!task.due_date) {
            console.log("Task has no due date, skipping reminder");
            return;
        }

        /*
          Wait until due date.
    
          step.sleepUntil pauses execution and resumes exactly at due_date.
          This avoids cron jobs and manual scheduling.
        */
        await step.sleepUntil(
            "wait-until-due-date",
            new Date(task.due_date)
        );

        /*
          Re-fetch task after delay to ensure latest state.
          This is critical because task might have changed meanwhile.
        */
        const latestTask = await step.run("fetch-task-after-wait", async () => {
            return prisma.task.findUnique({
                where: { id: taskId },
                include: {
                    assignee: true,
                    project: true,
                },
            });
        });

        if (!latestTask) return;

        /*
          If task is already completed, skip sending reminder.
        */
        if (latestTask.status === "DONE") {
            console.log("Task already completed, no reminder needed");
            return;
        }

        /*
          Extract assignee
        */
        const user = latestTask.assignee;

        if (!user || !user.email) {
            console.warn("No valid assignee for reminder");
            return;
        }

        /*
          Generate frontend URL
        */
        const baseUrl = origin || process.env.FRONTEND_URL;
        const taskUrl = `${baseUrl}/task/${latestTask.id}`;

        /*
          Format due date for display
        */
        const formattedDueDate = new Date(
            latestTask.due_date
        ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        /*
          Email template for reminder
    
          Designed to highlight urgency and due date clearly.
        */
        const html = `
      <div style="font-family:Arial, sans-serif; background:#fff3cd; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:white; border-radius:8px; padding:20px;">
          
          <h2 style="color:#856404;">⏰ Task Due Reminder</h2>
          
          <p style="color:#856404;">
            This is a reminder that your task is due today.
          </p>

          <div style="padding:15px; border:1px solid #ffeeba; border-radius:6px; margin:15px 0;">
            
            <h3 style="margin:0 0 10px 0; color:#172b4d;">
              ${latestTask.name}
            </h3>

            <p style="color:#5e6c84;">
              ${latestTask.description || "No description provided"}
            </p>

            <p style="font-size:14px; color:#7a869a;">
              <strong>Project:</strong> ${latestTask.project?.name || "N/A"}
            </p>

            <p style="font-size:14px; color:#d9534f;">
              <strong>Due Date:</strong> ${formattedDueDate}
            </p>

          </div>

          <a href="${taskUrl}" 
             style="
                display:inline-block;
                padding:10px 20px;
                background:#dc3545;
                color:white;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;
             ">
             🔴 Complete Task
          </a>

          <p style="margin-top:20px; font-size:12px; color:#6c757d;">
            Please complete the task to avoid delays.
          </p>

        </div>
      </div>
    `;

        /*
          Send reminder email
        */
        await sendEmail({
            to: user.email,
            subject: `⏰ Task Due Today: ${latestTask.name}`,
            html,
        });

        console.log(`Reminder email sent to ${user.email}`);
    }
);