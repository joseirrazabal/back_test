import express from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

import config from "../config";
import getData from "../api/getDataGSheet.js";

const router = express.Router();
const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4"; // ID de la hoja de cálculo

// Generar URLs dinámicas basadas en el mes actual y cuotas
const getDynamicUrlsByCuotas = (base, palabraClave) => {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  const cuotas = [3, 6, 9, 10, 12, 18, 24];

  return cuotas.map((cuota) => `${base}/${palabraClave}/${month}-${year}/${cuota}`);
};

// Endpoint para obtener las URLs dinámicas
router.get("/dynamic-urls", (_req, res) => {
  try {
    const base = "https://catalogosimple.ar";
    const palabraClave = "catalogo";
    const urls = getDynamicUrlsByCuotas(base, palabraClave);

    console.log("URLs generadas:", urls); // Log para verificar en consola del servidor

    res.json({ success: true, urls });
  } catch (error) {
    console.error("Error generando URLs dinámicas:", error.message);
    res.status(500).json({ success: false, message: "Error generando URLs dinámicas." });
  }
});

// Middleware para autenticar al administrador
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token no proporcionado." });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET || "supersecretkey");
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Acceso denegado." });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token inválido." });
  }
};

// Ruta para obtener datos genéricos (productos, extras, usuarios, bancos, etc.)
const fetchData = (range) => async (_req, res) => {
  try {
    const data = await getData(credentials, spreadsheetId, range);
    res.json(data);
  } catch (error) {
    console.error(`Error al obtener datos de ${range}:`, error.message);
    res.status(500).json({ message: `Error al obtener datos de ${range}` });
  }
};

router.get("/extras", fetchData("extras"));
router.get("/productos", fetchData("productos"));
router.get("/usuarios", fetchData("usuarios"));
router.get("/bancos", fetchData("bancos"));

// Ruta para agregar o actualizar extras
router.post("/extras", async (req, res) => {
  const { banner } = req.body;

  if (!banner) {
    return res.status(400).json({ success: false, message: "El campo 'banner' es obligatorio." });
  }

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
      requestBody: { values: [[banner]] },
    });

    res.json({ success: true, message: "Extras actualizado con éxito." });
  } catch (error) {
    console.error("Error al actualizar extras:", error.message);
    res.status(500).json({ success: false, message: "Hubo un problema al actualizar extras." });
  }
});

// Ruta para login
router.post("/login", async (req, res) => {
  const { username, password, deviceId } = req.body;

  if (!username || !password || !deviceId) {
    return res.status(400).json({ success: false, message: "Faltan datos requeridos." });
  }

  try {
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");

    const authenticatedUser = usuarios.find(
      (user) => user.username === username && user.password === password
    );

    if (!authenticatedUser) {
      return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos." });
    }

    const token = jwt.sign(
      { username: authenticatedUser.username, deviceId },
      config.JWT_SECRET || "supersecretkey",
      { expiresIn: "1h" }
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "active_sessions",
      valueInputOption: "RAW",
      requestBody: {
        values: [[username, token, deviceId, "active"]],
      },
    });

    res.json({ success: true, token, username: authenticatedUser.username });
  } catch (error) {
    console.error("Error en el login:", error.message);
    res.status(500).json({ success: false, message: "Error al intentar el login." });
  }
});

// Ruta para registro de usuarios
router.post("/register", async (req, res) => {
  const { username, password, rango } = req.body;

  if (!username || !password || !rango) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos requeridos (username, password o rango).",
    });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios!A:C",
      valueInputOption: "RAW",
      requestBody: { values: [[username, password, rango]] },
    });

    res.json({ success: true, message: "Usuario registrado con éxito." });
  } catch (error) {
    console.error("Error al registrar el usuario:", error.message);
    res.status(500).json({ success: false, message: "Hubo un problema al registrar el usuario." });
  }
});

export default router;