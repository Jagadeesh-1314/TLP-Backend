import { Response, Request } from "express";
import * as logger from "./../services/logger";
import md5 from "md5";
import dbQuery from "../services/db";
import createTransporter from "../mailer";

// OTP-related functions
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function rollnoExist(username: string) {
  const query = `SELECT * FROM studentinfo WHERE rollno = ?`;
  const result = await dbQuery(query, [username]);
  return result.length !== 0;
}

async function sendEmailOTP(user_email: string, otp: string): Promise<boolean> {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user_email,
    subject: "GCET Feedback Application OTP Code",
    text: `Your OTP code is ${otp}\nValid for 5 minutes.`,
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    logger.log("info", `Email sent to ${user_email}`);
    return true;
  } catch (error) {
    logger.error("Error sending email:", error);
    return false;
  }
}

export async function requestOTP(req: Request, res: Response) {
  const username = req.body.username.trim();

  if (!username.length) {
    return res.json({ error: "Rollno is Required!" });
  }
  const isExist = await rollnoExist(username);

  if (!isExist) {
    return res.json({ error: "Rollno Doesnot Exist Contact Admin!" });
  }

  const email = `${username}@gcet.edu.in`;

  const otp = generateOTP();
  const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

  const query = `INSERT INTO otp_verification (rollno, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?`;

  const maxRetries = 3;
  let attempt = 0;
  let success = false;

  while (attempt < maxRetries && !success) {
    try {
      await dbQuery(query, [username, otp, otpExpiration, otp, otpExpiration]);
      await sendEmailOTP(email, otp);
      success = true;
      return res.json({ success: true, message: `OTP sent to your email ${email}` });
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(error);
        return res.status(500).json({ error: "Error sending OTP" });
      }
      // Wait for a short delay before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export async function verifyOTP(req: Request, res: Response) {
  const username = req.body.username.trim();
  const user_otp = req.body.user_otp.trim();

  try {
    const query = `SELECT * FROM otp_verification WHERE rollno = ? AND otp = ?`;
    const result = await dbQuery(query, [username, user_otp]);

    if (result.length === 0) {
      return res.status(400).json({ error: "Email not found" });
    }

    const { otp, expires_at, verified } = result[0];
    if (verified) {
      return res.json({ message: 'OTP already used' });
    }
    if (new Date() > new Date(expires_at)) {
      return res.json({ error: 'OTP has expired! Please Try again.' });
    }

    if (user_otp !== otp.toString()) {
      return res.json({ verified: false, error: "Invalid OTP" });
    }

    await dbQuery('UPDATE otp_verification SET verified = TRUE WHERE rollno = ?', [username]);
    return res.json({ verified: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}

export async function setNewPassword(req: Request, res: Response) {
  const username = req.body.username.trim();
  const password = md5(req.body.password).trim();
  try {
    const query = `SELECT * FROM otp_verification WHERE rollno = ? AND verified = TRUE;`;
    const result = await dbQuery(query, [username]);
    if (result.length === 0) {
      return res.status(400).json({ message: 'OTP not verified' });
    }

    if (username === password) {
      return res.json({ message: 'Password Should not be same as Username(Rollno)!' })
    }

    if (password.length < 10) {
      return res.json({ message: "Password must be at least 10 characters long." })
    }

    const setPass = `UPDATE studentinfo SET password = ? WHERE rollno = ?;`
    const success = await dbQuery(setPass, [password, username]);

    if (success.protocol41) {
      await dbQuery(`DELETE FROM otp_verification WHERE rollno = ?`, [username]);
      return res.json({ done: true });
    }

    return res.json({ done: false });
  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}


