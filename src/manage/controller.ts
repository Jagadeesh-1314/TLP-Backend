import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import { isAnyUndefined, responses } from "../services/common";
import md5 from "md5";
import { UsersTableArr } from "../interfaces/manage";


type tableNames =
  | "faculty"
  | "studentinfo"
  | "subjects"
  | "timetable"
  | "electives"
  | "questions";

// Below are the common functionalites for managing studentInfo, Print and Paid entries

// ANCHOR Getting Student Details 

export async function getTable(req: Request, res: Response) {
  const { tableName, fbranch } = req.query;
  const branch = (req.body.branchInToken !== 'FME' && fbranch?.length === 0) ? req.body.branchInToken : fbranch;
  if (isAnyUndefined(tableName)) {
    res.status(400).json(responses.NotAllParamsGiven);
    return;
  }
  try {
    const query = (() => {
      if (tableName === 'timetable') {
        return `
          SELECT t.*, f.facName, s.subName
          FROM timetable t
          JOIN faculty f ON t.facID = f.facID
          JOIN subjects s ON s.subCode = t.subCode
          WHERE branch = '${branch}' 
          ORDER BY sem, sec;
        `;
      }

      if (tableName === 'electives') {
        return `          
          SELECT 
              e.*, 
              f.facName, 
              s.subName, 
              si.sem, 
              si.sec, 
              si.branch
          FROM 
              electives e
          JOIN 
              faculty f ON e.facID = f.facID
          JOIN 
              subjects s ON e.subCode = s.subCode
          JOIN 
              studentinfo si ON e.rollno = si.rollno
          ORDER BY 
              si.branch, si.sem, si.sec;
        `;
      }

      if (tableName !== 'faculty' && tableName !== 'subjects') {
        const semCondition =
          req.body.branchInToken === 'FME' ? 'sem IN (1, 2)' : 'sem NOT IN (1, 2)';
        return `
          SELECT * FROM ${tableName}
          WHERE branch = '${branch}' AND ${semCondition}
          ORDER BY sem, sec
        `;
      }
      return `SELECT * FROM ${tableName}`;
    })();

    const timeTable = await dbQuery(query).then((result) =>
      JSON.parse(JSON.stringify(result))
    );

    res.json({ tableData: timeTable });

  } catch (err) {
    logger.log("error", err);
    res.json(responses.ErrorWhileDBRequest);
  }
}



export async function branchDetails(req: Request, res: Response) {
  try {
    const result: any = await dbQuery(`
      SELECT DISTINCT branch FROM studentinfo WHERE sem in (1, 2) ORDER BY branch;
    `);
    const branchDetails = result.map((row: { branch: string }) => row.branch);

    return res.json({ branchDetails: branchDetails });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
}


// ANCHOR Editing Student Details

export async function editDetails(req: Request, res: Response) {
  try {
    const count = await dbQuery(`SELECT * FROM COUNTTERM;`);
    const data: any = count;
    const term = data.length > 0 ? data[0].count : null;
    const validTableNames: tableNames[] = [
      "faculty",
      "studentinfo",
      "subjects",
      "timetable",
      "questions"
    ];

    const { details, tableName } = req.body;
    console.log(details, tableName);
    const ip = req.ip as string;
    const isAnyInvalid = (obj: { [key: string]: unknown }): boolean => {
      return Object.entries(obj).some(([key, value]) => {
        if (typeof value === 'string') {
          return value.trim().length === 0;
        }
        return value === undefined;
      });
    };
    if (!details || isAnyInvalid(details)) {
      return res.status(400).json(responses.NotAllParamsGiven);
    }
    if (!validTableNames.includes(tableName as tableNames)) {
      return res.status(400).json({ message: "Invalid table name" });
    }

    const currentYear = new Date().getFullYear();
    if (details.batch !== undefined && typeof details.batch === 'string') {
      const parsedBatch = parseInt(details.batch, 10);
      if (parsedBatch >= currentYear - 3 && parsedBatch <= currentYear) {
        details.batch = parsedBatch;
      } else {
        return res.status(400).json({ message: "Batch year must be between " + (currentYear - 3) + " and " + currentYear + "." });
      }
    }

    if (details.sem !== undefined && typeof details.sem === 'string') {
      const parsedSem = parseInt(details.sem, 10);
      if (parsedSem >= 1 && parsedSem <= 8) {
        details.sem = parsedSem;
      } else {
        return res.status(400).json({ message: "Semester must be between 1 and 8." });
      }
    }

    if (tableName === "timetable") {
      const query = `
        UPDATE timetable
        SET facID = ?
        WHERE subCode = ?
          AND sem = ?
          AND sec = ?
          AND branch = ?;
      `;
      const values = [
        details.facID,
        details.subCode,
        details.sem,
        details.sec,
        details.branch
      ];

    } else if (tableName === "studentinfo") {
      const query = `
      UPDATE studentinfo
      SET 
          Name = ?,
          sec = ?,
          sem = ?,
          branch = ?,
          batch = ?
      WHERE rollno = ?;`;
      const values = [
        details.Name,
        details.sec,
        details.sem,
        details.branch,
        details.batch,
        details.rollno
      ];
      const result: any = await dbQuery(query, values);
      if (result.protocol41) {
        return res.json({ updated: true });
      }
      return res.status(500).json({ message: "Internal Server Error" })

    } else if (tableName === "subjects") {
      const query = `
          UPDATE subjects
          SET 
              subName = ?,
              qtype = ?,
              def = ?
          WHERE subCode = ?;
        `;

      const values = [
        details.subName,
        details.qtype,
        details.def,
        details.subCode
      ];

      const result: any = await dbQuery(query, values);
      if (result.protocol41) {
        return res.json({ updated: true });
      }
      return res.status(500).json({ message: "Internal Server Error" })

    } else if (tableName === "faculty") {
      const query = `
          UPDATE faculty
          SET 
              facName = ?
          WHERE facID = ?;
        `;

      const values = [
        details.facName,
        details.facID
      ];

      const result: any = await dbQuery(query, values);
      if (result.protocol41) {
        return res.json({ updated: true });
      }
      return res.status(500).json({ message: "Internal Server Error" })

    } else if (tableName === "electives") {
      const query = `
        UPDATE electives
        SET 
            facID = ?
        WHERE rollno = ? AND subcode = ?;
        `;

      const values = [
        details.facID,
        details.rollno,
        details.subcode
      ];

      const result: any = await dbQuery(query, values);
      if (result.protocol41) {
        return res.json({ updated: true });
      }
      return res.status(500).json({ message: "Internal Server Error" })

    }
    // return res.json({ updated: true });

    // logger.log(`info`, `${req.body.InToken} has updated details in ${tableName} on IP ${ip?.slice(7)}`);
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

// ANCHOR Adding Student Details

export async function addDetails(req: Request, res: Response) {
  const validTableNames: tableNames[] = [
    "faculty",
    "studentinfo",
    "subjects",
    "timetable",
    "questions"
  ];

  const { details, tableName } = req.body;
  console.log(details, tableName);
  const { sem, sec, branch } = details;
  const data = await dbQuery(`SELECT * FROM COUNTTERM;`);
  const term = data.length > 0 ? data[0].count : null;
  const ip = req.ip as string;

  const isAnyInvalid = (obj: { [key: string]: unknown }): boolean => {
    return Object.entries(obj).some(([key, value]) => {
      if (typeof value === 'string') {
        return value.trim().length === 0;
      }
      return value === undefined;
    });
  };

  if (!details || isAnyInvalid(details)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }

  // if (!validTableNames.includes(tableName as tableNames)) {
  //   return res.status(400).json({ message: "Invalid table name" });
  // }

  const currentYear = new Date().getFullYear();

  if (details.batch !== undefined && typeof details.batch === 'string') {
    const parsedBatch = parseInt(details.batch, 10);

    if (parsedBatch >= currentYear - 3 && parsedBatch <= currentYear) {
      details.batch = parsedBatch;
    } else {
      return res.status(400).json({ message: "Batch year must be between " + (currentYear - 3) + " and " + currentYear + "." });
    }
  }

  if (details.sem !== undefined && typeof details.sem === 'string') {
    const parsedSem = parseInt(details.sem, 10);
    if (parsedSem >= 1 && parsedSem <= 8) {
      details.sem = parsedSem;
    } else {
      return res.status(400).json({ message: "Semester must be between 1 and 8." });
    }
  }

  try {
    // Fetching the Subject Name for the Subject Code
    // let subName: any = await dbQuery(
    //   `SELECT subName FROM codeNames WHERE subCode = '${subCode}'`
    // );
    // // Checking whether the given Subject Code do exists
    // if (subName.length === 0)
    //   return res.json({ error: { message: "Invalid Subject Code" } });
    // subName = subName[0].subName as string;

    // const query: string = `INSERT IGNORE INTO studentInfo (rollNo, subCode, subName, grade, acYear, sem, exYear, exMonth) VALUES ("${rollNo}", "${subCode}", "${subName}", "${details.grade}", ${acYear}, ${sem}, "${details.exYear}", "${details.exMonth}")`;
    // await dbQuery(query);
    // logger.log(`info`, `${req.body.usernameInToken} has added ${rollNo} details in studentInfo on IP ${ip?.slice(7)}`);
    // return res.json({ done: true });

    if (tableName === "timetable") {
      const query: string = `
          INSERT INTO timetable (facID, subCode, sem, sec, branch ) VALUES (?, ?, ?, ?, ?);

          UPDATE studentinfo set token${term} = 'undone' WHERE sem = ${sem} AND sec = '${sec}' AND branch = '${branch}';

          DELETE FROM theoryscore2 
          WHERE rollno IN (
              SELECT rollno FROM (
                  SELECT DISTINCT s.rollno
                  FROM studentinfo s
                  LEFT JOIN theoryscore2 t ON s.rollno = t.rollno
                  LEFT JOIN labscore2 l ON s.rollno = l.rollno
                  WHERE s.token${term} = 'undone'
                    AND (t.rollno IS NOT NULL OR l.rollno IS NOT NULL)
              ) AS temp
          );

          DELETE FROM labscore2
          WHERE rollno IN (
              SELECT rollno FROM (
                  SELECT DISTINCT s.rollno
                  FROM studentinfo s
                  LEFT JOIN theoryscore2 t ON s.rollno = t.rollno
                  LEFT JOIN labscore2 l ON s.rollno = l.rollno
                  WHERE s.token${term} = 'undone'
                    AND (t.rollno IS NOT NULL OR l.rollno IS NOT NULL)
              ) AS temp
          );

          DELETE FROM cf2 
          WHERE rollno IN (
              SELECT rollno FROM (
                  SELECT DISTINCT s.rollno
                  FROM studentinfo s
                  LEFT JOIN theoryscore2 t ON s.rollno = t.rollno
                  LEFT JOIN labscore2 l ON s.rollno = l.rollno
                  LEFT JOIN cf2 c ON s.rollno = c.rollno
                  WHERE s.token${term} = 'undone'
                    AND (t.rollno IS NOT NULL OR l.rollno IS NOT NULL OR c.rollno IS NOT NULL)
              ) AS temp
          );   
      `;
      const result: any = await dbQuery(query, [...(Object.values(details) as any[])]);
      console.log(result[0])
      if (result[0].protocol41) {
        return res.json({ done: true });
      }
      // return res.status(500).json({ message: "Internal Server Error" });

    } else if (tableName === "studentinfo") {
      const query: string = `INSERT INTO studentinfo (rollno, Name, sec, sem, branch, batch, token, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const result: any = await dbQuery(query, [...(Object.values(details) as any[]), "undone", md5(details.rollno)]);
      if (result.protocol41) {
        return res.json({ done: true });
      }
      return res.status(500).json({ message: "Internal Server Error" })

    } else if (tableName === "subjects") {
      const query: string = `INSERT INTO subjects (subCode, subName, qtype, def ) VALUES (?, ?, ?, ?)`;
      const result: any = await dbQuery(query, [...(Object.values(details) as any[])]);
      if (result.protocol41) {
        return res.json({ done: true });
      }
      return res.status(500).json({ message: "Internal Server Error" })

    } else if (tableName === "faculty") {
      const query: string = `INSERT INTO faculty ( facID, facName ) VALUES (?, ?)`;
      const result: any = await dbQuery(query, [...(Object.values(details) as any[])]);
      if (result.protocol41) {
        return res.json({ done: true });
      }
      return res.status(500).json({ message: "Internal Server Error" })

    } else if (tableName === "electives") {
      const query: string = `INSERT INTO electives ( rollno, facID, subCode) VALUES (?, ?, ?)`;
      const result: any = await dbQuery(query, [...(Object.values(details) as any[])]);
      if (result.protocol41) {
        return res.json({ done: true });
      }
      return res.status(500).json({ message: "Internal Server Error" })
    }

  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

// ANCHOR Deleting Student Details

export async function deleteDetails(req: Request, res: Response) {
  const { rollno, subCode, facID, tableName, sem, sec, branch, batch } = req.query;
  console.log("Received:", rollno, subCode, facID, tableName, sem, sec, branch, batch);

  let ip = req.ip as string;
  let subCodes: string[] = [];
  let facIDs: string[] = [];
  let rollnos: string[] = [];

  try {
    if (subCode && typeof subCode === 'string') {
      try {
        subCodes = JSON.parse(subCode) as string[];
      } catch (error) {
        subCodes = [subCode];
      }
    }

    if (facID && typeof facID === 'string') {
      try {
        facIDs = JSON.parse(facID) as string[];
      } catch (error) {
        facIDs = [facID];
      }
    }

    if (rollno && typeof rollno === 'string') {
      try {
        rollnos = JSON.parse(rollno) as string[];
      } catch (error) {
        rollnos = [rollno];
      }
    }

    console.log("Parsed subCodes:", subCodes, "Parsed facIDs:", facIDs, "Parsed rollnos:", rollnos);

    let deleteQuery = "";

    switch (tableName) {
      case "timetable":
        // if (!facIDs.length || !subCodes.length) {
        //   return res.status(400).json({ message: "Required facID and subCode for timetable deletion" });
        // }
        // const facIDList = facIDs.map(fac => `'${fac}'`).join(', ');
        // const subCodeList = subCodes.map(code => `'${code}'`).join(', ');
        deleteQuery = `DELETE FROM timetable WHERE facID = ('${facID}') AND subCode = ('${subCode}') AND sem=${sem} AND sec='${sec}' AND branch='${branch}';`;
        break;

      case "subjects":
        if (!subCodes.length) {
          return res.status(400).json({ message: "Required subCode for subject deletion" });
        }
        const formattedSubCodes = subCodes.map(code => `'${code}'`).join(', ');
        deleteQuery = `DELETE FROM ${tableName} WHERE subCode IN (${formattedSubCodes})`;
        break;

      case "studentinfo":
        deleteQuery = `DELETE FROM ${tableName} WHERE rollno = '${rollno}'`;
        break;

      case "electives":
        if (!rollno || !subCodes.length) {
          return res.status(400).json({ message: "Required rollno and subCode for elective deletion" });
        }
        deleteQuery = `DELETE FROM ${tableName} WHERE rollno = '${rollno}' AND subCode = '${subCodes[0]}';`;
        console.log(`DELETE FROM ${tableName} WHERE rollno = '${rollno}' AND subCode = '${subCodes[0]}'`)
        break;

      case "faculty":
        if (!facID) {
          return res.status(400).json({ message: "Required facID for faculty deletion" });
        }
        deleteQuery = `DELETE FROM ${tableName} WHERE facID = '${facID}'`;
        break;

      default:
        return res.status(400).json({ message: "Unknown table" });
    }

    console.log("Generated Query:", deleteQuery);
    await dbQuery(deleteQuery);

    logger.log(
      `info`,
      `${req.body.usernameInToken} has deleted ${rollno || facID || subCode} details in ${tableName} on IP ${ip?.slice(7)}`
    );

    res.json({ deleted: true });
  } catch (err) {
    logger.log("error", err);
    return res.status(500).json({ message: "Error while processing the request" });
  }
}



export async function getUsers(_req: Request, res: Response) {
  try {
    const users = (await dbQuery(
      "SELECT username, displayName, branch FROM users"
    )) as UsersTableArr;
    return res.json({ users: users });
  } catch (err) {
    console.log(err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

//adding a new user
export async function addUser(req: Request, res: Response) {
  const username: string = req.body.details.username;
  const password: string = md5(req.body.details.password);
  const displayName: string = req.body.details.displayName;
  const branch: string = req.body.details.branch;
  if (isAnyUndefined(username, password, displayName, branch)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await dbQuery(
      `INSERT INTO users VALUES ('${username}','${password}','${displayName}', 'admin', '${branch}')`
    );
    res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

//deleting a user
export async function deleteUser(req: Request, res: Response) {
  const username = JSON.parse(req.query.username as string) as string[];
  if (isAnyUndefined(username)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await dbQuery(
      `DELETE FROM users WHERE username IN ('${username.join("','")}')`
    );
    res.json({ deleted: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

export async function updateUser(req: Request, res: Response) {
  const username: string = req.body.details.username;
  const oldUsername: string = req.body.details.oldUsername;
  const displayName: string = req.body.details.displayName;
  const password: string = req.body.details.password;
  if (isAnyUndefined(username, displayName)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }

  try {
    await dbQuery(
      `UPDATE users SET username = '${username}', displayName='${displayName}' ${Boolean(password) ? `, password='${md5(password)}'` : ""
      } WHERE username='${oldUsername}';`
    );
    res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

export async function getSubName(
  { params: { subCode } }: Request,
  res: Response
) {
  if (isAnyUndefined(subCode)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    const result = (await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = ? `,
      [subCode]
    )) as { subName: string }[];
    if (result.length == 0) return res.json(responses.InvalidParameterValue);

    res.json({ subName: result[0].subName });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}