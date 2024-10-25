import 'dotenv/config'; // Esto carga las variables de entorno desde el archivo .env
import express from 'express';
import { createServer } from "http";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import config from "./config";
import { notFound, errorHandler } from "./middlewares";
import routes from "./routes"; // Importamos las rutas desde routes/index.js

const getServer = async () => {
  const app = express();
  const server = createServer(app);

  app.use(cors());
  app.use(morgan("dev"));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"], // Solo permitir scripts desde el propio dominio
          "script-src": ["'self'", "'unsafe-inline'"], // Permitir scripts inline si es necesario
          "style-src": ["'self'", "'unsafe-inline'"],  // Permitir estilos inline
          "img-src": ["'self'", "data:"], // Permitir imágenes desde el propio dominio y de tipo data
        },
      },
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Montar las rutas bajo el prefijo /api
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return server;
};

let server;
const port = config.PORT || 4000;

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
