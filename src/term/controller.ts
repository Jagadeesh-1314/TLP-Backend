import { Response, Request } from "express";
import dbQuery from "../services/db";
import { Console } from "console";

export async function term1(req: Request, res: Response) {
    try {
      const result = dbQuery(`UPDATE COUNTTERM SET COUNT = 2;`);
      console.log(req.body)
      
      return res.json({ done: true, term: 2 });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Error executing query');
    }
  }
  
  
  export async function term2(req: Request, res: Response) {
    try {
      const result = dbQuery(`UPDATE COUNTTERM SET COUNT = 1;`);
      return res.json({ done: true, term: 1 });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Error executing query');
    }
  }