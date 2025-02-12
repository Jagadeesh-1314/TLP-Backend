import * as fs from 'fs';
import { serverLogFilePath, infoLogFilePath, logInConsole } from '../../config-local';
import dayjs from "dayjs";


type TLogOptions = "info" | "warn" | "error" | "fatal"

export function log(ltype:TLogOptions='info', ...lmessage: any[]) {
    let dt = dayjs().format("D-MMM-YYYY hh:mm:ss A");
    let msg = `[${dt}] [${ltype.padEnd(5)}] ${lmessage.join(' ')}`
    if(logInConsole) console.log(msg);
    let logFilePath = ltype === 'info' ? infoLogFilePath : serverLogFilePath
    if(logFilePath)
        fs.appendFile(logFilePath, msg + "\n", (err) => {
            if (err) {
            console.error(`[${dt}] [${ltype}] `,'Error writing to log file:', err);
            }
        });
}

export function error(arg0: string, err: unknown) {
  throw new Error("Function not implemented.");
}
export function info(arg0: string) {
  throw new Error("Function not implemented.");
}

