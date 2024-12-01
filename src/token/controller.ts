import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function token(req: Request, res: Response) {
    try {
        const rollno = req.body.usernameInToken;
        const count = await dbQuery(`SELECT * FROM COUNTTERM;`);
        const data: any = count;
        const term = data.length > 0 ? data[0].count : null;
        if (!rollno)
            return res.status(400).json({ error: "Missing required field: rollno" });

        const query = `SELECT token${term} FROM STUDENTINFO WHERE ROLLNO = ?`;
        const result: any = await dbQuery(query, [rollno]);
        const sendTerm = term === 1 ? result[0].token1 : result[0].token2;
        return res.json({ token: sendTerm });

    } catch (err) {
        console.error("Error token:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function fetchTerm(req: Request, res: Response) {
    try {
        const result = await dbQuery(`SELECT * FROM COUNTTERM;`);
        const data: any = result;
        if (data.length > 0) {
            const term = data[0].count;
            return res.json({ done: true, term: term });
        } else {
            return res.json({ done: false, term: null });
        }
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
}