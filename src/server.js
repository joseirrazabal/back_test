import "dotenv/config";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import config from "./config"; // Aquí importamos config
import { notFound, errorHandler } from "./middlewares";
import routes from "./routes";

const getServer = async () => {
  const app = express();
  const server = createServer(app);

  // Configuración de CORS
  const allowedOrigins = [
    "http://localhost:3000",
    "https://catalogosimple.ar"
  ];

  app.use(
    cors({
      origin: allowedOrigins,
      methods: "GET,POST,PUT,DELETE",
      credentials: true,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "'unsafe-inline'", "https://catalogosimple.ar"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https://catalogosimple.ar"],
        },
      },
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);

  console.log("Configuración completa:", config); // Para confirmar que las variables están presentes
  return server;
};

const port = config.PORT || 3001;

getServer()
  .then((server) => {
    server.listen(port, () => {
      console.log(`Servidor escuchando en el puerto ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error durante la inicialización del servidor:", error);
  });
