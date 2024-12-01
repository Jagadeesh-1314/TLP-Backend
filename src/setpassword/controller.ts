import cron from "node-cron";
import { Response, Request } from "express";
import nodemailer from "nodemailer";
import * as logger from "./../services/logger";
import { addMinutes, format, parse } from 'date-fns';
import md5 from "md5";
import dbQuery from "../services/db";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function getAllRollNumbers(): Promise<{ rollno: string; name: string }[]> {
  try {
    const query = `SELECT rollno, name FROM studentinfo'`;
    const result = await dbQuery(query);

    return result.map((row: any) => ({
      rollno: row.rollno,
      name: row.name,
    }));
  } catch (error) {
    logger.log("error", `Failed to fetch roll numbers: ${error}`);
    throw new Error("Database error");
  }
}

async function sendEmails() {
  try {
    const studentList = await getAllRollNumbers();

    for (const student of studentList) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: `${student.rollno}@gcet.edu.in`,
        subject: "Important: Visit the Feedback Application",
        html: `
          <p>Dear ${student.name},</p>

          <p>We are excited to introduce <strong>TLP - Teach Learning Progress</strong>, a platform designed to enhance education through effective feedback.</p>

          <h4>Why TLP?</h4>
          <ul>
            <li>Streamlines feedback between students and teachers.</li>
            <li>Provides insights for improving teaching strategies.</li>
            <li>Delivers detailed performance analytics.</li>
            <li>Simple, user-friendly interface.</li>
          </ul>

          <h4>To get started, please visit the feedback application at:</h4>
          <p><a href="https://tlpgcet.github.io" target="_blank">https://tlpgcet.github.io</a></p>

          <p>We look forward to your feedback.</p>

          <p>Thank you for your time and support in advancing the education process.</p>

          <p>Best regards,<br>
          TLP Team</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.log("info", `Email sent to ${student.name} at ${student.rollno}@gcet.edu.in`);
    }

    logger.log("info", `All emails sent successfully at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    logger.log("error", `Failed to send emails: ${error}`);
  }
}



// Constant time slots (example: 8:30 AM, 12:30 PM, etc.)
const timeSlots = [
  { hour: 8, minute: 30 },
  { hour: 12, minute: 30 },
  { hour: 16, minute: 30 },
  { hour: 21, minute: 0 },
];

// Function to handle dynamic scheduling based on date range
export async function scheduleEmails(req: Request, res: Response) {
  const { startDate, endDate } = req.body;

  // Validate date range format (yyyy-mm-dd)
  const start = parse(startDate, 'yyyy-MM-dd', new Date());
  const end = parse(endDate, 'yyyy-MM-dd', new Date());

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "Invalid date format. Use yyyy-mm-dd." });
  }

  // Clear existing cron jobs (if any) before creating new ones
  cron.getTasks().forEach(task => task.stop());

  // Loop through the date range and schedule emails for each date
  let currentDate = start;
  while (currentDate <= end) {
    // Schedule tasks based on constant time slots for the current date
    timeSlots.forEach((slot: { hour: number, minute: number }) => {
      const cronExpression = `${slot.minute} ${slot.hour} ${currentDate.getDate()} ${currentDate.getMonth() + 1} *`;
      cron.schedule(cronExpression, sendEmails);
      logger.log("info", `Scheduled email task for ${format(currentDate, 'yyyy-MM-dd')} at ${slot.hour}:${slot.minute}`);
    });

    // Move to the next date
    currentDate = addMinutes(currentDate, 24 * 60);
  }

  return res.json({ success: true, message: "Email tasks scheduled successfully" });
}

// OTP-related functions
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function rollnoExist(username: string) {
  const query = `SELECT * FROM studentinfo WHERE rollno = ?`;
  const result = await dbQuery(query, [username]);
  return result.length !== 0;
}

export async function setNewPassword(req: Request, res: Response) {
  const username = req.body.usernameInToken;
  const password = md5(req.body.password);
  try {
    const query = `UPDATE studentinfo SET password = ? WHERE rollno = ?;`;
    const result = await dbQuery(query, [password, username]);

    if (result.protocol41) {
      return res.json({ done: true });
    }
    return res.json({ done: false });
  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}

async function sendEmailOTP(user_email: string, otp: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user_email,
    subject: "GCET Feedback Application OTP Code",
    text: `Your OTP code is ${otp}\nValid for 5 minutes.`,
  };

  return transporter.sendMail(mailOptions, (error, _info) => {
    if (error) {
      return console.log('Error:', error);
    }
    logger.log('info', `Email sent to ${user_email}`);
  });
}

export async function requestOTP(req: Request, res: Response) {
  const username = req.body.usernameInToken === undefined ? req.body.username : req.body.usernameInToken;
  const isExist = await rollnoExist(username);

  if (!isExist) {
    return res.json({ error: "Rollno Doesnot Exist Contact Admin!" });
  }

  const email = `${username}@gcet.edu.in`;

  const otp = generateOTP();
  const otpExpiration = addMinutes(new Date(), 5);
  const formattedExpirationDate = format(otpExpiration, 'yyyy-MM-dd HH:mm:ss');

  const query = `UPDATE studentinfo SET otp = ?, otp_expiration = ? WHERE rollno = ?`;

  try {
    await dbQuery(query, [otp, formattedExpirationDate, username]);
    await sendEmailOTP(email, otp);

    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error sending OTP" });
  }
}

export async function verifyOTP(req: Request, res: Response) {
  const { user_otp } = req.body;
  const username = req.body.usernameInToken === undefined ? req.body.username : req.body.usernameInToken;

  try {
    const query = `SELECT otp, otp_expiration FROM studentinfo WHERE rollno = ?`;
    const result = await dbQuery(query, [username]);

    if (result.length === 0) {
      return res.status(400).json({ error: "Email not found" });
    }

    const { otp, otp_expiration } = result[0];
    const currentTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const expirationTime = format(new Date(otp_expiration), 'yyyy-MM-dd HH:mm:ss');

    if (currentTime > expirationTime) {
      return res.json({ error: "OTP has expired! Please Try again." });
    }

    if (user_otp !== otp) {
      return res.json({ verified: false, error: "Invalid OTP" });
    }

    return res.json({ verified: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}

// export { scheduleEmails }; // Export the function to be used in routes
