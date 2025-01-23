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

      // Actualiza la pestaña active_sessions
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "active_sessions",
        valueInputOption: "RAW",
        requestBody: {
          values: [[username, token, deviceId, "active"]],
        },
      });
      console.log("Nueva sesión añadida en active_sessions para usuario:", username);

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
    const activeSessions = await getData(credentials, spreadsheetId, "active_sessions");

    const usuariosConSesion = activeSessions.filter((row) => row[3] === "active");
    console.log("Usuarios con sesiones activas:", usuariosConSesion);

    res.json({
      success: true,
      usuarios: usuariosConSesion.map((session, index) => ({
        id: index + 1,
        username: session[0],
        deviceId: session[2],
      })),
    });
  } catch (error) {
    console.error("Error al obtener usuarios con sesiones activas:", error.message);
    res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
});

// Ruta privada para cerrar sesión de un usuario específico
router.post("/admin/logout-user", authenticateAdmin, async (req, res) => {
  const { username, deviceId } = req.body;

  try {
    const activeSessions = await getData(credentials, spreadsheetId, "active_sessions");
    const rowIndex = activeSessions.findIndex(
      (row) => row[0] === username && row[2] === deviceId
    );

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, message: "Sesión no encontrada" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `active_sessions!A${rowIndex + 2}:D${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[username, "", deviceId, "inactive"]],
      },
    });

    console.log(
      "Sesión cerrada en active_sessions para usuario:",
      username,
      "con deviceId:",
      deviceId
    );

    res.json({
      success: true,
      message: `Sesión cerrada para el usuario: ${username} con deviceId: ${deviceId}`,
    });
  } catch (error) {
    console.error("Error al cerrar sesión del usuario:", error.message);
    res.status(500).json({ success: false, message: "Error al cerrar sesión" });
  }
});

// Ruta para validar la sesión
router.post("/validate-session", async (req, res) => {
  const { token, deviceId } = req.body;

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET || "supersecretkey");

    const activeSessions = await getData(credentials, spreadsheetId, "active_sessions");
    const sessionRow = activeSessions.find(
      (row) => row[0] === decoded.username && row[2] === deviceId
    );

    if (!sessionRow) {
      console.log("Sesión no encontrada para usuario:", decoded.username);
      return res.json({ valid: true }); // Considerar la sesión válida si no se encuentra explícitamente como inactive
    }

    if (sessionRow[3] === "inactive") {
      console.log("Sesión marcada como inactiva para usuario:", decoded.username);
      return res.json({ valid: false });
    }

    console.log("Validación exitosa para usuario:", decoded.username);
    return res.json({ valid: true });
  } catch (error) {
    console.error("Error al validar el token:", error.message);
    return res.json({ valid: false });
  }
});

// Código actualizado para incluir el rango en el registro
router.post("/register", async (req, res) => {
  const { username, password, rango } = req.body; // Incluimos rango en el cuerpo de la solicitud

  if (!username || !password || !rango) {
    // Validamos que todos los campos estén presentes
    return res.status(400).json({
      success: false,
      message: "Faltan datos requeridos (username, password o rango)",
    });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Aseguramos que se registra el rango junto con el usuario y contraseña
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios!A:C", // Aseguramos que el rango incluye hasta la columna C
      valueInputOption: "RAW",
      requestBody: {
        values: [[username, password, rango]], // Incluimos rango aquí
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
