import { Response, Request } from "express";
import dbQuery from "../services/db";
import { detailsArr, subjectsDetailsProps, facultyTableProps } from "../interfaces/manage";

export async function getDetails(req: Request, res: Response) {
    try {
      const branch = req.body.branchInToken;
      const detail = await dbQuery(`SELECT sem, sec, rollno FROM studentinfo WHERE branch = '${branch}' GROUP BY sec, sem, rollno;`) as detailsArr;
      res.json({ details: detail });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Error executing query');
    }
  }
  
  export async function getElectiveSubjects(req: Request, res: Response) {
    try {
      const subdetail = await dbQuery(`SELECT subCode, subName from subjects where def = 'e';`) as subjectsDetailsProps;
      res.json({ subdetail: subdetail });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Error executing query');
    }
  }
  
  export async function getFaculty(req: Request, res: Response) {
    try {
      const facdetail = await dbQuery(`SELECT * from faculty;`) as facultyTableProps;
      res.json({ facdetail: facdetail });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Error executing query');
    }
  }
  
  export async function postElectivesDetails(req: Request, res: Response) {
    try {
      const { facID, subCode, rollNumbers } = req.body;
      if (!facID || !subCode || !rollNumbers){
        res.json({ done: false })
        return;
      }
      const query = `INSERT INTO ELECTIVES VALUES (?, ?, ?);`
      for (const rollno of rollNumbers) {
        await dbQuery(query, [rollno, facID, subCode]);
      }
      res.json({ done: true });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Error executing query');
    }
  
  }