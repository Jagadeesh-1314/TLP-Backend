import { Request, Response } from "express";
import path from "path";
import dbQuery, { dbQueryWithFields } from "../services/db";
import * as logger from "../services/logger";
import * as xlsx from "xlsx";
import * as fs from "fs";
import { isAnyUndefined, responses } from "../services/common";
import { FieldInfo } from "mysql";
import dayjs from "dayjs";
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, VerticalAlign, HeadingLevel, PageBreak, TextRun, BorderStyle } from "docx";

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
  if (tableName === "report") {
    out = await convertToDOCX(result, fields, tableName);
  } else {
    out = await convertToXLSX(result, fields, tableName);
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
    query: `SELECT *  From theoryscore`,
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
  const { sem, sec } = req.query;

  if (!sem || !sec) {
    return res.status(400).send('Semester and Section are required.');
  }

  try {
    const result: any = await dbQuery(
      `SELECT rollno, name, sec, sem FROM studentinfo WHERE sem = ${sem} AND sec = '${sec}' and token = 'undone'`,
    );
    let i: number = Number(sem) / 2;
    let j: number = (Number(sem) % 2 != 0) ? 1 : 2;
    const students: Student[] = result;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `Semester: ${i}-${j}`,
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
    const filename = `UnfilledList_${i}-${j}_${sec}_${timestamp}.docx`;
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
  facName: string;
  subcode: string;
  subname: string;
  sec: string;
  sem: number;
  percentile: number;
}

export async function downloadReport1(req: Request, res: Response) {
  const { sem, sec, batch, count } = req.query;

  if (!sem || !sec || !batch || !count ) {
    return res.status(400).send('Semester and Section are required.');
  }

  try {
    
    const result: any = await dbQuery(
      `SELECT facName,  subjects.subname, sec, sem, batch, percentile FROM report${count} JOIN subjects WHERE sem = ${sem} AND sec = '${sec}' AND batch = ${batch} and TRIM(subjects.subcode) = TRIM(report${count}.subcode);`,
    );
    let i: number = Math.floor(Number(sem) / 2);
    let j: string = (Number(sem) % 2 !== 0) ? "I" : "II";
    const report: Report[] = result;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Geethanjali College of Engineering and Technology",
                  font: {
                    name: "Old English Text MT",
                  },
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
                  text: "\n(Accredited by NAAC with ‘A+’ Grade and NBA, Approved by AICTE, Autonomous Institution)",
                  font: {
                    name: "Times New Roman",
                  },
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
                  text: "\nCheeryal (V), Keesara (M), Medchal Dist-501 301.",
                  font: {
                    name: "Times New Roman",
                  },
                  size: 22,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            // Feedback Report Heading
            new Paragraph({
              children: [
                new TextRun({
                  text: `Online Feedback report for 2023-24 ${j}-Semester Term-${count}`,
                  font: {
                    name: "Times New Roman",
                  },
                  size: 30,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),

            // Department Heading
            new Paragraph({
              children: [
                new TextRun({
                  text: `Department of Computer Science and Engineering`,
                  font: {
                    name: "Times New Roman",
                  },
                  size: 30,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: `Section: ${i}-${sec}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 500 },
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
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "S.No",
                          bold: true,
                          size: 25,
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      })],
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
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Faculty Name",
                          bold: true,
                          size: 25,
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      })],
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
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Subject Name",
                          bold: true,
                          size: 25,
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      })],
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
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Percentile",
                          bold: true,
                          size: 25,
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      })],
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
                ...report.map((item, index) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: (index + 1).toString()+'.',
                            size: 24,
                            bold: true,
                          })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 240 },
                        })],
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
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: item.facName,
                            size: 24,
                          })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 240 },
                        })],
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
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: item.subname,
                            size: 24,
                          })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 240 },
                        })],
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
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: item.percentile.toString(),
                            size: 24,
                          })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 240 },
                        })],
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
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
    const filename = `Report-${i}-${j}_${sec}_${timestamp}.docx`;
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


export async function downloadReport2(req: Request, res: Response) {
  const { sem, sec, batch, count } = req.query;

  if (!sem || !sec || !batch) {
    return res.status(400).send('Semester and Section are required.');
  }

  try {
   
    const result: any = await dbQuery(
      `SELECT facName,  subjects.subname, sec, sem, batch, percentile FROM report2 JOIN subjects WHERE sem = ${sem} AND sec = '${sec}' AND batch = ${batch} and TRIM(subjects.subcode) = TRIM(report1.subcode);`,
    );
    let i: number = Math.floor(Number(sem) / 2);
    let j: string = (Number(sem) % 2 !== 0) ? "I" : "II";
    const report: Report[] = result;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Geethanjali College of Engineering and Technology",
                  font: {
                    name: "Old English Text MT",
                  },
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
                  text: "\n(Accredited by NAAC with ‘A+’ Grade and NBA, Approved by AICTE, Autonomous Institution)",
                  font: {
                    name: "Times New Roman",
                  },
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
                  text: "\nCheeryal (V), Keesara (M), Medchal Dist-501 301.",
                  font: {
                    name: "Times New Roman",
                  },
                  size: 22,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            // Feedback Report Heading
            new Paragraph({
              children: [
                new TextRun({
                  text: `Online Feedback report for 2023-24 ${j}-Semester Term-${count}`,
                  font: {
                    name: "Times New Roman",
                  },
                  size: 30,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),

            // Department Heading
            new Paragraph({
              children: [
                new TextRun({
                  text: `Department of Computer Science and Engineering`,
                  font: {
                    name: "Times New Roman",
                  },
                  size: 30,
                  bold: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: `Section: ${i}-${sec}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 500 },
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
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "S.No",
                          bold: true,
                          size: 25,
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      })],
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
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Faculty Name",
                          bold: true,
                          size: 25,
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      })],
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
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Subject Name",
                          bold: true,
                          size: 25,
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      })],
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
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Percentile",
                          bold: true,
                          size: 25,
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                      })],
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
                ...report.map((item, index) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: (index + 1).toString()+'.',
                            size: 24,
                            bold: true,
                          })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 240 },
                        })],
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
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: item.facName,
                            size: 24,
                          })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 240 },
                        })],
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
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: item.subname,
                            size: 24,
                          })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 240 },
                        })],
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
                        children: [new Paragraph({
                          children: [new TextRun({
                            text: item.percentile.toString(),
                            size: 24,
                          })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 240 },
                        })],
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
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const timestamp = dayjs().format("DD-MMM-YY_hh-mm_A");
    const filename = `Report-${i}-${j}_${sec}_${timestamp}.docx`;
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
