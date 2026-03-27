import nodemailer from "nodemailer";

/*
  transporter using Brevo SMTP
*/
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true only for 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/*
  Verify SMTP connection
*/
transporter.verify((error) => {
    if (error) {
        console.error("Brevo SMTP Connection Failed:", error);
    } else {
        console.log("Brevo SMTP is ready");
    }
});

/*
  Send Email Function
*/
export const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!to) {
            console.warn("No recipient email, skipping...");
            return;
        }

        const info = await transporter.sendMail({
            from: `"Task Manager" <${process.env.SMTP_USER}>`, // verified in Brevo
            to,
            subject,
            html,
        });

        console.log(`Email sent to ${to} | ID: ${info.messageId}`);
    } catch (error) {
        console.error(`Email failed for ${to}:`, error.message);

        // allows Inngest retry
        throw error;
    }
};