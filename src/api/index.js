import express from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

import config from "../config";
import getData from "../api/getDataGSheet.js";

const router = express.Router();
const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4";

const activeSessions = new Map(); // Almacena usuarios y sus tokens activos

// Middleware para validar el token
const validateTokenMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const jwtSecret = config.JWT_SECRET || "supersecretkey";

  if (!token) {
    return res.status(401).json({ message: "No autorizado: falta token" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const activeToken = activeSessions.get(decoded.username);

    if (activeToken !== token) {
      return res.status(401).json({ message: "Sesión no válida o cerrada" });
    }

    req.user = decoded; // Adjunta el usuario decodificado al request
    next();
  } catch (error) {
    console.error("Error validando el token:", error.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Ruta para el login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");

    let authenticatedUser = null;
    usuarios.forEach((user) => {
      if (user.username === username && user.password === password) {
        authenticatedUser = user;
      }
    });

    if (authenticatedUser) {
      const jwtSecret = config.JWT_SECRET || "supersecretkey";

      // Invalida la sesión previa
      if (activeSessions.has(username)) {
        activeSessions.delete(username);
      }

      const token = jwt.sign({ username: authenticatedUser.username }, jwtSecret, { expiresIn: "1h" });
      activeSessions.set(username, token); // Registra el nuevo token

      res.json({ token: token, username: authenticatedUser.username });
    } else {
      res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    console.error("Error en el login:", error.message);
    res.status(500).json({ success: false, message: "Error al intentar el login" });
  }
});

// Rutas protegidas usando el middleware
router.get("/productos", validateTokenMiddleware, async (_req, res) => {
  try {
    const productos = await getData(credentials, spreadsheetId, "productos");
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error.message);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

router.get("/usuarios", validateTokenMiddleware, async (_req, res) => {
  try {
    const users = await getData(credentials, spreadsheetId, "usuarios");
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error.message);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Ruta para validar sesión activa
router.get("/validate-session", validateTokenMiddleware, (req, res) => {
  res.json({ valid: true, message: "Sesión activa" });
});

export default router;
