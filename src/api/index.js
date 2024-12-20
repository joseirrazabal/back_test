import express from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

import config from "../config";
import getData from "../api/getDataGSheet.js";

const router = express.Router();
const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4"; // Asegúrate de que este es el ID correcto

// Middleware para autenticar al administrador
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET || "supersecretkey");
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token inválido" });
  }
};

// Ruta para obtener extras
router.get("/extras", async (_req, res) => {
  try {
    const extras = await getData(credentials, spreadsheetId, "extras");
    res.json(extras);
  } catch (error) {
    console.error("Error al obtener extras:", error.message);
    res.status(500).json({ message: "Error al obtener extras" });
  }
});

// Ruta para agregar o actualizar extras
router.post("/extras", async (req, res) => {
  const { banner } = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "extras!A:B",
      valueInputOption: "RAW",
      requestBody: {
        values: [[banner]],
      },
    });

    res.json({ success: true, message: "Extras actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar extras:", error.message);
    res.status(500).json({
      success: false,
      message: "Hubo un problema al actualizar extras",
    });
  }
});

// Ruta para obtener productos
router.get("/productos", async (_req, res) => {
  try {
    const productos = await getData(credentials, spreadsheetId, "productos");
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error.message);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// Ruta para obtener usuarios
router.get("/usuarios", async (_req, res) => {
  try {
    const users = await getData(credentials, spreadsheetId, "usuarios");
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error.message);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Ruta para obtener bancos
router.get("/bancos", async (_req, res) => {
  try {
    const bancos = await getData(credentials, spreadsheetId, "bancos");
    res.json(bancos);
  } catch (error) {
    console.error("Error al obtener datos de bancos:", error.message);
    res.status(500).json({ message: "Error al obtener datos de bancos" });
  }
});

// Ruta para el login
router.post("/login", async (req, res) => {
  const { username, password, deviceId } = req.body;

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
      const token = jwt.sign(
        { username: authenticatedUser.username, deviceId },
        jwtSecret,
        { expiresIn: "1h" }
      );

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth });

      // Invalida todas las sesiones previas del usuario
      const rowIndex = usuarios.findIndex(
        (user) => user.username === authenticatedUser.username
      );

      if (rowIndex !== -1) {
        // Limpiar los `deviceId` existentes y establecer el nuevo
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `usuarios!C${rowIndex + 2}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[deviceId]],
          },
        });
      }

      res.json({ token: token, username: authenticatedUser.username });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    console.error("Error en el login:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Error al intentar el login" });
  }
});

// Ruta privada para listar usuarios con sesiones activas
router.get("/admin/multiple-sessions", authenticateAdmin, async (_req, res) => {
  try {
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");

    // Filtrar usuarios con sesiones activas
    const usuariosConSesion = usuarios.filter((user) => user.deviceId);

    res.json({
      success: true,
      usuarios: usuariosConSesion.map((user, index) => ({
        id: index + 1,
        username: user.username,
        deviceId: user.deviceId,
      })),
    });
  } catch (error) {
    console.error("Error al obtener usuarios con sesiones activas:", error.message);
    res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
});

// Ruta privada para cerrar sesión de un usuario específico
router.post("/admin/logout-user", authenticateAdmin, async (req, res) => {
  const { username } = req.body;

  try {
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");
    const rowIndex = usuarios.findIndex((user) => user.username === username);

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `usuarios!C${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[""]],
      },
    });

    res.json({ success: true, message: `Sesión cerrada para el usuario: ${username}` });
  } catch (error) {
    console.error("Error al cerrar sesión del usuario:", error.message);
    res.status(500).json({ success: false, message: "Error al cerrar sesión" });
  }
});

// Ruta para el registro
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios!A:B",
      valueInputOption: "RAW",
      requestBody: {
        values: [[username, password]],
      },
    });

    res.json({ success: true, message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error al registrar el usuario:", error.message);
    res.status(500).json({
      success: false,
      message: "Hubo un problema al registrar el usuario",
    });
  }
});

export default router;
