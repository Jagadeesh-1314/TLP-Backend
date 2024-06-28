# Exam Branch 2.0 API

## Introduction

The Exam Branch 2.0 API allows users to manage tasks ... TODO intro in progress

**Base URL**: `http://ip_addr:port/api/`

**Authentication**:
To authenticate with the Custom Token Authentication API, clients must obtain a custom authentication token by sending a valid username and password to the `/login` endpoint.

## Endpoints

## Login (`POST /api/login`)

- **Purpose**: Authenticate a user and obtain a custom authentication token.
- **Request Format**:

  - _Headers_: None
  - _Parameters_: None
  - _Body_:

    ```json
    {
    	"username":  string,
    	"password":  string
    }
    ```

    - Example

    ```json
    {
      "username": "admin",
      "password": "admin@123"
    }
    ```
- **Response Format**:

  - Status Code: 200 OK
  - **On Valid Creds**

    - _Headers_:

    ```
    	set-cookie: Token=user%404smep4b5aa2neo4n7c3cf8effansi428; Path=/; HttpOnly
    ```

    - _Body_:

    ```ts
    {
      "goahead": boolean,
      "username": string,
      "displayName": string
    }
    ```

    - Example

    ```json
    {
      "goahead": true,
      "username": "admin",
      "displayName": "AD"
    }
    ```
  - **On invalid Creds**

    - _Body_:

    ```ts
    {
     "goahead": boolean,
     "error": string
    }
    ```

    - Example

    ```json
    {
      "goahead": false,
      "error": "<Reason>"
    }
    ```

## CBT

_Base url_: `/cbt`

### Search (`GET /api/cbt/search`)

- **Purpose**: To retrieve all the sub a student can apply for CBT
- **Request Format**:

  - _Headers_: `Cookie: Token=<auth-token>`
  - _Parameters_:

    - `acYear` (required, (1 | 2 | 3 | 4)) : Current academic year
    - `sem` (required, (1 | 2)) : Current sem
    - `reg` (required, number): Current regulation (20XX)
    - `branch` (required, string): Student branch (CSE, ECE etc.)
    - `rollNo` (required, string): Student roll Number
- **Response Format**:

  - _Status Code_: 200 OK
  - _Body_:

    ```ts
    {
    	"subCodes": string[],
    	"subNames": string[],
    	"printTableExist": boolean
    }
    ```

    - Example

    ```json
    {
      "subCodes": [
        "18CE4112",
        "18CE4113",
        "18CE41L1",
        "18CE41L2",
        "18CH1201",
        "18CS1101"
      ],
      "subNames": ["SWM", "MINIPRO", "SADLAB", "EELAB", "EC", "PPS"],
      "printTableExist": false
    }
    ```
- **Authentication**: Required

### Print (`POST /api/cbt/print/:rollNo`)

- **Purpose**: To add all the selected subjects to printcbt table.
- **Request Format**:

  - _Headers_: `Cookie: Token=<auth-token>`
  - _Path Parameters_:

    - `rollNo` (required, string): Student roll number.
  - _Body_:

    ```ts
    {
            "subjects": {
                "subCodes": string[],
    	    "subNames": string[]
            },
    	"acYear": number,
    	"sem": number,
    	"branch": string[],
    	"username": string,
            "grandTotal": number
    }
    ```

    - Example

    ```json
    {
      "subjects": {
        "subCodes": ["18CE4112", "18CE4113", "18CE41L1", "18CE41L2"],
        "subNames": ["SWM", "MINIPRO", "SADLAB", "EELAB"],
      }
      "acYear": 3,
      "sem": 2,
      "branch": "CSE",
      "username": "admin",
      "grandTotal": 1200
    }
    ```
- **Response Format**:

  - Status Code: 200 OK
  - Body:

    ```ts
    {
    	"done": boolean,
    	"error"?: string
    }
    ```
- **Authentication**: Required

### Paid (`POST /api/cbt/paid/:rollNo`)

- **Purpose**: To add all the selected subjects to paidcbt table.
- **Request Format**:

  - _Headers_: `Cookie: Token=<auth-token>`
  - _Path Parameters_:

    - `rollNo` (required, string): Student roll number.
  - _Body_:

    ```ts
    {
            "subjects": {
                "subCodes": string[],
    	    "subNames": string[]
            },
    	"acYear": number,
    	"sem": number,
    	"branch": string[],
    	"username": string,
            "grandTotal": number
    }
    ```

    - Example

    ```json
    {
      "subjects": {
        "subCodes": ["18CE4112", "18CE4113", "18CE41L1", "18CE41L2"],
        "subNames": ["SWM", "MINIPRO", "SADLAB", "EELAB"],
      }
      "acYear": 3,
      "sem": 2,
      "branch": "CSE",
      "username": "admin",
      "grandTotal": 1200
    }
    ```
- **Response Format**:

  - _Status Code_: 200 OK
  - _Body_:

    ```ts
    {
    	"done": boolean,
    	"error"?: string
    }
    ```
- **Authentication**: Required

## Download

_Base url_: `/download`

### Table (`GET /api/download/table/:tableName`)

- **Purpose**: To download table tables in `.xslx` format.
- **Request Format**:

  - _Headers_: `Cookie: Token=<auth-token>`
  - _Path Parameters_:

    - `tableName` (required, ('paidsupply' | 'printsupply' | 'paidreevaluation' | 'printreval' | 'paidcbt' | 'printcbt' | 'studentinfo')): Student roll number.
  - _Query Parameters_:

    - `acYear` (required, (0 | 1 | 2 | 3 | 4)) : Current academic year (0 indicate all the acYears)
    - `sem` (required, (0 | 1 | 2)) : Current sem (0 indicate all the sems)
- **Response Format**:

  - _Status Code_: 200 OK
  - _Headers_:
    ```
    Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    ```
  - _Body_:
    ```
    <File Content>
    ```
- **Authentication**: Required

## Upload

_Base Url_: `/upload`

### Results (`POST /api/upload/results`)

- **Purpose**: To upload results into studentinfo.
- **Request Format**:
  - _Headers_: `Cookie: Token=<auth-token>`

## Revaluation

*Base URL*: `/reval`

### Search (`GET /api/reval/search`)

- **Purpose**: To retrieve all the subjects of a student for Revaluation
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Parameters*:

    - `exYear` (required, number): Year of Examination
    - `exMonth` (required, number): Month of Examination
    - `rollNo` (required, string): Student Roll Number
- **Response Format**:

  - *Status Code*: 200 OK
  - *Body*:

    ```json
    {
      "subjects": {
         "A": {
            "subCodes": string[],
            "subNames": string[]
          },
          "B": {
            "subCodes": string[],
            "subNames": string[]
          },
          "C": {
            "subCodes": string[],
            "subNames": string[]
          },
          "D": {
            "subCodes": string[],
            "subNames": string[]
          },
          "E": {
            "subCodes": string[],
            "subNames": string[]
          },
          "F": {
            "subCodes": string[],
            "subNames": string[]
          },
          "G": {
            "subCodes": string[],
            "subNames": string[]
          },
          "H": {
            "subCodes": string[],
            "subNames": string[]
          }
        },
        "printTableExist": boolean

    }
    ```

    - Example

    ```json

    {
      "subjects": {
        "A": {
          "subCodes": [],
          "subNames": []
        },
        "B": {
          "subCodes": [],
          "subNames": []
        },
        "C": {
          "subCodes": [],
          "subNames": []
        },
        "D": {
          "subCodes": [
            "18CS2203"
          ],
          "subNames": [
            "DBMS"
          ]
        },
        "E": {
          "subCodes": [
            "18CS3101"
          ],
          "subNames": [
            "OS"
          ]
        },
        "F": {
          "subCodes": [
            "18CS3201",
            "18CS3202",
            "18CS3203",
            "18CS3209",
            "18CS32L1",
            "18CS32L2",
            "18EE3232"
          ],
          "subNames": [
            "WT",
            "SE",
            "IS",
            "CC",
            "WTLAB",
            "SELAB",
            "ECM"
          ]
        },
        "G": {
          "subCodes": [],
          "subNames": []
        },
        "H": {
          "subCodes": [],
          "subNames": []
        }
      },
      "printTableExist": true
    }

    ```
- **Authentication**: Required

### Print (`POST /api/reval/print/:rollNo`)

- **Purpose**: To add all the selected subjects to printReval table.
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Path Parameters*:

    - `rollNo` (required, string): Student roll number.
  - *Body*:

    ```json
    {
       "subjects": {
          "A": {
          "subCodes": string[],
          "subNames": string[]
        },
        "B": {
          "subCodes": string[],
          "subNames": string[]
        },
        "C": {
          "subCodes": string[],
          "subNames": string[]
        },
        "D": {
          "subCodes": string[],
          "subNames": string[]
        },
        "E": {
          "subCodes": string[],
          "subNames": string[]
        },
        "F": {
          "subCodes": string[],
          "subNames": string[]
        },
        "G": {
          "subCodes": string[],
          "subNames": string[]
        },
        "H": {
          "subCodes": string[],
          "subNames": string[]
        }

        },
      "username": string,
      "regular": string,
      "grandTotal": number
    }
    ```

    - Example

    ```json
    {
       "subjects": {
          "A": {
          "subCodes": [],
          "subNames": []
        },
        "B": {
          "subCodes": [],
          "subNames": []
        },
        "C": {
          "subCodes": [],
          "subNames": []
        },
        "D": {
          "subCodes": [
            "18CS2203"
          ],
          "subNames": [
            "DBMS"
          ]
        },
        "E": {
          "subCodes": [
            "18CS3101"
          ],
          "subNames": [
            "OS"
          ]
        },
        "F": {
          "subCodes": [
            "18CS3201",
            "18CS3202",
            "18CS3203",
            "18CS3209",
            "18CS32L1",
            "18CS32L2",
            "18EE3232"
          ],
          "subNames": [
            "WT",
            "SE",
            "IS",
            "CC",
            "WTLAB",
            "SELAB",
            "ECM"
          ]
        },
        "G": {
          "subCodes": [],
          "subNames": []
        },
        "H": {
          "subCodes": [],
          "subNames": []
        }

        },
      "username": "admin",
      "regular": "F",
      "grandTotal": 1200
    }
    ```
- **Response Format**:

  - Status Code: 200 OK
  - Body:

    ```json
    {
    	"done": boolean,
    	"error"?: string 
    }
    ```
- **Authentication**: Required

## Supplementary

*Base URL*: `/reval`

### Search (`GET /api/supple/search`)

- **Purpose**: To retrieve all the subjects of a student for supplementary
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Parameters*:
    - `rollNo` (required, string): Student Roll Number
- **Response Format**:

  - *Status Code*: 200 OK
  - *Body*:

    ```json
    {
      "subjectDetails": {
         "A": {
            "subCodes": string[],
            "subNames": string[]
          },
          "B": {
            "subCodes": string[],
            "subNames": string[]
          },
          "C": {
            "subCodes": string[],
            "subNames": string[]
          },
          "D": {
            "subCodes": string[],
            "subNames": string[]
          },
          "E": {
            "subCodes": string[],
            "subNames": string[]
          },
          "F": {
            "subCodes": string[],
            "subNames": string[]
          },
          "G": {
            "subCodes": string[],
            "subNames": string[]
          },
          "H": {
            "subCodes": string[],
            "subNames": string[]
          }
        },
        "printTableExist": boolean

    }
    ```

    - Example

    ```json

  {
  "subjectDetails": {
    "A": {
      "subCodes": [],
      "subNames": []
    },
    "B": {
      "subCodes": [],
      "subNames": []
    },
    "C": {
      "subCodes": [],
      "subNames": []
    },
    "D": {
      "subCodes": [],
      "subNames": []
    },
    "E": {
      "subCodes": [],
      "subNames": []
    },
    "F": {
      "subCodes": [
        "16CE3202",
        "16CE3203",
        "16CE3204"
      ],
      "subNames": [
        "FE",
        "EE",
        "IE"
      ]
    },
    "G": {
      "subCodes": [],
      "subNames": []
    },
    "H": {
      "subCodes": [],
      "subNames": []
    }
  },
  "printTableExist": false
}
    ```
- **Authentication**: Required

### Print (`POST /api/supple/print/:rollNo`)

- **Purpose**: To add all the selected subjects to printSupple table.
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Path Parameters*:

    - `rollNo` (required, string): Student roll number.
  - *Body*:

    ```json
    {
       "subjects": {
          "A": {
          "subCodes": string[],
          "subNames": string[]
        },
        "B": {
          "subCodes": string[],
          "subNames": string[]
        },
        "C": {
          "subCodes": string[],
          "subNames": string[]
        },
        "D": {
          "subCodes": string[],
          "subNames": string[]
        },
        "E": {
          "subCodes": string[],
          "subNames": string[]
        },
        "F": {
          "subCodes": string[],
          "subNames": string[]
        },
        "G": {
          "subCodes": string[],
          "subNames": string[]
        },
        "H": {
          "subCodes": string[],
          "subNames": string[]
        }

        },
      "username": string,
      "grandTotal": number
    }
    ```

    - Example

    ```json
    {
    "subjects":{ 
        "A": {
            "subCodes": [],
            "subNames": []
        },
        "B": {
            "subCodes": [],
            "subNames": []
        },
        "C": {
            "subCodes": [],
            "subNames": []
        },
        "D": { "subCodes": ["16CE3201"],"subNames": ["DSS"]},
        "E": { "subCodes": ["16CE3103"],"subNames": ["EH"]},
        "F": { "subCodes": [],"subNames": []},
        "G": { "subCodes": [],"subNames": []},
        "H": { "subCodes": [],"subNames": []}
    },
  "username":"hari",
  "grandTotal":1000
}
    ```
- **Response Format**:

  - Status Code: 200 OK
  - Body:

    ```json
    {
    	"done": boolean,
    	"error"?: string 
    }
    ```
- **Authentication**: Required

### Paid (`POST /api/reval/paid/:rollNo`)

- **Purpose**: To add all the selected subjects to paidReEvaluation table.
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Path Parameters*:

    - `rollNo` (required, string): Student Roll number.
  - *Body*:

    ```json
    {
       "subjects": {
          "A": {
          "subCodes": string[],
          "subNames": string[]
        },
        "B": {
          "subCodes": string[],
          "subNames": string[]
        },
        "C": {
          "subCodes": string[],
          "subNames": string[]
        },
        "D": {
          "subCodes": string[],
          "subNames": string[]
        },
        "E": {
          "subCodes": string[],
          "subNames": string[]
        },
        "F": {
          "subCodes": string[],
          "subNames": string[]
        },
        "G": {
          "subCodes": string[],
          "subNames": string[]
        },
        "H": {
          "subCodes": string[],
          "subNames": string[]
        }

        },
      "username": string,
      "regular": string,
      "grandTotal": number
    }
    ```

    - Example

    ```json
    {
       "subjects": {
          "A": {
          "subCodes": [],
          "subNames": []
        },
        "B": {
          "subCodes": [],
          "subNames": []
        },
        "C": {
          "subCodes": [],
          "subNames": []
        },
        "D": {
          "subCodes": [
            "18CS2203"
          ],
          "subNames": [
            "DBMS"
          ]
        },
        "E": {
          "subCodes": [
            "18CS3101"
          ],
          "subNames": [
            "OS"
          ]
        },
        "F": {
          "subCodes": [
            "18CS3201",
            "18CS3202",
            "18CS3203",
            "18CS3209",
            "18CS32L1",
            "18CS32L2",
            "18EE3232"
          ],
          "subNames": [
            "WT",
            "SE",
            "IS",
            "CC",
            "WTLAB",
            "SELAB",
            "ECM"
          ]
        },
        "G": {
          "subCodes": [],
          "subNames": []
        },
        "H": {
          "subCodes": [],
          "subNames": []
        }

        },
      "username": "admin",
      "regular": "F",  
      "grandTotal": 1200
    }
    ```
- **Response Format**:

  - *Status Code*: 200 OK
  - *Body*:

    ```json
    {
    	"done": boolean,
    	"error"?: string 
    }
    ```
- **Authentication**: Required

### Truncate Paid Revaluation (`DELETE /api/reval/paid`)

- **Purpose**: To delete and truncate paidReEvaluation table.
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Query Parameters*:
    - `year`: 0 | 1 | 2 | 3 | 4
    - `sem`: 0 | 1 | 2
- **Response Format**:
- - *Status Code*: 200 OK
  - *Body*:

    ```json
    {
    	"deleted": boolean,
    	"error"?: string 
    }
    ```
- **Authentication**: Required

## Manage Database

*Base URL*: `/manage/database`

### Get Student Details (`GET /api/manage/database/search`)

- **Purpose**: To retrieve student's details from the database
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Parameters*:

    - `acYear`:(required, (0 | 1 | 2 | 3 | 4)) :  Academic year (0 indicate all the acYears)
    - `sem`:  (required, (0 | 1 | 2)) :  Semester (0 indicate all the sems)
    - `tableName`: (required, ('paidSupply' | 'printSupply' | 'paidReEvaluation' | 'printReval' | 'paidCBT' | 'printCBT' | 'studentInfo'))
    - `rollNo`: Student Roll Number
- Response Format:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Body*:
  - `tableName`: studentinfo

  ```json
  {
    "stdData": {
       "rollNo": string,
       "subCode": string,
       "subName": string,
       "grade": string,
       "acYear": number,
       "sem": number,
       "exYear": number,
       "exMonth": number
     }[]
  }
  ```

  - Example:

  ```json
  {
      "stdData": [
       {
          "rollNo": "19R11A05N8",
          "subCode": "18CS2202",
          "subName": "COALP",
          "grade": "F",
          "acYear": 2,
          "sem": 2,
          "exYear": 2022,
          "exMonth": 12
        },
        {
          "rollNo": "19R11A05N8",
          "subCode": "18CS2203",
          "subName": "DBMS",
          "grade": "C",
          "acYear": 2,
          "sem": 2,
          "exYear": 2022,
          "exMonth": 5
        }
        ]
  }
  ```

  - `tableName`: 'paidReEvaluation' | 'printReval'

  ```json
    {
        "stdData": {
           "rollNo": string,
           "subCode": string,
           "subName": string,
           "acYear": number,
           "sem": number,
           "regDate": string,
           "stat": string,
           "username": string,
           "grandTotal": number
        }[]
    }
  ```

  - Example

  ```json
  {
    "stdData": [
    {
        "rollNo": "19R11A05N8",
        "subCode": "18CS2203",
        "subName": "DBMS",
        "acYear": 2,
        "sem": 2,
        "regDate": "02-Mar-24",
        "stat": "",
        "username": "admin",
        "grandTotal": 1200
    },
    {
        "rollNo": "19R11A05N8",
        "subCode": "18CS3101",
        "subName": "OS",
        "acYear": 3,
        "sem": 1,
        "regDate": "02-Mar-24",
        "stat": "",
        "username": "admin",
        "grandTotal": 1200
    }
    ]
  }
  ```

  - `tableName`: 'paidSupply' | 'printSupply'

  ```json
    {
        "stdData": {
           "rollNo": string,
           "subCode": string,
           "subName": string,
           "acYear": number,
           "sem": number,
           "regDate": string,
           "username": string,
           "grandTotal": number
        }[]
    }
  ```

  - Example

  ```json
  {
    "stdData": [
    {
        "rollNo": "19R11A05N8",
        "subCode": "18CS2203",
        "subName": "DBMS",
        "acYear": 2,
        "sem": 2,
        "regDate": "02-Mar-24",
        "username": "admin",
        "grandTotal": 1200
    },
    {
        "rollNo": "19R11A05N8",
        "subCode": "18CS3101",
        "subName": "OS",
        "acYear": 3,
        "sem": 1,
        "regDate": "02-Mar-24",
        "username": "admin",
        "grandTotal": 1200
    }
    ]
  }
  ```

  - `tableName`: 'paidCBT | 'printCBT'

  ```json
  {
     "stdData": {
         "rollNo": string,
         "subCode": string,
         "subName": string,
         "acYear": number,
         "sem": number,
         "regDate": string,
         "branch": string,
         "user": string,
         "grandTotal": number
      } []
  }
  ```

  - Example

  ```json
   {
      "stdData": [
       {
          "rollNo": "15R11A0416",
          "subCode": "18CE4112",
          "subName": "SWM",
           "acYear": 3,
           "sem": 2,
          "regDate": "23-Feb-24",
          "branch": "CSE",
          "user": "admin",
          "grandTotal": 1200
        },
        {
          "rollNo": "15R11A0416",
          "subCode": "18CE4113",
          "subName": "MINIPRO",
          "acYear": 3,
          "sem": 2,
          "regDate": "23-Feb-24",
          "branch": "CSE",
          "user": "admin",
          "grandTotal": 1200
        }
        ]
    }
  ```
- Authentication: Required

### Update Student Details (`PATCH manage/database/:rollNo`)

- Purpose: To update student's details in database tables
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Path Parameters*:

    - `rollNo`: Student Roll Number
  - *Body:*

    - `tableName`: studentInfo

    ```json
    {
      "details": {
        "acYear": number,
        "sem": number,
        "subCode": string,
        "oldSubCode": string,
        "grade": string,
        "exMonth": number,
        "exYear": number
      },
      "tableName": string,
    }
    ```

    - Example:

    ```json
    {
      "details": {
        "acYear": 2,
        "sem": 0,
        "subCode": "18CSE1234",
        "oldSubCode": "18CSE1296",
        "grade": "A",
        "exMonth": 5,
        "exYear": 2024
      },
      "tableName": "studentInfo"
    }
    ```

    - `tableName`:  paidReval

    ```json
    {
      "details": {
        "acYear": number,
        "sem": number,
        "subCode": string,
        "oldSubCode": string,
        "stat": string
      },
      "username": string,
      "tableName": string
    }
    ```

    - Example

    ```json
    {
      "details": {
        "acYear": 2,
        "sem": 1,
        "subCode": "18CS44718",
        "oldSubCode": "192903KLs",
        "stat": "R"
      },
      "username": "admin",
      "tableName": "paidReval"
    }
    ```

    - `tableName`:  paidSupply

    ```json
    {
      "details": {
        "acYear": number,
        "sem": number,
        "tableName": string,
        "subCode": string,
        "newSubCode": string,
      },
      "username": string
    }
    ```

    - Example

    ```json
    {
      "details": {
        "acYear": 2,
        "sem": 1,
        "tableName": "paidSupply",
        "subCode": "18CSE12O1",
        "oldSubCode": "19CSE204S",
      },
      "username": string
    }
    ```

    - `tableName`: paidCBT

    ```json
    {
      "details": {
        "acYear": number,
        "sem": number,
        "tableName": string,
        "subCode": string,
        "oldSubCode": string,
        "branch": string,
      },
      "username": string
    }
    ```

    - Example:

    ```json
    {
      "details": {
        "acYear": 3,
        "sem": 2,
        "tableName": "paidCBT",
        "subCode": "19CSE5431",
        "oldSubCode": "18CSE54D1",
        "branch": "EEE",
      },
      "username": "admin"
    }
    ```
- Response Format:

  - *Status Code*: 200 OK
  - *Body*:

    ```json
    {
    	"updated": boolean,
    	"error"?: string 
    }
    ```
- Authentication: Required

### Adding Student Details (`POST manage/database/:rollNo`)

- Purpose: To insert student details in studentInfo table
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Path Parameters*:

    - `rollNo`: Student Roll Number
  - *Body:*

    ```json
    {
      "details": {
        "acYear": number,
        "sem": number,
        "tableName": string,
        "subCode": string,
        "grade": string,
        "exMonth": number,
        "exYear": number
      }
    }
    ```

    - Example:

    ```json
    {
      "details": {
        "acYear": 2,
        "sem": 2,
        "tableName": "studentinfo",
        "subCode": "18CSE1234",
        "grade": "A",
        "exMonth": 5,
        "exYear": 2024
      }
    }
    ```
  - Response Format:

    - *Status Code*: 200 OK
    - *Body*:
      ```json
      {
      	"done": boolean,
      	"error"?: string 
      }
      ```
  - Authentication: Required

### Deleting Student Details (`DELETE manage/database`)

- Purpose: To delete student details in database
- **Request Format**:

  - *Headers*: `Cookie: Token=<auth-token>`
  - *Query Parameters*:
    -Paid Entries and Student Database :

    - `rollNo`: Student Roll Number
    - `tableName`: 'paidSupply' | 'paidReEvaluation' | 'paidCBT'  | 'studentInfo'

    -Print Entries:

    - `rollNo`: Student Roll Number
    - `tableName`: 'paidSupply' | 'paidReEvaluation' | 'paidCBT'  | 'studentInfo'
    - `subCode`: string[]
  - Response Format:

    - *Status Code*: 200 OK
    - Body:
  - ```json
    {
    	"deleted": boolean,
    	"error"?: string 
    }
    ```
  - Authentication: Required
#   T L P - B a c k e n d  
 