import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";  // Importar la librería de compresión

import config from "./config";

import { notFound, errorHandler } from "./middlewares";
import routes from "./routes";

// Crear el servidor Express
const getServer = async () => {
  const app = express();
  const server = createServer(app);

  // Middlewares importantes
  app.use(cors());  // Habilitar CORS para peticiones de distintos dominios
  app.use(morgan("dev"));  // Logger para solicitudes HTTP
  app.use(helmet());  // Configuraciones de seguridad básicas
  app.use(express.json());  // Parser para datos en formato JSON
  app.use(express.urlencoded({ extended: true }));  // Parser para datos en formato URL-encoded
  app.use(compression());  // Habilitar compresión para mejorar el rendimiento

  // Configurar las rutas
  app.use(routes);

  // Manejo de rutas no encontradas
  app.use(notFound);

  // Manejo de errores
  app.use(errorHandler);

  return server;
};

// Configuración del puerto
let server;
const port = config.PORT || 4000;  // Puerto por defecto

// Manejo de errores del servidor
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

// Escuchar cuando el servidor está listo
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Listening on " + bind);
}

// Inicializar el servidor
getServer()
  .then((svr) => {
    server = svr;
    server.listen(port);  // Escuchar en el puerto especificado
    server.on("error", onError);  // Capturar errores
    server.on("listening", onListening);  // Log cuando el servidor está listo
  })
  .catch((error) => {
    console.error("Error while initializing server:", error);
  });
