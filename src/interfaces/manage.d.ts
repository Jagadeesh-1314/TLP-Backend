export interface SubNames {
  subName: string;
}

export interface UsersTableProps {
  username: string;
  displayName: string;
  branch: string;
}

export interface questionsTableProps {
  theory: string;
  labs: string;
}

export interface subjectTableProps {
  subCode: string;
  subName: string;
  facID: string;
  qtype: string;
  facName: string;
}

export interface facultyTableProps {
  facID: string;
  facName: string;
}

export interface detailsProps {
  sem: number;
  sec: string;
}

export interface subjectsDetailsProps {
  subCode: string;
  subName: string;
}


export interface ReportTableProps {
  branch: string;
  question: string;
  total: any;
  adjusted_total: any;
  facName: string;
  subcode: string;
  subname: string;
  sec: string;
  sem: number;
  percentile1: number;
  percentile2: number;
  percentile: number;
}


export interface StudentProps {
  rollno: string;
  name: string;
  sec: string;
  sem: number;
}


export type detailsArr = detailsProps[];

export type subjectsDetailsArr = subjectsDetailsProps[];

export type questionsTableArr = questionsTableProps[];

export type UsersTableArr = UsersTableProps[];

export type subjectsTableArr = subjectTableProps[];

export type facultyTableArr = facultyTableProps[];

export type ReportTableArr = ReportTableProps[];

export type StudentArr = StudentProps[];

