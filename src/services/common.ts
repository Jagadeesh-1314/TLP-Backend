export function isAnyUndefined(...variables: any[]): boolean {
  return variables.some((variable) => variable === undefined);
}

export const responses = {
  NotAllParamsGiven: {
    message: "Not all params given",
  },
  ErrorWhileDBRequest: {
    error: {
      message: "There was a problem while performing your request.",
    },
  },
  ErrorWhileReadingOrProcessing: {
    done: false,
    error: "Invalid file format.",
  },
  UnsupportedFileExt: {
    done: false,
    error: "Unsupported file ext",
  },
  PageNotFound: {
    error: "Page not found",
  },
  BadRequest: {
    error: "Bad Request",
  },
  DoneMSG: {
    done: true,
  },
  InvalidParameterValue: {
    error: { message: "Invalid value" },
  },
};
