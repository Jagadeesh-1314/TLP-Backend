import { Request, Response } from "express";
import path from "path";
import dbQuery, { dbQueryWithFields } from "../services/db";
import * as logger from "../services/logger";
import * as xlsx from "xlsx";
import * as fs from "fs";
import { isAnyUndefined, responses } from "../services/common";
import { FieldInfo } from "mysql";
import dayjs from "dayjs";
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, VerticalAlign, HeadingLevel, TextRun, BorderStyle, SectionType, ISectionOptions, ImageRun } from "docx";
import sharp from 'sharp';

type tableNames =
  | "faculty"
  | "report1"
  | "theoryscore2"
  | "labscore2"
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

    const timestamp = dayjs().format(("DD-MMM-YY_hh-mm_A"));
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
    const sections = [...new Set(result.map((row: any) => row.sec))];
    const filteredFields = fields.filter((field) => field.name !== "sec");

    const docSections = sections.map((section, index) => {
      const sectionData = result.filter((row: any) => row.sec === section);

      const rows = sectionData.map((row: any, index: number) => {
        return new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  text: (index + 1).toString(),
                  alignment: AlignmentType.CENTER,
                  spacing: {
                    after: 240,
                    line: 240,
                  },
                  children: [
                    new TextRun({
                      text: (index + 1).toString(),
                      size: 12, // Font size in half-points (24 half-points = 12 points)
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              shading: { fill: "E6E6E6" }, // Shading for "SNo" column cells
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            }),
            ...filteredFields.map((field) => {
              return new TableCell({
                children: [
                  new Paragraph({
                    text: row[field.name] != null ? row[field.name].toString() : "",
                    alignment: AlignmentType.CENTER,
                    spacing: {
                      after: 240,
                      line: 240,
                    },
                    children: [
                      new TextRun({
                        text: row[field.name] != null ? row[field.name].toString() : "",
                        size: 12, // Font size in half-points (24 half-points = 12 points)
                      }),
                    ],
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              });
            }),
          ],
        });
      });

      return [
        new Paragraph({
          pageBreakBefore: index !== 0,
          text: `Section: ${section}`,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 240,
          },
          thematicBreak: true,
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
                      text: "SNo",
                      alignment: AlignmentType.CENTER,
                      spacing: {
                        after: 240,
                        line: 240,
                      },
                      children: [
                        new TextRun({
                          text: "SNo",
                          bold: true,
                          size: 12, // Font size in half-points (24 half-points = 12 points)
                        }),
                      ],
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { fill: "D3D3D3" },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                ...filteredFields.map((field) => {
                  return new TableCell({
                    children: [
                      new Paragraph({
                        text: field.name.replace(/_/g, " "),
                        alignment: AlignmentType.CENTER,
                        spacing: {
                          after: 240,
                          line: 240,
                        },
                        children: [
                          new TextRun({
                            text: field.name.replace(/_/g, " "),
                            bold: true,
                            size: 12, // Font size in half-points (24 half-points = 12 points)
                          }),
                        ],
                      }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "D3D3D3" },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
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
                after: 240,
              },
              thematicBreak: true,
            }),
            ...docSections,
          ],
        },
      ],
    });

    const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
    const docFilePath = outFilePath || path.join("tmp", `${tableName}_${timestamp}.docx`);

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(docFilePath, buffer);

    return { path: docFilePath, timestamp: `${timestamp}` };
  } catch (err) {
    console.error("Error while creating DOCX file for table " + tableName, err);
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
  if (tableName === "report1") {
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
  const downloadFileName = `${fileNamePrefix}.${tableName === "report1" ? "docx" : "xlsx"}`;

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
  labscore2: {
    query: `SELECT * From labscore2`,
    ordering: " GROUP BY rollno, subcode ",
    fileName: "LabScore_info",
  },
  theoryscore2: {
    query: `SELECT *  From theoryscore2`,
    ordering: " GROUP BY rollno, subcode ",
    fileName: "TheoryScore_info",
  },
  questions: {
    query: `SELECT * From questions`,
    ordering: " ORDER BY seq ",
    fileName: "Questions_info",
  },
  report1: {
    query: `SELECT sec, facName as Faculty_Name, subjects.subcode as Subject_Code, subjects.subName as Subject_Name, percentile as Percentile FROM report1 JOIN subjects where TRIM(subjects.subcode) = TRIM(report1.subcode)`,
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
      `${fileName}_${dayjs().format("DD-MMM-YY_hh-mm_A")}`,
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


interface Student {
  rollno: string;
  name: string;
  sec: string;
  sem: number;
}


export async function unfilledstudents(req: Request, res: Response) {
  const { sem, sec, fbranch } = req.query;
  const branchControl = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
  if (!sem || !sec) {
    return res.status(400).send('Semester and Section are required.');
  }

  try {
    const result: any = await dbQuery(
      `SELECT rollno, name, sec, sem FROM studentinfo WHERE sem = ${sem} AND sec = '${sec}' and token != 'done' AND branch = '${branchControl}';`,
    );
    let i: number = Math.floor(Number(sem) / 2);
    let j: number = (Math.floor(Number(sem) % 2) != 0) ? 1 : 2;
    const students: Student[] = result;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `Semester: ${i + Number(sem) % 2}-${j}`,
              heading: "Heading1",
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),
            new Paragraph({
              text: `Section: ${sec}`,
              heading: "Heading1",
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
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
                      children: [new Paragraph("S. No.")],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                      shading: { fill: "f2f2f2" },
                      margins: {
                        top: 100,
                        bottom: 100,
                        left: 10,
                        right: 10,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph("Roll No")],
                      width: { size: 45, type: WidthType.PERCENTAGE },
                      shading: { fill: "f2f2f2" },
                      margins: {
                        top: 100,
                        bottom: 100,
                        left: 10,
                        right: 10,
                      },
                    }),
                    new TableCell({
                      children: [new Paragraph("Student Name")],
                      width: { size: 45, type: WidthType.PERCENTAGE },
                      shading: { fill: "f2f2f2" },
                      margins: {
                        top: 100,
                        bottom: 100,
                        left: 10,
                        right: 10,
                      },
                    }),
                  ],
                }),
                ...students.map((student, index) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph((index + 1).toString())],
                      }),
                      new TableCell({
                        children: [new Paragraph(student.rollno.toString())],
                      }),
                      new TableCell({
                        children: [new Paragraph(student.name)],
                      }),
                    ],
                  })
                ),
              ],
            }),
          ],
        },
      ],
    });


    const buffer = await Packer.toBuffer(doc);

    const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
    const filename = `UnfilledList_${i + Number(sem) % 2}-${j}_${sec}_${timestamp}.docx`;
    const docFilePath = path.join(__dirname, 'tmp', filename);
    fs.mkdirSync(path.dirname(docFilePath), { recursive: true });

    fs.writeFileSync(docFilePath, buffer);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.sendFile(docFilePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Internal Server Error');
      } else {
        fs.unlinkSync(docFilePath);
      }
    });

    return { path: docFilePath, timestamp };
  } catch (error) {
    console.error('Error fetching data or generating document:', error);
    res.status(500).send('Internal Server Error');
  }
}


interface Report {
  branch: string;
  question: string;
  total: any;
  adjusted_total: any;
  facName: string;
  subcode: string;
  subname: string;
  sec: string;
  sem: number;
  percentile: number;
}

// export async function downloadReport(req: Request, res: Response) {
//   const { sem, sec, batch, count } = req.query;

//   if (!sem || !sec || !batch || !count ) {
//     return res.status(400).send('Semester and Section are required.');
//   }

//   try {

//     const result: any = await dbQuery(
//       `SELECT facName,  subjects.subname, sec, sem, batch, percentile FROM report${count} JOIN subjects WHERE sem = ${sem} AND sec = '${sec}' AND batch = ${batch} and TRIM(subjects.subcode) = TRIM(report${count}.subcode);`,
//     );
//     let i: number = Math.floor(Number(sem) / 2);
//     let j: string = (Number(sem) % 2 !== 0) ? "I" : "II";
//     const report: Report[] = result;

//     const doc = new Document({
//       sections: [
//         {
//           properties: {},
//           children: [
//             new Paragraph({
//               children: [
//                 new TextRun({
//                   text: "Geethanjali College of Engineering and Technology",
//                   font: {
//                     name: "Old English Text MT",
//                   },
//                   size: 42,
//                   bold: true,
//                 }),
//               ],
//               alignment: AlignmentType.CENTER,
//               spacing: { after: 50 },
//             }),

//             new Paragraph({
//               children: [
//                 new TextRun({
//                   text: "\n(Accredited by NAAC with ‘A+’ Grade and NBA, Approved by AICTE, Autonomous Institution)",
//                   font: {
//                     name: "Times New Roman",
//                   },
//                   size: 22,
//                   bold: true,
//                   italics: true,
//                 }),
//               ],
//               alignment: AlignmentType.CENTER,
//               spacing: { after: 50 },
//             }),

//             new Paragraph({
//               children: [
//                 new TextRun({
//                   text: "\nCheeryal (V), Keesara (M), Medchal Dist-501 301.",
//                   font: {
//                     name: "Times New Roman",
//                   },
//                   size: 22,
//                   bold: true,
//                   italics: true,
//                 }),
//               ],
//               alignment: AlignmentType.CENTER,
//               spacing: { after: 200 },
//             }),

//             // Feedback Report Heading
//             new Paragraph({
//               children: [
//                 new TextRun({
//                   text: `Online Feedback report for 2023-24 ${j}-Semester Term-${count}`,
//                   font: {
//                     name: "Times New Roman",
//                   },
//                   size: 30,
//                   bold: true,
//                   italics: true,
//                 }),
//               ],
//               alignment: AlignmentType.CENTER,
//               spacing: { after: 100 },
//             }),

//             // Department Heading
//             new Paragraph({
//               children: [
//                 new TextRun({
//                   text: `Department of Computer Science and Engineering`,
//                   font: {
//                     name: "Times New Roman",
//                   },
//                   size: 30,
//                   bold: true,
//                   italics: true,
//                 }),
//               ],
//               alignment: AlignmentType.CENTER,
//               spacing: { after: 200 },
//             }),

//             new Paragraph({
//               text: `Section: ${i}-${sec}`,
//               heading: HeadingLevel.HEADING_1,
//               alignment: AlignmentType.CENTER,
//               spacing: { after: 500 },
//             }),
//             new Table({
//               width: {
//                 size: 100,
//                 type: WidthType.PERCENTAGE,
//               },
//               rows: [
//                 new TableRow({
//                   children: [
//                     new TableCell({
//                       children: [new Paragraph({
//                         children: [new TextRun({
//                           text: "S.No",
//                           bold: true,
//                           size: 25,
//                         })],
//                         alignment: AlignmentType.CENTER,
//                         spacing: { after: 240 },
//                       })],
//                       shading: { fill: "ADD8E6" },
//                       verticalAlign: VerticalAlign.CENTER,
//                       borders: {
//                         top: { style: BorderStyle.SINGLE, size: 1 },
//                         bottom: { style: BorderStyle.SINGLE, size: 1 },
//                         left: { style: BorderStyle.SINGLE, size: 1 },
//                         right: { style: BorderStyle.SINGLE, size: 1 },
//                       },
//                       margins: {
//                         top: 50,
//                         bottom: 50,
//                         left: 75,
//                         right: 75,
//                       },
//                     }),
//                     new TableCell({
//                       children: [new Paragraph({
//                         children: [new TextRun({
//                           text: "Faculty Name",
//                           bold: true,
//                           size: 25,
//                         })],
//                         alignment: AlignmentType.CENTER,
//                         spacing: { after: 240 },
//                       })],
//                       shading: { fill: "ADD8E6" },
//                       verticalAlign: VerticalAlign.CENTER,
//                       borders: {
//                         top: { style: BorderStyle.SINGLE, size: 1 },
//                         bottom: { style: BorderStyle.SINGLE, size: 1 },
//                         left: { style: BorderStyle.SINGLE, size: 1 },
//                         right: { style: BorderStyle.SINGLE, size: 1 },
//                       },
//                       margins: {
//                         top: 50,
//                         bottom: 50,
//                         left: 75,
//                         right: 75,
//                       },
//                     }),
//                     new TableCell({
//                       children: [new Paragraph({
//                         children: [new TextRun({
//                           text: "Subject Name",
//                           bold: true,
//                           size: 25,
//                         })],
//                         alignment: AlignmentType.CENTER,
//                         spacing: { after: 240 },
//                       })],
//                       shading: { fill: "ADD8E6" },
//                       verticalAlign: VerticalAlign.CENTER,
//                       borders: {
//                         top: { style: BorderStyle.SINGLE, size: 1 },
//                         bottom: { style: BorderStyle.SINGLE, size: 1 },
//                         left: { style: BorderStyle.SINGLE, size: 1 },
//                         right: { style: BorderStyle.SINGLE, size: 1 },
//                       },
//                       margins: {
//                         top: 50,
//                         bottom: 50,
//                         left: 75,
//                         right: 75,
//                       },
//                     }),
//                     new TableCell({
//                       children: [new Paragraph({
//                         children: [new TextRun({
//                           text: "Percentile",
//                           bold: true,
//                           size: 25,
//                         })],
//                         alignment: AlignmentType.CENTER,
//                         spacing: { after: 240 },
//                       })],
//                       shading: { fill: "ADD8E6" },
//                       verticalAlign: VerticalAlign.CENTER,
//                       borders: {
//                         top: { style: BorderStyle.SINGLE, size: 1 },
//                         bottom: { style: BorderStyle.SINGLE, size: 1 },
//                         left: { style: BorderStyle.SINGLE, size: 1 },
//                         right: { style: BorderStyle.SINGLE, size: 1 },
//                       },
//                       margins: {
//                         top: 50,
//                         bottom: 50,
//                         left: 75,
//                         right: 75,
//                       },
//                     }),
//                   ],
//                 }),
//                 ...report.map((item, index) =>
//                   new TableRow({
//                     children: [
//                       new TableCell({
//                         children: [new Paragraph({
//                           children: [new TextRun({
//                             text: (index + 1).toString()+'.',
//                             size: 24,
//                             bold: true,
//                           })],
//                           alignment: AlignmentType.CENTER,
//                           spacing: { after: 240 },
//                         })],
//                         shading: { fill: "ADD8E6" },
//                         verticalAlign: VerticalAlign.CENTER,
//                         borders: {
//                           top: { style: BorderStyle.SINGLE, size: 1 },
//                           bottom: { style: BorderStyle.SINGLE, size: 1 },
//                           left: { style: BorderStyle.SINGLE, size: 1 },
//                           right: { style: BorderStyle.SINGLE, size: 1 },
//                         },
//                         margins: {
//                           top: 50,
//                           bottom: 50,
//                           left: 75,
//                           right: 75,
//                         },
//                       }),
//                       new TableCell({
//                         children: [new Paragraph({
//                           children: [new TextRun({
//                             text: item.facName,
//                             size: 24,
//                           })],
//                           alignment: AlignmentType.CENTER,
//                           spacing: { after: 240 },
//                         })],
//                         verticalAlign: VerticalAlign.CENTER,
//                         borders: {
//                           top: { style: BorderStyle.SINGLE, size: 1 },
//                           bottom: { style: BorderStyle.SINGLE, size: 1 },
//                           left: { style: BorderStyle.SINGLE, size: 1 },
//                           right: { style: BorderStyle.SINGLE, size: 1 },
//                         },
//                         margins: {
//                           top: 50,
//                           bottom: 50,
//                           left: 75,
//                           right: 75,
//                         },
//                       }),
//                       new TableCell({
//                         children: [new Paragraph({
//                           children: [new TextRun({
//                             text: item.subname,
//                             size: 24,
//                           })],
//                           alignment: AlignmentType.CENTER,
//                           spacing: { after: 240 },
//                         })],
//                         verticalAlign: VerticalAlign.CENTER,
//                         borders: {
//                           top: { style: BorderStyle.SINGLE, size: 1 },
//                           bottom: { style: BorderStyle.SINGLE, size: 1 },
//                           left: { style: BorderStyle.SINGLE, size: 1 },
//                           right: { style: BorderStyle.SINGLE, size: 1 },
//                         },
//                         margins: {
//                           top: 50,
//                           bottom: 50,
//                           left: 75,
//                           right: 75,
//                         },
//                       }),
//                       new TableCell({
//                         children: [new Paragraph({
//                           children: [new TextRun({
//                             text: item.percentile.toString(),
//                             size: 24,
//                           })],
//                           alignment: AlignmentType.CENTER,
//                           spacing: { after: 240 },
//                         })],
//                         verticalAlign: VerticalAlign.CENTER,
//                         borders: {
//                           top: { style: BorderStyle.SINGLE, size: 1 },
//                           bottom: { style: BorderStyle.SINGLE, size: 1 },
//                           left: { style: BorderStyle.SINGLE, size: 1 },
//                           right: { style: BorderStyle.SINGLE, size: 1 },
//                         },
//                         margins: {
//                           top: 50,
//                           bottom: 50,
//                           left: 75,
//                           right: 75,
//                         },
//                       }),
//                     ],
//                   })
//                 ),
//               ],
//             }),
//           ],
//         },
//       ],
//     });

//     const buffer = await Packer.toBuffer(doc);

//     const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
//     const filename = `Report-${i}-${j}_${sec}_${timestamp}.docx`;
//     const docFilePath = path.join(__dirname, 'tmp', filename);
//     fs.mkdirSync(path.dirname(docFilePath), { recursive: true });

//     fs.writeFileSync(docFilePath, buffer);

//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
//     res.sendFile(docFilePath, (err) => {
//       if (err) {
//         console.error('Error sending file:', err);
//         res.status(500).send('Internal Server Error');
//       } else {
//         fs.unlinkSync(docFilePath);
//       }
//     });

//     return { path: docFilePath, timestamp };
//   } catch (error) {
//     console.error('Error fetching data or generating document:', error);
//     res.status(500).send('Internal Server Error');
//   }
// }


async function generateChart(reportData: any[]) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });

  // Prepare labels and data for the chart
  const labels = reportData.map((item: any) => item.subname);
  const percentiles = reportData.map((item: any) => item.percentile);

  const chartConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Percentile',
          data: percentiles,
          backgroundColor: percentiles.map((percentile: number) =>
            percentile > 70 ? 'rgba(2, 97, 250, 0.2)' : 'rgba(255, 99, 132, 0.2)'
          ),
          borderColor: percentiles.map((percentile: number) =>
            percentile > 70 ? 'rgba(2, 97, 250, 1)' : 'rgba(255, 99, 132, 1)'
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: 100,
          beginAtZero: true,
          ticks: {
            stepSize: 20,
            font: {
              weight: 'bold',
            },
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            font: {
              weight: 'bold',
            },
          },
        },
      },
    },
  };

  // Render the chart to an image buffer
  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(chartConfig);
  return imageBuffer;
}




// export async function downloadReport(req: Request, res: Response) {
//   const { sem, sec, batch, count } = req.query;
//   const branch = req.body.branchInToken;

//   const branchName: Record<string, string> = {
//     CSE: "Computer Science and Engineering",
//     ECE: "Electronics and Communication Engineering",
//     IOT: "Internet of Things",
//     IT: "Information Technology",
//     CIVIL: "Civil Engineering",
//     MECH: "Mechanical Engineering",
//     EEE: "Electrical and Electronics Engineering",
//     DS: "Data Science",
//     CS: "Cyber Security",
//   };

//   const fullBranchName = branchName[branch];

//   if (!sem || !batch || !count) {
//     return res.status(400).send("Semester, Batch, and Count are required.");
//   }

//   try {
//     const secCondition = sec ? `AND sec = '${sec}'` : "";
//     const result: any = await dbQuery(
//       `SELECT facName, subjects.subname, sec, sem, batch, percentile 
//        FROM report${count} 
//        JOIN subjects 
//        WHERE sem = ${sem} AND batch = ${batch} ${secCondition} AND branch = '${branch}'
//        AND TRIM(subjects.subcode) = TRIM(report${count}.subcode)
//        ORDER BY sec;`
//     );

//     const i: number = Math.floor(Number(sem) / 2);
//     const j: string = Number(sem) % 2 !== 0 ? "I" : "II";

//     let c = Math.floor(Number(sem) / 2);
//     if (Number(sem) % 2 === 0) {
//       c = c - 1;
//     }

//     const a:number = Number(batch) + c;
//     const b:number = (a % 100) + 1;

//     const report: Report[] = result;

//     const chartImageBuffer = await generateChart(report);

//     // Convert the chart buffer to a PNG for Word docx compatibility
//     const chartImagePath = path.join(__dirname, 'tmp', 'report.png');
//     await sharp(chartImageBuffer).png().toFile(chartImagePath);

//     const sections: ISectionOptions[] = [
//       {
//         children: [
//           // Document Header
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: "Geethanjali College of Engineering and Technology",
//                 font: "Old English Text MT",
//                 size: 42,
//                 bold: true,
//               }),
//             ],
//             alignment: AlignmentType.CENTER,
//             spacing: { after: 50 },
//           }),
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: "(Accredited by NAAC with ‘A+’ Grade and NBA, Approved by AICTE, Autonomous Institution)",
//                 font: "Times New Roman",
//                 size: 22,
//                 bold: true,
//                 italics: true,
//               }),
//             ],
//             alignment: AlignmentType.CENTER,
//             spacing: { after: 50 },
//           }),
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: "Cheeryal (V), Keesara (M), Medchal Dist-501 301.",
//                 font: "Times New Roman",
//                 size: 22,
//                 bold: true,
//                 italics: true,
//               }),
//             ],
//             alignment: AlignmentType.CENTER,
//             spacing: { after: 200 },
//           }),
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: `Online Feedback report for ${a}-${b} ${j}-Semester Term-${count}`,
//                 font: "Times New Roman",
//                 size: 30,
//                 bold: true,
//                 italics: true,
//               }),
//             ],
//             alignment: AlignmentType.CENTER,
//             spacing: { after: 100 },
//           }),
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: `Department of ${fullBranchName}`,
//                 font: "Times New Roman",
//                 size: 30,
//                 bold: true,
//                 italics: true,
//               }),
//             ],
//             alignment: AlignmentType.CENTER,
//             spacing: { after: 200 },
//           }),
//           // Section Header
//           new Paragraph({
//             text: `Section: ${i+Number(sem)%2}-${sec}`,
//             heading: HeadingLevel.HEADING_1,
//             alignment: AlignmentType.CENTER,
//             spacing: { after: 500 },
//           }),
//           // Table with Data
//           new Table({
//             width: { size: 100, type: WidthType.PERCENTAGE },
//             rows: [
//               // Table Headers
//               new TableRow({
//                 children: [
//                   new TableCell({
//                     children: [
//                       new Paragraph({
//                         children: [
//                           new TextRun({
//                             text: "S.No",
//                             bold: true,
//                             size: 25,
//                           }),
//                         ],
//                         alignment: AlignmentType.CENTER,
//                         spacing: { after: 240 },
//                       }),
//                     ],
//                     shading: { fill: "ADD8E6" },
//                     verticalAlign: VerticalAlign.CENTER,
//                     borders: {
//                       top: { style: BorderStyle.SINGLE, size: 1 },
//                       bottom: { style: BorderStyle.SINGLE, size: 1 },
//                       left: { style: BorderStyle.SINGLE, size: 1 },
//                       right: { style: BorderStyle.SINGLE, size: 1 },
//                     },
//                     margins: {
//                       top: 50,
//                       bottom: 50,
//                       left: 75,
//                       right: 75,
//                     },
//                   }),
//                   new TableCell({
//                     children: [
//                       new Paragraph({
//                         children: [
//                           new TextRun({
//                             text: "Faculty Name",
//                             bold: true,
//                             size: 25,
//                           }),
//                         ],
//                         alignment: AlignmentType.CENTER,
//                         spacing: { after: 240 },
//                       }),
//                     ],
//                     shading: { fill: "ADD8E6" },
//                     verticalAlign: VerticalAlign.CENTER,
//                     borders: {
//                       top: { style: BorderStyle.SINGLE, size: 1 },
//                       bottom: { style: BorderStyle.SINGLE, size: 1 },
//                       left: { style: BorderStyle.SINGLE, size: 1 },
//                       right: { style: BorderStyle.SINGLE, size: 1 },
//                     },
//                     margins: {
//                       top: 50,
//                       bottom: 50,
//                       left: 75,
//                       right: 75,
//                     },
//                   }),
//                   new TableCell({
//                     children: [
//                       new Paragraph({
//                         children: [
//                           new TextRun({
//                             text: "Subject Name",
//                             bold: true,
//                             size: 25,
//                           }),
//                         ],
//                         alignment: AlignmentType.CENTER,
//                         spacing: { after: 240 },
//                       }),
//                     ],
//                     shading: { fill: "ADD8E6" },
//                     verticalAlign: VerticalAlign.CENTER,
//                     borders: {
//                       top: { style: BorderStyle.SINGLE, size: 1 },
//                       bottom: { style: BorderStyle.SINGLE, size: 1 },
//                       left: { style: BorderStyle.SINGLE, size: 1 },
//                       right: { style: BorderStyle.SINGLE, size: 1 },
//                     },
//                     margins: {
//                       top: 50,
//                       bottom: 50,
//                       left: 75,
//                       right: 75,
//                     },
//                   }),
//                   new TableCell({
//                     children: [
//                       new Paragraph({
//                         children: [
//                           new TextRun({
//                             text: "Percentile",
//                             bold: true,
//                             size: 25,
//                           }),
//                         ],
//                         alignment: AlignmentType.CENTER,
//                         spacing: { after: 240 },
//                       }),
//                     ],
//                     shading: { fill: "ADD8E6" },
//                     verticalAlign: VerticalAlign.CENTER,
//                     borders: {
//                       top: { style: BorderStyle.SINGLE, size: 1 },
//                       bottom: { style: BorderStyle.SINGLE, size: 1 },
//                       left: { style: BorderStyle.SINGLE, size: 1 },
//                       right: { style: BorderStyle.SINGLE, size: 1 },
//                     },
//                     margins: {
//                       top: 50,
//                       bottom: 50,
//                       left: 75,
//                       right: 75,
//                     },
//                   }),

//                 ],
//               }),
//               // Table Rows
//               ...report.map((item, index) =>
//                 new TableRow({
//                   children: [
//                     new TableCell({
//                       children: [
//                         new Paragraph({
//                           children: [
//                             new TextRun({
//                               text: (index + 1).toString() + ".",
//                               size: 24,
//                               bold: true,
//                             }),
//                           ],
//                           alignment: AlignmentType.CENTER,
//                           spacing: { after: 240 },
//                         }),
//                       ],
//                       shading: { fill: "ADD8E6" },
//                       verticalAlign: VerticalAlign.CENTER,
//                       borders: {
//                         top: { style: BorderStyle.SINGLE, size: 1 },
//                         bottom: { style: BorderStyle.SINGLE, size: 1 },
//                         left: { style: BorderStyle.SINGLE, size: 1 },
//                         right: { style: BorderStyle.SINGLE, size: 1 },
//                       },
//                       margins: {
//                         top: 50,
//                         bottom: 50,
//                         left: 75,
//                         right: 75,
//                       },
//                     }),
//                     new TableCell({
//                       children: [
//                         new Paragraph({
//                           children: [
//                             new TextRun({
//                               text: item.facName,
//                               size: 24,
//                             }),
//                           ],
//                           alignment: AlignmentType.CENTER,
//                           spacing: { after: 240 },
//                         }),
//                       ],
//                       verticalAlign: VerticalAlign.CENTER,
//                       borders: {
//                         top: { style: BorderStyle.SINGLE, size: 1 },
//                         bottom: { style: BorderStyle.SINGLE, size: 1 },
//                         left: { style: BorderStyle.SINGLE, size: 1 },
//                         right: { style: BorderStyle.SINGLE, size: 1 },
//                       },
//                       margins: {
//                         top: 50,
//                         bottom: 50,
//                         left: 75,
//                         right: 75,
//                       },
//                     }),
//                     new TableCell({
//                       children: [
//                         new Paragraph({
//                           children: [
//                             new TextRun({
//                               text: item.subname,
//                               size: 24,
//                             }),
//                           ],
//                           alignment: AlignmentType.CENTER,
//                           spacing: { after: 240 },
//                         }),
//                       ],
//                       verticalAlign: VerticalAlign.CENTER,
//                       borders: {
//                         top: { style: BorderStyle.SINGLE, size: 1 },
//                         bottom: { style: BorderStyle.SINGLE, size: 1 },
//                         left: { style: BorderStyle.SINGLE, size: 1 },
//                         right: { style: BorderStyle.SINGLE, size: 1 },
//                       },
//                       margins: {
//                         top: 50,
//                         bottom: 50,
//                         left: 75,
//                         right: 75,
//                       },
//                     }),
//                     new TableCell({
//                       children: [
//                         new Paragraph({
//                           children: [
//                             new TextRun({
//                               text: item.percentile.toFixed(2),
//                               size: 24,
//                             }),
//                           ],
//                           alignment: AlignmentType.CENTER,
//                           spacing: { after: 240 },
//                         }),
//                       ],
//                       verticalAlign: VerticalAlign.CENTER,
//                       borders: {
//                         top: { style: BorderStyle.SINGLE, size: 1 },
//                         bottom: { style: BorderStyle.SINGLE, size: 1 },
//                         left: { style: BorderStyle.SINGLE, size: 1 },
//                         right: { style: BorderStyle.SINGLE, size: 1 },
//                       },
//                       margins: {
//                         top: 50,
//                         bottom: 50,
//                         left: 75,
//                         right: 75,
//                       },
//                     }),
//                   ],
//                 })
//               ),
//             ],
//           }),
//           new Paragraph({
//             children: [
//               new ImageRun({
//                 data: chartImageBuffer,  // Insert the chart image
//                 transformation: {
//                   width: 600,
//                   height: 300,
//                 },
//               }),
//             ],
//             alignment: AlignmentType.CENTER,
//           }),
//         ],
//       },
//     ];


//     const doc = new Document({
//       sections: sections,
//     });

//     const fileName = path.join(__dirname, `Report-${batch}-${i}-${j}.docx`);
//     const buffer = await Packer.toBuffer(doc);
//     const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
//     fs.writeFileSync(fileName, buffer);
//     res.download(fileName, `Report-${batch}-${sem}-${sec}-${timestamp}.docx`, () => {
//       fs.unlinkSync(fileName); 
//     });
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res.status(500).send("Failed to generate report.");
//   }
// }



// export async function downloadCFReport(req: Request, res: Response) {
//   const { sem, batch, count } = req.query;
//   const branch = req.body.branchInToken;

//   if (!sem || !batch || !count) {
//     return res.status(400).send("Semester, Batch, and Count are required.");
//   }

//   try {
//     const result: any = await dbQuery(
//       `WITH QuestionText AS (
//                     SELECT 
//                         'Employability Skills' AS qtext, 0 AS seq
//                     UNION ALL
//                     SELECT 
//                         'Mentoring support', 1
//                     UNION ALL
//                     SELECT 
//                         'Campus Placement Efforts', 2
//                     UNION ALL
//                     SELECT 
//                         'Career and academic guidance', 3
//                     UNION ALL
//                     SELECT 
//                         'Leadership of the college', 4
//                     UNION ALL
//                     SELECT 
//                         'Soft skills and Personality Development', 5
//                     UNION ALL
//                     SELECT 
//                         'Library Facilities', 6
//                     UNION ALL
//                     SELECT 
//                         'Extracurricular activities', 7
//                     UNION ALL
//                     SELECT 
//                         'Co-curricular activities', 8
//                     UNION ALL
//                     SELECT 
//                         'College transport facilities', 9
//                     UNION ALL
//                     SELECT 
//                         'Service in Academic Section', 10
//                     UNION ALL
//                     SELECT 
//                         'Service in Exam Branch', 11
//                     UNION ALL
//                     SELECT 
//                         'Service in Accounts Section', 12
//                     UNION ALL
//                     SELECT 
//                         'Physical Education Facilities', 13
//                     UNION ALL
//                     SELECT 
//                         'Quality of food in Canteen', 14
//                     UNION ALL
//                     SELECT 
//                         'Service in the Canteen', 15
//                     UNION ALL
//                     SELECT 
//                         'Overall opinion of GCET', 16
//                 )
//                 SELECT 
//                     qt.qtext AS question, 
//                     branch, 
//                     sem, 
//                     COUNT(branch) AS count,
//                     CASE qt.seq
//                         WHEN 0 THEN AVG(q0)
//                         WHEN 1 THEN AVG(q1)
//                         WHEN 2 THEN AVG(q2)
//                         WHEN 3 THEN AVG(q3)
//                         WHEN 4 THEN AVG(q4)
//                         WHEN 5 THEN AVG(q5)
//                         WHEN 6 THEN AVG(q6)
//                         WHEN 7 THEN AVG(q7)
//                         WHEN 8 THEN AVG(q8)
//                         WHEN 9 THEN AVG(q9)
//                         WHEN 10 THEN AVG(q10)
//                         WHEN 11 THEN AVG(q11)
//                         WHEN 12 THEN AVG(q12)
//                         WHEN 13 THEN AVG(q13)
//                         WHEN 14 THEN AVG(q14)
//                         WHEN 15 THEN AVG(q15)
//                         WHEN 16 THEN AVG(q16)
//                     END AS total,
//                     ROUND(
//                         CASE 
//                             WHEN COUNT(branch) > 0 THEN (CASE qt.seq
//                                 WHEN 0 THEN AVG(q0)
//                                 WHEN 1 THEN AVG(q1)
//                                 WHEN 2 THEN AVG(q2)
//                                 WHEN 3 THEN AVG(q3)
//                                 WHEN 4 THEN AVG(q4)
//                                 WHEN 5 THEN AVG(q5)
//                                 WHEN 6 THEN AVG(q6)
//                                 WHEN 7 THEN AVG(q7)
//                                 WHEN 8 THEN AVG(q8)
//                                 WHEN 9 THEN AVG(q9)
//                                 WHEN 10 THEN AVG(q10)
//                                 WHEN 11 THEN AVG(q11)
//                                 WHEN 12 THEN AVG(q12)
//                                 WHEN 13 THEN AVG(q13)
//                                 WHEN 14 THEN AVG(q14)
//                                 WHEN 15 THEN AVG(q15)
//                                 WHEN 16 THEN AVG(q16)
//                             END) / COUNT(branch) * 20
//                             ELSE 0 
//                         END,
//                     3) AS adjusted_total
//                     FROM cf1
//                     CROSS JOIN QuestionText qt
//                     WHERE branch = '${branch}'
//                     GROUP BY qt.qtext, qt.seq, branch, sem
//                     ORDER BY branch, qt.seq;
// `
//     );

//     let i: number = Math.floor(Number(sem) / 2);
//     let j: string = Number(sem) % 2 !== 0 ? "I" : "II";
//     const report: Report[] = result;

//     const sections: ISectionOptions[] = (Array.from(new Set(report.map((item) => item.sec))).map((section) => ({
//           sec: section,
//           reportData: report.filter((item) => item.sec === section),
//         }))
//     ).map((sectionData) => ({
//       properties: {
//         type: SectionType.NEXT_PAGE, // Start a new section on the next page
//       },
//       children: [
//         // Document Header
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: "Geethanjali College of Engineering and Technology",
//               font: "Old English Text MT",
//               size: 42,
//               bold: true,
//             }),
//           ],
//           alignment: AlignmentType.CENTER,
//           spacing: { after: 50 },
//         }),
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: "(Accredited by NAAC with ‘A+’ Grade and NBA, Approved by AICTE, Autonomous Institution)",
//               font: "Times New Roman",
//               size: 22,
//               bold: true,
//               italics: true,
//             }),
//           ],
//           alignment: AlignmentType.CENTER,
//           spacing: { after: 50 },
//         }),
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: "Cheeryal (V), Keesara (M), Medchal Dist-501 301.",
//               font: "Times New Roman",
//               size: 22,
//               bold: true,
//               italics: true,
//             }),
//           ],
//           alignment: AlignmentType.CENTER,
//           spacing: { after: 200 },
//         }),
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: `Online Feedback report for 2023-24 ${j}-Semester Term-${count}`,
//               font: "Times New Roman",
//               size: 30,
//               bold: true,
//               italics: true,
//             }),
//           ],
//           alignment: AlignmentType.CENTER,
//           spacing: { after: 100 },
//         }),
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: "Department of Computer Science and Engineering",
//               font: "Times New Roman",
//               size: 30,
//               bold: true,
//               italics: true,
//             }),
//           ],
//           alignment: AlignmentType.CENTER,
//           spacing: { after: 200 },
//         }),

//         // Table with Data
//         new Table({
//           width: { size: 100, type: WidthType.PERCENTAGE },
//           rows: [
//             // Table Headers
//             new TableRow({
//               children: [
//                 new TableCell({
//                   children: [
//                     new Paragraph({
//                       children: [
//                         new TextRun({
//                           text: "S.No",
//                           bold: true,
//                           size: 25,
//                         }),
//                       ],
//                       alignment: AlignmentType.CENTER,
//                       spacing: { after: 240 },
//                     }),
//                   ],
//                   shading: { fill: "ADD8E6" },
//                   verticalAlign: VerticalAlign.CENTER,
//                   borders: {
//                     top: { style: BorderStyle.SINGLE, size: 1 },
//                     bottom: { style: BorderStyle.SINGLE, size: 1 },
//                     left: { style: BorderStyle.SINGLE, size: 1 },
//                     right: { style: BorderStyle.SINGLE, size: 1 },
//                   },
//                   margins: {
//                     top: 50,
//                     bottom: 50,
//                     left: 75,
//                     right: 75,
//                   },
//                 }),
//                 new TableCell({
//                   children: [
//                     new Paragraph({
//                       children: [
//                         new TextRun({
//                           text: "Question",
//                           bold: true,
//                           size: 25,
//                         }),
//                       ],
//                       alignment: AlignmentType.CENTER,
//                       spacing: { after: 240 },
//                     }),
//                   ],
//                   shading: { fill: "ADD8E6" },
//                   verticalAlign: VerticalAlign.CENTER,
//                   borders: {
//                     top: { style: BorderStyle.SINGLE, size: 1 },
//                     bottom: { style: BorderStyle.SINGLE, size: 1 },
//                     left: { style: BorderStyle.SINGLE, size: 1 },
//                     right: { style: BorderStyle.SINGLE, size: 1 },
//                   },
//                   margins: {
//                     top: 50,
//                     bottom: 50,
//                     left: 75,
//                     right: 75,
//                   },
//                 }),
//                 new TableCell({
//                   children: [
//                     new Paragraph({
//                       children: [
//                         new TextRun({
//                           text: "Percentile",
//                           bold: true,
//                           size: 25,
//                         }),
//                       ],
//                       alignment: AlignmentType.CENTER,
//                       spacing: { after: 240 },
//                     }),
//                   ],
//                   shading: { fill: "ADD8E6" },
//                   verticalAlign: VerticalAlign.CENTER,
//                   borders: {
//                     top: { style: BorderStyle.SINGLE, size: 1 },
//                     bottom: { style: BorderStyle.SINGLE, size: 1 },
//                     left: { style: BorderStyle.SINGLE, size: 1 },
//                     right: { style: BorderStyle.SINGLE, size: 1 },
//                   },
//                   margins: {
//                     top: 50,
//                     bottom: 50,
//                     left: 75,
//                     right: 75,
//                   },
//                 }),
//               ],
//             }),
//             ...sectionData.reportData.map((data, index) => new TableRow({
//               children: [
//                 new TableCell({
//                   children: [
//                     new Paragraph({
//                       children: [
//                         new TextRun({
//                           text: (index + 1).toString(),
//                           size: 20,
//                         }),
//                       ],
//                       alignment: AlignmentType.CENTER,
//                       spacing: { after: 100 },
//                     }),
//                   ],
//                   verticalAlign: VerticalAlign.CENTER,
//                   borders: {
//                     top: { style: BorderStyle.SINGLE, size: 1 },
//                     bottom: { style: BorderStyle.SINGLE, size: 1 },
//                     left: { style: BorderStyle.SINGLE, size: 1 },
//                     right: { style: BorderStyle.SINGLE, size: 1 },
//                   },
//                   margins: {
//                     top: 50,
//                     bottom: 50,
//                     left: 75,
//                     right: 75,
//                   },
//                 }),
//                 new TableCell({
//                   children: [
//                     new Paragraph({
//                       children: [
//                         new TextRun({
//                           text: data.question || 'N/A',
//                           size: 20,
//                         }),
//                       ],
//                       alignment: AlignmentType.CENTER,
//                       spacing: { after: 100 },
//                     }),
//                   ],
//                   verticalAlign: VerticalAlign.CENTER,
//                   borders: {
//                     top: { style: BorderStyle.SINGLE, size: 1 },
//                     bottom: { style: BorderStyle.SINGLE, size: 1 },
//                     left: { style: BorderStyle.SINGLE, size: 1 },
//                     right: { style: BorderStyle.SINGLE, size: 1 },
//                   },
//                   margins: {
//                     top: 50,
//                     bottom: 50,
//                     left: 75,
//                     right: 75,
//                   },
//                 }),
//                 new TableCell({
//                   children: [
//                     new Paragraph({
//                       children: [
//                         new TextRun({
//                           text: data.adjusted_total ? data.adjusted_total.toFixed(2) : '0',
//                           size: 20,
//                         }),
//                       ],
//                       alignment: AlignmentType.CENTER,
//                       spacing: { after: 100 },
//                     }),
//                   ],
//                   verticalAlign: VerticalAlign.CENTER,
//                   borders: {
//                     top: { style: BorderStyle.SINGLE, size: 1 },
//                     bottom: { style: BorderStyle.SINGLE, size: 1 },
//                     left: { style: BorderStyle.SINGLE, size: 1 },
//                     right: { style: BorderStyle.SINGLE, size: 1 },
//                   },
//                   margins: {
//                     top: 50,
//                     bottom: 50,
//                     left: 75,
//                     right: 75,
//                   },
//                 }),
//               ],
//             })),
//           ],
//         }),
//       ],
//     }));

//     const doc = new Document({
//       sections: sections,
//     });

//     const buffer = await Packer.toBuffer(doc);
//     const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
//     const filePath = path.join(__dirname, `cfreport_${branch}_${timestamp}.docx`);
//     fs.writeFileSync(filePath, buffer);

//     res.download(filePath, (err) => {
//       if (err) {
//         console.error("Error sending file:", err);
//         res.status(500).send("Error generating report.");
//       } else {
//         fs.unlink(filePath, (unlinkErr) => {
//           if (unlinkErr) console.error("Error deleting file:", unlinkErr);
//         });
//       }
//     });
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res.status(500).send("Error generating report.");
//   }
// }


export async function downloadReport(req: Request, res: Response) {
  const { sem, sec, batch, count, fbranch } = req.query;
  const branchControl = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;


  const branchName: Record<string, string> = {
    CSE: "Computer Science and Engineering",
    ECE: "Electronics and Communication Engineering",
    IOT: "Internet of Things",
    IT: "Information Technology",
    CIVIL: "Civil Engineering",
    MECH: "Mechanical Engineering",
    EEE: "Electrical and Electronics Engineering",
    DS: "Data Science",
    CS: "Cyber Security",
  };

  const fullBranchName = branchName[branchControl];

  if (!sem || !batch || !count) {
    return res.status(400).send("Semester, Batch, and Count are required.");
  }

  try {
    const secCondition = sec ? `AND sec = '${sec}'` : "";
    const result: any = await dbQuery(
      `SELECT facName, subjects.subname, sec, sem, batch, percentile 
       FROM report${count} 
       JOIN subjects 
       ON TRIM(subjects.subcode) = TRIM(report${count}.subcode)
       WHERE sem = ${sem} AND batch = ${batch} ${secCondition} AND branch = '${branchControl}'
       ORDER BY sec;`
    );

    const i: number = Math.floor(Number(sem) / 2);
    const j: string = Number(sem) % 2 !== 0 ? "I" : "II";

    let c = Math.floor(Number(sem) / 2);
    if (Number(sem) % 2 === 0) {
      c = c - 1;
    }

    const a: number = Number(batch) + c;
    const b: number = (a % 100) + 1;

    const sectionPromises: Promise<(Paragraph | Table)[]>[] = [...new Set(result.map((row: any) => row.sec))].map(async (section) => {
      const sectionData = result.filter((row: any) => row.sec === section);

      // Generate chart for the current section
      const chartImageBuffer = await generateChart(sectionData);
      const chartImagePath = path.join(__dirname, 'tmp', `report_${section}.png`);
      await sharp(chartImageBuffer).png().toFile(chartImagePath);

      return [
        // Section Header
        new Paragraph({
          text: `Section: ${i + Number(sem) % 2}-${section}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 500 },
        }),
        // Table with Data
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Table Headers
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "S.No",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                  margins: {
                    top: 50,
                    bottom: 50,
                    left: 75,
                    right: 75,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Faculty Name",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                  margins: {
                    top: 50,
                    bottom: 50,
                    left: 75,
                    right: 75,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Subject Name",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                  margins: {
                    top: 50,
                    bottom: 50,
                    left: 75,
                    right: 75,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Percentile",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                  margins: {
                    top: 50,
                    bottom: 50,
                    left: 75,
                    right: 75,
                  },
                }),
              ],
            }),
            // Table Rows
            ...sectionData.map((item: { facName: any; subname: any; percentile: { toString: () => any; }; }, index: number) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (index + 1).toString() + ".",
                            size: 24,
                            bold: true,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      }),
                    ],
                    shading: { fill: "ADD8E6" },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 75,
                      right: 75,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.facName,
                            size: 24,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 75,
                      right: 75,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.subname,
                            size: 24,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 75,
                      right: 75,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.percentile.toString(),
                            size: 24,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 75,
                      right: 75,
                    },
                  }),
                ],
              })
            ),
          ],
        }),
        // Chart Image
        new Paragraph({
          children: [
            new ImageRun({
              data: fs.readFileSync(chartImagePath),
              transformation: {
                width: 600,
                height: 400,
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 500 },
        }),
      ];
    });

    // Resolve the section promises
    const resolvedSections = await Promise.all(sectionPromises);

    // Create the Document
    const doc = new Document({
      sections: [
        {
          children: [
            // Report Header
            new Paragraph({
              children: [
                new TextRun({
                  text: "Geethanjali College of Engineering and Technology",
                  font: "Old English Text MT",
                  size: 42,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "(Accredited by NAAC with ‘A+’ Grade and NBA, Approved by AICTE, Autonomous Institution)",
                  font: "Times New Roman",
                  size: 22,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Cheeryal (V), Keesara (M), Medchal Dist-501 301.",
                  font: "Times New Roman",
                  size: 22,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Online Feedback report for ${a}-${b} ${j}-Semester Term-${count}`,
                  font: "Times New Roman",
                  size: 30,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Department of ${fullBranchName}`,
                  font: "Times New Roman",
                  size: 30,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            // Add resolved sections to the document
            ...resolvedSections.flat(),
          ],
        },
      ],
    });

    // Generate Document and Save to File
    const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
    const buffer = await Packer.toBuffer(doc);
    const filePath = path.join(__dirname, 'tmp', `Report_${sem}_${batch}_${count}.docx`);
    fs.writeFileSync(filePath, buffer);

    // Send File to Client
    res.download(filePath, `Report-${batch}-${sem}-${sec ? sec : `ALL_Sections`}-${timestamp}.docx`, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error generating report.");
      } else {
        // Clean up temporary files
        fs.readdir(path.join(__dirname, 'tmp'), (err, files) => {
          if (err) throw err;
          files.forEach(file => {
            fs.unlink(path.join(__dirname, 'tmp', file), err => {
              if (err) throw err;
            });
          });
        });
      }
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("Error generating report.");
  }
}



// async function createChartImage(data: any[], outputPath: string) {
//   const chartJSNodeCanvas = new ChartJSNodeCanvas({
//     width: 1200, // Increased width
//     height: 1200, // Increased height
//   });

//   const configuration: ChartConfiguration<'bar', number[], string> = {
//     type: 'bar',
//     data: {
//       labels: data.map(item => item.que),
//       datasets: [{
//         label: 'Scores',
//         minBarLength: 200,
//         data: data.map(item => item.value),
//         backgroundColor: data.map(item => item.value >= 70 ? 'green' : 'red'),
//       }],
//     },
//     options: {
//       responsive: false,
//       plugins: {
//         legend: {
//           display: true,
//           labels: {
//             font: {
//               weight: 'bold', // Bold legend labels
//             },
//           },
//         },
//         tooltip: {
//           callbacks: {
//             title: (tooltipItems) => {
//               return tooltipItems[0].label;
//             },
//             label: (tooltipItem) => {
//               return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
//             },
//           },
//           bodyFont: {
//             weight: 'bold', // Bold tooltip text
//           },
//         },
//       },
//       layout: {
//         padding: {
//           top: 30,
//           bottom: 20,
//           left: 40,
//           right: 40,
//         },
//       },
//       indexAxis: 'y',
//       scales: {
//         x: {
//           type: 'linear',
//           ticks: {
//             stepSize: 20,
//             callback: function (tickValue: number | string) {
//               const value = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
//               return value % 20 === 0 ? value.toString() : '';
//             },
//             font: {
//               weight: 'bold', // Bold x-axis ticks
//             },
//           },
//           suggestedMin: 0,
//           suggestedMax: 100,
//           grid: {
//             drawTicks: false,
//           },
//         },
//         y: {
//           type: 'category',
//           labels: data.map(item => item.category),
//           ticks: {
//             autoSkip: true,
//             font: {
//               weight: 'bold', // Bold y-axis ticks
//               size: 16
//             },
//           },
//         },
//       },
//     },
//   };

//   // Generate the chart image
//   const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);

//   // Rotate the image 90 degrees clockwise using sharp
//   const rotatedBuffer = await sharp(buffer)
//     .rotate(90)
//     .toBuffer();

//   // Save the rotated image
//   fs.writeFileSync(outputPath, rotatedBuffer);
// }

async function createChartImage(data: any[], outputPath: string) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 1200, // Increased width
    height: 1200, // Increased height
  });

  const configuration: ChartConfiguration<'bar', number[], string> = {
    type: 'bar',
    data: {
      labels: data.map((item, index) => `Que - ${index + 1}`), // X-axis: Questions like Que - 1, Que - 2, etc.
      datasets: [{
        label: 'Scores',
        minBarLength: 200,
        data: data.map(item => item.value), // Y-axis: Scores
        backgroundColor: data.map(item => item.value >= 70 ? 'green' : 'red'), // Dynamic colors based on value
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: {
              weight: 'bold', // Bold legend labels
            },
          },
        },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => tooltipItems[0].label,
            label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
          },
          bodyFont: {
            weight: 'bold', // Bold tooltip text
          },
        },
      },
      layout: {
        padding: {
          top: 30,
          bottom: 20,
          left: 40,
          right: 40,
        },
      },
      scales: {
        x: {
          type: 'category',
          labels: data.map((_item, index) => `Que - ${index + 1}`),
          ticks: {
            font: {
              size: 25,
              weight: 'bold',
            },
          },
        },
        y: {
          type: 'linear',
          ticks: {
            stepSize: 20,
            callback: (tickValue: string | number) => {
              const value = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
              return value % 20 === 0 ? value.toString() : '';
            },
            font: {
              weight: 'bold',
              size: 25,
            },
          },

          grid: {
            drawTicks: false,
          },
        },
      },
    },
  };

  // Generate the chart image
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);

  // Optionally rotate the image (if needed)
  const rotatedBuffer = await sharp(buffer)
    .toBuffer();

  // Save the image
  fs.writeFileSync(outputPath, rotatedBuffer);
}



export async function downloadCFReport(req: Request, res: Response) {
  const { sem, batch, count, fbranch } = req.query;
  const branch = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;

  const branchName: Record<string, string> = {
    CSE: "Computer Science and Engineering",
    ECE: "Electronics and Communication Engineering",
    IOT: "Internet of Things",
    IT: "Information Technology",
    CIVIL: "Civil Engineering",
    MECH: "Mechanical Engineering",
    EEE: "Electrical and Electronics Engineering",
    DS: "Data Science",
    CS: "Cyber Security",
  };

  const fullBranchName = branchName[branch];

  if (!sem || !batch || !count) {
    return res.status(400).send("Semester, Batch, and Count are required.");
  }

  try {
    const query = `
                  WITH QuestionText AS (
                    SELECT 
                        'Employability Skills' AS qtext, 0 AS seq
                    UNION ALL
                    SELECT 
                        'Mentoring support', 1
                    UNION ALL
                    SELECT 
                        'Campus Placement Efforts', 2
                    UNION ALL
                    SELECT 
                        'Career and academic guidance', 3
                    UNION ALL
                    SELECT 
                        'Leadership of the college', 4
                    UNION ALL
                    SELECT 
                        'Soft skills and Personality Development', 5
                    UNION ALL
                    SELECT 
                        'Library Facilities', 6
                    UNION ALL
                    SELECT 
                        'Extracurricular activities', 7
                    UNION ALL
                    SELECT 
                        'Co-curricular activities', 8
                    UNION ALL
                    SELECT 
                        'College transport facilities', 9
                    UNION ALL
                    SELECT 
                        'Service in Academic Section', 10
                    UNION ALL
                    SELECT 
                        'Service in Exam Branch', 11
                    UNION ALL
                    SELECT 
                        'Service in Accounts Section', 12
                    UNION ALL
                    SELECT 
                        'Physical Education Facilities', 13
                    UNION ALL
                    SELECT 
                        'Quality of food in Canteen', 14
                    UNION ALL
                    SELECT 
                        'Service in the Canteen', 15
                    UNION ALL
                    SELECT 
                        'Overall opinion of GCET', 16
                )
                SELECT 
                    qt.qtext AS question, 
                    branch, 
                    sem, 
                    COUNT(*) AS count,
                    CASE qt.seq
                        WHEN 0 THEN AVG(q0)
                        WHEN 1 THEN AVG(q1)
                        WHEN 2 THEN AVG(q2)
                        WHEN 3 THEN AVG(q3)
                        WHEN 4 THEN AVG(q4)
                        WHEN 5 THEN AVG(q5)
                        WHEN 6 THEN AVG(q6)
                        WHEN 7 THEN AVG(q7)
                        WHEN 8 THEN AVG(q8)
                        WHEN 9 THEN AVG(q9)
                        WHEN 10 THEN AVG(q10)
                        WHEN 11 THEN AVG(q11)
                        WHEN 12 THEN AVG(q12)
                        WHEN 13 THEN AVG(q13)
                        WHEN 14 THEN AVG(q14)
                        WHEN 15 THEN AVG(q15)
                        WHEN 16 THEN AVG(q16)
                    END AS total,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) > 0 THEN (CASE qt.seq
                                WHEN 0 THEN AVG(q0)
                                WHEN 1 THEN AVG(q1)
                                WHEN 2 THEN AVG(q2)
                                WHEN 3 THEN AVG(q3)
                                WHEN 4 THEN AVG(q4)
                                WHEN 5 THEN AVG(q5)
                                WHEN 6 THEN AVG(q6)
                                WHEN 7 THEN AVG(q7)
                                WHEN 8 THEN AVG(q8)
                                WHEN 9 THEN AVG(q9)
                                WHEN 10 THEN AVG(q10)
                                WHEN 11 THEN AVG(q11)
                                WHEN 12 THEN AVG(q12)
                                WHEN 13 THEN AVG(q13)
                                WHEN 14 THEN AVG(q14)
                                WHEN 15 THEN AVG(q15)
                                WHEN 16 THEN AVG(q16)
                            END) * 20
                            ELSE 0 
                        END,
                    3) AS adjusted_total
                    FROM cf${count}
                    CROSS JOIN QuestionText qt
                    WHERE branch = '${branch}' AND sem = ${sem} AND batch = ${batch}
                    GROUP BY qt.qtext, qt.seq, branch, sem, batch
                    ORDER BY branch, qt.seq; 
          `;
      
    const result: any = await dbQuery(query);


    const i: number = Math.floor(Number(sem) / 2);
    const j: string = Number(sem) % 2 !== 0 ? "I" : "II";

    let c = Math.floor(Number(sem) / 2);
    if (Number(sem) % 2 === 0) {
      c = c - 1;
    }

    const a: number = Number(batch) + c;
    const b: number = (a % 100) + 1;

    const report: Report[] = result;

    // Prepare chart data
    const chartData = report.map(item => ({
      category: item.question,
      value: item.adjusted_total || 0,
    }));

    const chartImagePath = path.join(__dirname, 'tmp', 'cfreport.png');
    await createChartImage(chartData, chartImagePath);

    const sections: ISectionOptions[] = (Array.from(new Set(report.map((item) => item.sec))).map((section) => ({
      sec: section,
      reportData: report.filter((item) => item.sec === section),
    }))
    ).map((sectionData) => ({
      properties: {
        type: SectionType.NEXT_PAGE,
      },
      children: [
        // Document Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Geethanjali College of Engineering and Technology",
              font: "Old English Text MT",
              size: 42,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "(Accredited by NAAC with ‘A+’ Grade and NBA, Approved by AICTE, Autonomous Institution)",
              font: "Times New Roman",
              size: 22,
              bold: true,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Cheeryal (V), Keesara (M), Medchal Dist-501 301.",
              font: "Times New Roman",
              size: 22,
              bold: true,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Online Feedback report for ${a}-${b} ${j}-Semester Term-${count}`,
              font: "Times New Roman",
              size: 30,
              bold: true,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Department of ${fullBranchName} `,
              font: "Times New Roman",
              size: 30,
              bold: true,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Table with Data
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Table Headers
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "S.No",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Question",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Percentage",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),

            // Data Rows
            ...report.map((item, index) => new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: (index + 1).toString(),
                          size: 22,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 100 },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: item.question,
                          size: 22,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 100 },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: item.adjusted_total.toString(),
                          size: 22,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 100 },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),

              ],
            })),

            // Chart Image
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 4,
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: fs.readFileSync(chartImagePath),
                          transformation: {
                            width: 600,
                            height: 400,
                          },
                        }),
                      ],
                      spacing: { after: 200 },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    }));

    // Create Document
    const doc = new Document({
      sections: sections,
    });

    const fileName = path.join(__dirname, `Report-${batch}-${i}-${j}.docx`);
    const buffer = await Packer.toBuffer(doc);
    const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
    fs.writeFileSync(fileName, buffer);
    res.download(fileName, `CFReport-${branch}-${batch}-${timestamp}.docx`, () => {
      fs.unlinkSync(fileName);
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("Failed to generate report.");
  }
}


export async function downloadReportQuestion(req: Request, res: Response) {
  const { term, sem, sec, facID, subcode, batch, fbranch } = req.query;
  const branchControl = (req.body.branchInToken !== 'FME') ? req.body.branchInToken : fbranch;
  const subjectType: any = await dbQuery(`SELECT qtype, subName, subCode FROM subjects WHERE subcode = '${subcode}';`);
  const facultyName: any = await dbQuery(`SELECT facName FROM faculty WHERE facID = '${facID}';`);
  const { facName } = facultyName[0]
  const { qtype, subName, subCode } = subjectType[0];

  const branchName: Record<string, string> = {
    CSE: "Computer Science and Engineering",
    ECE: "Electronics and Communication Engineering",
    IOT: "Internet of Things",
    IT: "Information Technology",
    CIVIL: "Civil Engineering",
    MECH: "Mechanical Engineering",
    EEE: "Electrical and Electronics Engineering",
    DS: "Data Science",
    CS: "Cyber Security",
  };

  const fullBranchName = branchName[branchControl];

  if (!sem || !batch || !term) {
    return res.status(400).send("Semester, Batch, and Count are required.");
  }

  try {
    let result: any;
    if (qtype === "theory") {
      result = await dbQuery(`
      WITH QuestionText AS (
            SELECT 
                'Passion and enthusiasm to teach' AS qtext, 1 AS seq
            UNION ALL
            SELECT 
                'Subject knowledge', 2
            UNION ALL
            SELECT 
                'Clarity and emphasis on concepts', 3
            UNION ALL
            SELECT 
                'Motivate the student to explore the concepts in depth on his/her own', 4
            UNION ALL
            SELECT 
                'Creating interest in the subject', 5
            UNION ALL
            SELECT 
                'Quality of illustrative visuals, examples and applications', 6
            UNION ALL
            SELECT 
                'Regularity, punctuality & uniform coverage of syllabus', 7
            UNION ALL
            SELECT 
                'Discipline and control over the class', 8
            UNION ALL
            SELECT 
                'Promoting student thinking', 9
            UNION ALL
            SELECT 
                'Encouraging student effort & inviting student interaction', 10
          )
          SELECT 
            qt.qtext AS question, 
            si.branch, 
            ts.sem, 
            COUNT(si.sec) AS count,
            CASE qt.seq
                WHEN 1 THEN AVG(ts.q1)
                WHEN 2 THEN AVG(ts.q2)
                WHEN 3 THEN AVG(ts.q3)
                WHEN 4 THEN AVG(ts.q4)
                WHEN 5 THEN AVG(ts.q5)
                WHEN 6 THEN AVG(ts.q6)
                WHEN 7 THEN AVG(ts.q7)
                WHEN 8 THEN AVG(ts.q8)
                WHEN 9 THEN AVG(ts.q9)
                WHEN 10 THEN AVG(ts.q10)
            END AS total,
            ROUND(
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        CASE qt.seq
                            WHEN 1 THEN AVG(ts.q1)
                            WHEN 2 THEN AVG(ts.q2)
                            WHEN 3 THEN AVG(ts.q3)
                            WHEN 4 THEN AVG(ts.q4)
                            WHEN 5 THEN AVG(ts.q5)
                            WHEN 6 THEN AVG(ts.q6)
                            WHEN 7 THEN AVG(ts.q7)
                            WHEN 8 THEN AVG(ts.q8)
                            WHEN 9 THEN AVG(ts.q9)
                            WHEN 10 THEN AVG(ts.q10)
                        END * 20
                    ELSE 0 
                END, 3) AS adjusted_total
          FROM theoryscore${term} ts
          JOIN studentinfo si ON ts.rollno = si.rollno
          CROSS JOIN QuestionText qt
          WHERE si.branch = '${branchControl}'
          AND ts.sem = ${sem}
          AND si.sec = '${sec}'
          AND ts.facID = '${facID}'
          AND ts.subcode = '${subcode}'
          AND si.batch = '${batch}'
          GROUP BY qt.qtext, qt.seq, si.branch, ts.sem, si.sec
          ORDER BY si.branch, qt.seq;
        `);
    } else if (qtype === "lab") {
      result = await dbQuery(`
        WITH QuestionText AS (
              SELECT 
                  'The lab instructor explained objectives and outcomes of lab experiments clearly well before the commencement of the lab' AS qtext, 1 AS seq
              UNION ALL
              SELECT 
                  'The lab instructor explained the procedures involved to perform the lab experiments/algorithms clearly well before the commencement of the lab', 2
              UNION ALL
              SELECT 
                  'The laboratory assignments/discussion questions given after the completion of the experiment are interesting and reinforce what I have learned in the lab and its corresponding theoretical concepts', 3
              UNION ALL
              SELECT 
                  'The lab instructor is impartial in dealing with all students and was regularly available for consultation during the lab', 4
              UNION ALL
              SELECT 
                  'The lab instructor evaluated my work promptly, provided helpful feedback on my progress and offered specific advice to promote improvement', 5
              UNION ALL
              SELECT 
                  'The lab instructor encourages me to work better with others in the lab', 6
              UNION ALL
              SELECT 
                  'The lab instructor helps me learn important techniques associated with this lab course', 7
              UNION ALL
              SELECT 
                  'Experiments/Algorithms detailed in the lab course have enhanced my critical thinking ability', 8
            )
            SELECT 
              qt.qtext AS question, 
              si.branch, 
              ls.sem, 
              COUNT(si.sec) AS count,
              CASE qt.seq
                  WHEN 1 THEN AVG(ls.q1)
                  WHEN 2 THEN AVG(ls.q2)
                  WHEN 3 THEN AVG(ls.q3)
                  WHEN 4 THEN AVG(ls.q4)
                  WHEN 5 THEN AVG(ls.q5)
                  WHEN 6 THEN AVG(ls.q6)
                  WHEN 7 THEN AVG(ls.q7)
                  WHEN 8 THEN AVG(ls.q8)
              END AS total,
              ROUND(
                  CASE 
                      WHEN COUNT(*) > 0 THEN 
                          CASE qt.seq
                              WHEN 1 THEN AVG(ls.q1)
                              WHEN 2 THEN AVG(ls.q2)
                              WHEN 3 THEN AVG(ls.q3)
                              WHEN 4 THEN AVG(ls.q4)
                              WHEN 5 THEN AVG(ls.q5)
                              WHEN 6 THEN AVG(ls.q6)
                              WHEN 7 THEN AVG(ls.q7)
                              WHEN 8 THEN AVG(ls.q8)
                          END * 20
                      ELSE 0 
                  END, 3) AS adjusted_total
            FROM labscore${term} ls
            JOIN studentinfo si ON ls.rollno = si.rollno
            CROSS JOIN QuestionText qt
            WHERE si.branch = '${branchControl}'
            AND ls.sem = ${sem}
            AND si.sec = '${sec}'
            AND ls.facID = '${facID}'
            AND ls.subcode = '${subcode}'
            AND si.batch = '${batch}'
            GROUP BY qt.qtext, qt.seq, si.branch, ls.sem, si.sec
            ORDER BY si.branch, qt.seq;
          `);
    }
    let i: number = Math.floor(Number(sem) / 2);
    let j: string = Number(sem) % 2 !== 0 ? "I" : "II";
    const report: Report[] = result;

    // Prepare chart data
    const chartData = report.map(item => ({
      category: item.question,
      value: item.adjusted_total || 0,
    }));

    const chartImagePath = path.join(__dirname, 'tmp', 'reportque.png');
    await createChartImage(chartData, chartImagePath);

    const sections: ISectionOptions[] = (Array.from(new Set(report.map((item) => item.sec))).map((section) => ({
      sec: section,
      reportData: report.filter((item) => item.sec === section),
    }))
    ).map(() => ({
      properties: {
        type: SectionType.NEXT_PAGE,
      },
      children: [
        // Document Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Geethanjali College of Engineering and Technology",
              font: "Old English Text MT",
              size: 42,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "(Accredited by NAAC with ‘A+’ Grade and NBA, Approved by AICTE, Autonomous Institution)",
              font: "Times New Roman",
              size: 22,
              bold: true,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Cheeryal (V), Keesara (M), Medchal Dist-501 301.",
              font: "Times New Roman",
              size: 22,
              bold: true,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Online Feedback report for 2023-24 ${j}-Semester Term-${term}`,
              font: "Times New Roman",
              size: 30,
              bold: true,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Department of ${fullBranchName} `,
              font: "Times New Roman",
              size: 30,
              bold: true,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Faculty Name: ${facName}`,
              font: "Times New Roman",
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Semester: ${sem}`,
              font: "Times New Roman",
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Section: ${sec}`,
              font: "Times New Roman",
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Batch: ${batch}`,
              font: "Times New Roman",
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Subject Code: ${subCode}`,
              font: "Times New Roman",
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Subject Name: ${subName}`,
              font: "Times New Roman",
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
        }),

        // Table with Data
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Table Headers
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "S.No",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Question",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Percentage",
                          bold: true,
                          size: 25,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 240 },
                    }),
                  ],
                  shading: { fill: "ADD8E6" },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),

            // Data Rows
            ...report.map((item, index) => new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: (index + 1).toString(),
                          size: 22,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 100 },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: item.question,
                          size: 22,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 100 },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: item.adjusted_total.toString(),
                          size: 22,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 100 },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),

              ],
            })),

            // Chart Image
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 4,
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: fs.readFileSync(chartImagePath),
                          transformation: {
                            width: 600,
                            height: 400,
                          },
                        }),
                      ],
                      spacing: { after: 200 },
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    }));

    // Create Document
    const doc = new Document({
      sections: sections,
    });

    const fileName = path.join(__dirname, `ReportQue-${facID}-${i}-${sec}.docx`);
    const buffer = await Packer.toBuffer(doc);
    const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
    fs.writeFileSync(fileName, buffer);
    res.download(fileName, `ReportQue-${facID}-${sec}-${timestamp}.docx`, () => {
      fs.unlinkSync(fileName);
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("Failed to generate report.");
  }
}