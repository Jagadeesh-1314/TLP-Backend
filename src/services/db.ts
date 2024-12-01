import mysql from "mysql";
import { dbConfig } from "../../config-local";
import * as logger from "./logger";


const pool = mysql.createPool(dbConfig);

pool.on('connection', () => {
  logger.log("info", "Connected to the database!");
});

pool.on('error', (err) => {
  logger.log("fatal", "Database error", err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    logger.log("warn", "Database connection was lost. Attempting to reconnect...");
  } else {
    logger.log("fatal", "Database error, restart required.", err);
  }
});


function dbQuery(query: string, params?: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    pool.query(query, params, (err, result) => {
      if (err) {
        logger.log("error", "Error executing query", err);
        return reject(err);
      }
      resolve(result);
    });
  });
}

export function dbQueryWithFields(query: string, params?: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    pool.query(query, params, (err, result, fields) => {
      if (err) {
        logger.log("error", "Error executing query with fields", err);
        return reject(err);
      }
      resolve([result, fields]);
    });
  });
}

export default dbQuery;
