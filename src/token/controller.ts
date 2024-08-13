import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function updateToken(req: Request, res: Response) {
    const rollno = req.query.rollno as string;
    try {
        if (!rollno)
            return res.status(400).json({ error: "Missing required field: rollno" });

        const query = `UPDATE studentinfo SET token = 'done' WHERE rollno = '${rollno}';`
        await dbQuery(query);
        return res.json({ done: true });
    } catch (e) {
        console.log(e);
    }
}



export async function token(req: Request, res: Response) {
    const rollno = req.query.rollno as string;
    try {
        if (!rollno)
            return res.status(400).json({ error: "Missing required field: rollno" });

        let query;

        query = `SELECT token FROM STUDENTINFO WHERE ROLLNO = '${rollno}'`;
        const result: any = await dbQuery(query);
        if (!result || result[0].token !== "done") {
            return res.json({ done: false });

        }
        return res.json({ done: true });
    } catch (err) {
        console.error("Error token:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}