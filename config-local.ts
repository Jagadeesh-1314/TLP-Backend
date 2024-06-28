import { ConnectionConfig } from "mysql";
import 'dotenv/config';
import * as path from 'path';
import md5 from "md5";

export const port: number = parseInt(process.env.PORT ?? "6969");
export const env: string = process.env.env || process.argv[2] || "pro"
 
export const serverLogFilePath = path.join(__dirname, "log", process.env.LOG_FILE || "server.log");
export const infoLogFilePath = path.join(__dirname, "log", process.env.LOG_FILE || "info.log");
export const logInConsole = process.env.CONSOLE_LOG || true
export const logInFile = process.env.FILE_LOG || true

export const secret = (env === "dev")?"$uper_$e(ret":md5("$uper_$e(ret"+Date.now())

export const dbConfig: ConnectionConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
}