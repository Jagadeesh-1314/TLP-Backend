import { Request, Response } from "express";
import path from "path";
import { dbQueryWithFields } from "../services/db";
import * as logger from "../services/logger";
import * as xlsx from "xlsx";
import * as fs from "fs";
import { isAnyUndefined, responses } from "../services/common";
import { FieldInfo } from "mysql";
import dayjs from "dayjs";
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, VerticalAlign, HeadingLevel, PageBreak } from "docx";

type tableNames =
  | "faculty"
  | "report"
  | "theoryscore"
  | "labscore"
  | "studentinfo"
  | "subjects"
  | "timetable"
  | "questions";

function convertToXLSX(
  result: any,
  fields: FieldInfo[],
  tableName: string,
  outFilePath = ""
): { timestamp: string; path: string } | { error: string } {
  try {
    const data: any[][] = [];

    data.push(fields.map((field) => field.name));
    result.forEach((row: any) => {
      data.push(Object.values(row));
    });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const timestamp = Date.now();
    const excelFilePath =
      outFilePath || path.join("tmp", `${tableName}_${timestamp}.xlsx`);

    xlsx.writeFile(workbook, excelFilePath);
    return { path: excelFilePath, timestamp: `${timestamp}` };
  } catch (err) {
    logger.log(
      "error",
      "Error while creating xlsx file for table " + tableName,
      err
    );
    logger.log(
      "warn",
      "This can be due to dir not present in required folder.",
      "\n Try running bin\\start.bat file"
    );
    return { error: "Error while creating xlsx file" };
  }
}



async function convertToDOCX(
  result: any,
  fields: FieldInfo[],
  tableName: string,
  outFilePath = ""
): Promise<{ path: string; timestamp: string } | { error: string }> {
  try {
    const sections = [...new Set(result.map((row: any) => row.sec))]; // Get unique sections
    const filteredFields = fields.filter((field) => field.name !== "sec"); // Exclude 'sec' field

    const docSections = sections.map((section) => {
      const sectionData = result.filter((row: any) => row.sec === section); // Filter data by section

      const rows = sectionData.map((row: any, index: number) => {
        return new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  text: (index + 1).toString(), // Serial number
                  spacing: {
                    after: 0,
                    line: 240, // 1.5 spacing
                  },
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            ...filteredFields.map((field) => {
              return new TableCell({
                children: [
                  new Paragraph({
                    text: row[field.name] != null ? row[field.name].toString() : "",
                    spacing: {
                      after: 0,
                      line: 240, // 1.5 spacing
                    },
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
              });
            }),
          ],
        });
      });

      return [
        new Paragraph({
          text: `Section: ${section}`,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 0,
            line: 240, // 1.5 spacing
          },
        }),
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "SNo", // Serial number header
                      alignment: AlignmentType.CENTER,
                      spacing: {
                        after: 0,
                        line: 240, // 1.5 spacing
                      },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                ...filteredFields.map((field) => {
                  return new TableCell({
                    children: [
                      new Paragraph({
                        text: field.name,
                        alignment: AlignmentType.CENTER,
                        spacing: {
                          after: 0,
                          line: 240, // 1.5 spacing
                        },
                      }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                  });
                }),
              ],
            }),
            ...rows,
          ],
        }),
      ];
    }).flat();

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `Report`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 0,
                line: 240, // 1.5 spacing
              },
            }),
            ...docSections,
          ],
        },
      ],
    });

    const timestamp = Date.now();
    const docFilePath =
      outFilePath || path.join("tmp", `${tableName}_${timestamp}.docx`);

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(docFilePath, buffer);

    return { path: docFilePath, timestamp: `${timestamp}` };
  } catch (err) {
    logger.log(
      "error",
      "Error while creating DOCX file for table " + tableName,
      err
    );
    return { error: "Error while creating DOCX file" };
  }
}

export async function backupHandler(req: Request, res: Response) {
  let result, fields: FieldInfo[];
  const usernameInToken = req.body.usernameInToken as string;
  const ip = req.ip as string;
  try {
    [result, fields] = (await dbQueryWithFields(
      "SELECT * FROM studentinfo"
    )) as [any, FieldInfo[]];
  } catch (err) {
    return res.status(500).json(responses.ErrorWhileDBRequest);
  }
  if (result.length <= 0) return res.json({ error: "No data found" });

  let out = convertToXLSX(
    result,
    fields,
    "studentinfo",
    path.join("backup", "backup.xlsx")
  );

  if ("error" in out) {
    return res.status(500).json(out);
  } else {
    logger.log(
      "info",
      `${usernameInToken} from ip ${ip?.slice(7)} has created a backup`
    );
    return res.json(responses.DoneMSG);
  }
}

async function downloadTable(
  tableName: string,
  res: Response,
  fileNamePrefix: string,
  query: string
) {
  let result, fields: FieldInfo[];

  try {
    [result, fields] = (await dbQueryWithFields(query)) as [any, FieldInfo[]];
  } catch (err) {
    return res.status(500).json(responses.ErrorWhileDBRequest);
  }

  if (result.length <= 0) return res.json({ error: "No data found" });

  let out;
  if (tableName === "report") {
    out = await convertToDOCX(result, fields, tableName);
  } else {
    out = convertToXLSX(result, fields, tableName);
  }

  if ("error" in out) {
    return res.status(500).json(out);
  }

  const fileName = out.path;
  let timestamp = out.timestamp;
  fileNamePrefix += '_';
  fileNamePrefix += timestamp;
  const downloadFileName = `${fileNamePrefix}.${tableName === "report" ? "docx" : "xlsx"}`;

  res.download(fileName, downloadFileName, (err) => {
    if (err) {
      logger.log("error", "Error downloading file:", err);
      return;
    }

    fs.unlink(fileName, (err) => {
      if (err) {
        logger.log("error", "Error deleting file:", err);
      }
    });
  });
}

const tables: {
  [key in tableNames]: { query: string; ordering: string; fileName: string };
} = {
  faculty: {
    query: `SELECT * From faculty`,
    ordering: " ORDER BY facId",
    fileName: "Faculty_info",
  },
  subjects: {
    query: `SELECT * From subjects`,
    ordering: " ORDER BY subCode ",
    fileName: "Subject_info",
  },
  labscore: {
    query: `SELECT * From labscore`,
    ordering: " GROUP BY rollno, subcode ",
    fileName: "LabScore_info",
  },
  theoryscore: {
    query: `SELECT f.facname,  From theoryscore`,
    ordering: " GROUP BY rollno, subcode ",
    fileName: "TheoryScore_info",
  },
  questions: {
    query: `SELECT * From questions`,
    ordering: " ORDER BY seq ",
    fileName: "Questions_info",
  },
  report: {
    query: ` SELECT sec, facName as Faculty_Name, subjects.subcode as Subject_Code, subjects.subName as Subject_Name, percentile as Percentile FROM report JOIN subjects where TRIM(subjects.subcode) = TRIM(report.subcode)`,
    ordering: " ORDER BY sec ",
    fileName: "report",
  },
  timetable: {
    query: `SELECT * From timetable`,
    ordering: " ORDER BY sec ",
    fileName: "TimeTable_info",
  },
  studentinfo: {
    query: `SELECT * From studentinfo`,
    ordering: " ORDER BY sem, sec ",
    fileName: "Student Info",
  },
};

export async function downloadHandler(
  {
    query: { tableName },
    body: { usernameInToken },
    ip,
  }: {
    query: { tableName: tableNames };
    body: { usernameInToken: string };
    ip?: string;
  },
  res: Response
) {
  if (isAnyUndefined(tableName)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }

  let condition = "";
  if (tableName in tables) {
    const { query, ordering, fileName } = tables[tableName];
    await downloadTable(
      tableName,
      res,
      `${fileName}`,
      query + condition + ordering
    );
    logger.log(
      "info",
      `${usernameInToken} from ip ${ip?.slice(
        7
      )} has downloaded ${tableName} table`
    );
  } else {
    res.status(400).json(responses.BadRequest);
  }
}

export async function manageDBdownloadHandler(
  { params, query, body: { usernameInToken }, ip }: Request,
  res: Response
) {
  const rollNo = params.rollNo as string;
  const tableName = query.tableName as tableNames;
  
  if (tableName in tables) {
    const { query, ordering, fileName } = tables[tableName];
    await downloadTable(
      tableName,
      res,
      `${rollNo}_${fileName}_${dayjs().format("DD-MMM-YY_hh-mm_A")}`,
      query + ordering
    );
    logger.log(
      "info",
      `${usernameInToken} from ip ${ip?.slice(7)} has downloaded ${rollNo} info`
    );
  } else {
    res.status(400).json(responses.BadRequest);
  }
}
