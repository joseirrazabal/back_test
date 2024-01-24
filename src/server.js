import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

require("dotenv").config();

import { notFound, errorHandler } from "./middlewares";
import routes from "./routes";

const getServer = async () => {
  const app = express();
  const server = createServer(app);

  app.use(morgan("dev"));
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(routes);

  app.use(notFound);
  app.use(errorHandler);

  return server;
};

let server;
const port = process.env.PORT || 3000;

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Listening on " + bind);
}

getServer()
  .then((svr) => {
    server = svr;
    server.listen(port);
    server.on("error", onError);
    server.on("listening", onListening);
  })
  .catch((error) => {
    console.error("Error while initializing server:", error);
  });
