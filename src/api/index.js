import express from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

import config from "../config";
import getData from "../api/getDataGSheet.js";

const router = express.Router();
const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4"; // Asegúrate de que este es el ID correcto

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
    const bancos = await getData(credentials, spreadsheetId, "bancos"); // Asegúrate de que el nombre de la pestaña sea correcto
    res.json(bancos);
  } catch (error) {
    console.error("Error al obtener datos de bancos:", error.message);
    res.status(500).json({ message: "Error al obtener datos de bancos" });
  }
});

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
      const token = jwt.sign(
        { username: authenticatedUser.username },
        jwtSecret,
        { expiresIn: "1h" }
      );
      res.json({ token: token, username: authenticatedUser.username });
    } else {
      res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    console.error("Error en el login:", error.message);
    res.status(500).json({ success: false, message: "Error al intentar el login" });
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
      range: "usuarios!A:B", // Cambiamos el rango a A y B para que coincida con el otro archivo
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
