import nodemailer from "nodemailer";

export default function createTransporter() {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    transporter.verify((error, success) => {
        if (error) {
            console.error("Error connecting to SMTP server:", error);
        } else {
            console.log("SMTP server is ready to take messages:", success);
        }
    });

    return transporter;
};

