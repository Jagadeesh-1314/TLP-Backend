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


export type detailsArr = detailsProps[];
  
export type subjectsDetailsArr = subjectsDetailsProps[];

export type questionsTableArr = questionsTableProps[];

export type UsersTableArr = UsersTableProps[];

export type subjectsTableArr = subjectTableProps[];

export type facultyTableProps = facultyTableProps[];
  