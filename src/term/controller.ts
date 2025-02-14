import cron from "node-cron";
import { Response, Request } from "express";
import * as logger from "./../services/logger";
import { addDays, format, parse } from 'date-fns';
import dbQuery from "../services/db";
import createTransporter from "../mailer";

export async function term1(req: Request, res: Response) {
  try {
    const query = 'UPDATE term SET term = 2 where branch = ?';
    const result = await dbQuery(query, [req.body.branchInToken]);

    if (result.protocol41)
      return res.json({ done: true, term: 2 });
    else
      return res.json({ done: false });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


export async function term2(req: Request, res: Response) {
  try {
    const query = 'UPDATE term SET term = 1 where branch = ?';
    const result = await dbQuery(query, [req.body.branchInToken]);

    if (result.protocol41)
      return res.json({ done: true, term: 1 });
    else
      return res.json({ done: false });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


export async function promote(req: Request, res: Response) {
  try {
    const { branchInToken: branch, sem } = req.body;

    if (sem === undefined) {
      const result: any = await dbQuery(`
        SELECT DISTINCT sem FROM studentinfo WHERE branch = '${branch}';
      `);

      const semesters = result.map((row: { sem: number }) => row.sem);
      return res.json({ done: true, semesters: semesters });
    } else if (sem === 'all') {
      const checkNextSem: any = await dbQuery(`
        SELECT sem, COUNT(*) AS count FROM studentinfo 
        WHERE sem BETWEEN 1 AND 7 AND branch = '${branch}'
        GROUP BY sem HAVING COUNT(*) > 0;
      `);

      const promotionTasks = checkNextSem.map(async (row: { sem: number }) => {
        const nextSem = row.sem + 1;
        const conflictCheck: any = await dbQuery(`
          SELECT COUNT(*) AS count FROM studentinfo 
          WHERE sem = ${nextSem} AND branch = '${branch}';
        `);

        if (conflictCheck[0].count === 0) {
          await dbQuery(`
            UPDATE studentinfo
            SET sem = sem + 1
            WHERE sem = ${row.sem} AND branch = '${branch}';
          `);
        }
      });

      await Promise.all(promotionTasks);

      await dbQuery(`
        DELETE FROM studentinfo
        WHERE sem = 8 AND branch = '${branch}';

        UPDATE studentinfo
        SET token = 'undone' WHERE branch = '${branch}';
      `);

      return res.json({ done: true });
    } else {
      const nextSem = sem + 1;
      const checkNextSem: any = await dbQuery(`
        SELECT COUNT(*) AS count FROM studentinfo 
        WHERE sem = ${nextSem} AND branch = '${branch}';
      `);

      if (checkNextSem[0].count > 0) {
        return res.json({ done: false });
      }

      await dbQuery(`
        begin;
        DELETE FROM studentinfo
        WHERE sem = 8 AND branch = '${branch}';

        UPDATE studentinfo
        SET sem = sem + 1
        WHERE sem = ${sem} AND branch = '${branch}';

        UPDATE studentinfo
        SET token = 'undone' WHERE branch = '${branch}';
        commit;
      `);

      return res.json({ done: true });
    }
  } catch (error) {
    dbQuery('rollback;');
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


// Constant time slots (example: 8:30 AM, 12:30 PM, etc.)
const timeSlots = [
  { hour: 8, minute: 30 },
  { hour: 12, minute: 30 },
  { hour: 16, minute: 30 },
  { hour: 21, minute: 0 },
];

async function getAllRollNumbers(branch: string): Promise<{ rollno: string; name: string }[]> {
  try {
    const termQuery = `SELECT * FROM term WHERE branch = ?`;
    const termResult = await dbQuery(termQuery, [branch]);
    const term = termResult.length > 0 ? termResult[0].term : null;

    const semCondition =
      branch === 'FME' ? `(sem IN (1, 2)) AND branch != 'MBA'` :
        branch === 'MBA' ? `(1=1)` : `(sem >= 3)`;

    const branchCondition = branch !== 'FME' ? `AND branch = ?` : ``;
    const tokenCondition = term !== null ? `AND token${term} != 'done'` : ``;

    const query = `SELECT rollno, name FROM studentinfo WHERE ${semCondition} ${branchCondition} ${tokenCondition}`.trim();
    const queryParams = branch !== 'FME' ? [branch] : [];

    const result = await dbQuery(query, queryParams);

    // console.log(result);

    return result.map((row: any) => ({
      rollno: row.rollno,
      name: row.name,
    }));
  } catch (error) {
    logger.log('error', `Failed to fetch roll numbers: ${error}`);
    throw new Error('Database error');
  }
}

async function sendEmails(branch: string) {
  try {
    const transporter = createTransporter();
    const studentList = await getAllRollNumbers(branch);

    for (const student of studentList) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: `${student.rollno}@gcet.edu.in`,
        subject: 'Important: Visit the Feedback Application',
        html: `
          <p>Dear ${student.name},</p>

          <p>We, <b> GCET IQAC </b> are excited to introduce <strong>TLP - Teaching Learning Progress</strong>, a platform designed to enhance education through effective feedback.</p>

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
      logger.log('info', `Email sent to ${student.name} at ${student.rollno}@gcet.edu.in`);
    }

    logger.log('info', 'All emails sent successfully');
  } catch (error) {
    logger.log('error', `Failed to send emails: ${error}`);
  }
}

// Function to handle dynamic scheduling based on date range
export async function scheduleEmails(req: Request, res: Response) {
  const { startDate, endDate } = req.body;
  // console.log(startDate, endDate);

  const start = parse(startDate, 'yyyy-MM-dd', new Date());
  const end = parse(endDate, 'yyyy-MM-dd', new Date());

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Use yyyy-MM-dd.' });
  }

  if (start > end) {
    return res.status(400).json({ error: 'Start date must be before or equal to end date.' });
  }

  // Clear existing cron jobs (if any)
  cron.getTasks().forEach(task => task.stop());
  logger.log('info', 'Cleared existing cron jobs.');

  let currentDate = start;

  while (currentDate <= end) {
    timeSlots.forEach(({ hour, minute }) => {
      const cronExpression = `${minute} ${hour} ${currentDate.getDate()} ${currentDate.getMonth() + 1} *`;

      cron.schedule(cronExpression, async () => {
        try {
          await sendEmails(req.body.branchInToken);
          logger.log('info', `Emails sent for ${req.body.branchInToken} Branch at ${hour}:${minute}`);
        } catch (error) {
          logger.log('error', `Error in scheduled task: ${error}`);
        }
      });
    });

    // Move to the next date
    currentDate = addDays(currentDate, 1);
  }

  // Update the status to active after scheduling
  try {
    await dbQuery(`UPDATE term SET status = 'active' WHERE branch IN (?)`, [req.body.branchInToken]);
    logger.log('info', `DB query executed to update status to active for ${req.body.branchInToken} Branch`);
  } catch (error) {
    logger.log('error', `Error in updating status to active: ${error}`);
    return res.status(500).json({ error: 'Error in updating status to active' });
  }

  // Schedule the DB query job to run a minute after the last time slot on the end date
  const lastTimeSlot = timeSlots[timeSlots.length - 1];
  const cronExpressionForDbQuery = `${lastTimeSlot.minute + 1} ${lastTimeSlot.hour} ${end.getDate()} ${end.getMonth() + 1} *`;

  // console.log(cronExpressionForDbQuery);

  cron.schedule(cronExpressionForDbQuery, async () => {
    try {
      await dbQuery(`UPDATE term SET status = 'inactive' WHERE branch = ?`, [req.body.branchInToken]);
      logger.log('info', 'DB query executed to update status to inactive after the last time slot on the end date');
    } catch (error) {
      logger.log('error', `Error in scheduled DB query task: ${error}`);
    }
  });
  logger.log('info', `Scheduled task from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

  return res.json({ success: true, message: 'Email tasks scheduled successfully' });
}
