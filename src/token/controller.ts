import { Response, Request } from "express";
import dbQuery from "../services/db";


export async function token(req: Request, res: Response) {
    const rollno = req.body.usernameInToken;
    try {
        if (!rollno)
            return res.status(400).json({ error: "Missing required field: rollno" });

        let query;

        query = `SELECT token FROM STUDENTINFO WHERE ROLLNO = '${rollno}'`;
        const result: any = await dbQuery(query);
        return res.json({ token: result[0].token });

    } catch (err) {
        console.error("Error token:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}  