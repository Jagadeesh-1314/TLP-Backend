export interface SubNames {
    subName: string;
  }
  
  export interface UsersTableProps {
    username: string;
    displayName: string;
  }

  export interface questionsTableProps {
    theory: string;
    labs: string;
  }

  export interface subjectTableProps {
    subCode: string;
    subName: string;
    facID: number;
    qtype: string;
    facName: string;
  }

  export interface facultyTableProps {
    facID: number;
    facName: string;
  }
  

export type questionsTableArr = questionsTableProps[];

export type UsersTableArr = UsersTableProps[];

export type subjectsTableArr = subjectTableProps[];

export type facultyTableProps = facultyTableProps[];
  