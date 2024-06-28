import express, { Express } from "express";
import cors from "cors";

import * as config from "../config-local";
import * as logger from "./services/logger";
import coreRouter from "./coreRouter";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use("/api", coreRouter);

// Starting the server
const server = app.listen(config.port, () => {
  logger.log("info", "Server started!");
});

function gracefulClose(signal: string) {
  logger.log("info", `Received ${signal} initiating server close`);
  server.close(() => logger.log("info", "Server closed"));
  process.exit();
}

// display all the avaiable routes in the app
// set env=dev in .env to enable it
if (config.env === "dev") {
  function print(path: any, layer: any) {
    if (layer.route) {
      layer.route.stack.forEach(
        print.bind(null, path.concat(split(layer.route.path)))
      );
    } else if (layer.name === "router" && layer.handle.stack) {
      layer.handle.stack.forEach(
        print.bind(null, path.concat(split(layer.regexp)))
      );
    } else if (layer.method) {
      console.log(
        "%s /%s",
        layer.method.toUpperCase(),
        path.concat(split(layer.regexp)).filter(Boolean).join("/")
      );
    }
  }

  function split(thing: any) {
    if (typeof thing === "string") {
      return thing.split("/");
    } else if (thing.fast_slash) {
      return "";
    } else {
      var match = thing
        .toString()
        .replace("\\/?", "")
        .replace("(?=\\/|$)", "$")
        .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
      return match
        ? match[1].replace(/\\(.)/g, "$1").split("/")
        : "<complex:" + thing.toString() + ">";
    }
  }
  console.log("All avaible endpoints: \n");
  app._router.stack.forEach(print.bind(null, []));
  console.log();
}

process.on("SIGINT", gracefulClose);
process.on("SIGTERM", gracefulClose);
