import express from "express";
import getData from "../api/getDataGSheet";
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import config from "../config";

const router = express.Router();
const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4"; // Asegúrate de que este es el ID correcto de tu hoja de Google Sheets
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey'; // Clave secreta para firmar el token JWT

// Ruta para el login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Datos recibidos:", { username, password });

  const usuarios = await getData(credentials, spreadsheetId, "usuarios");
  console.log("Usuarios en la hoja:", usuarios);

  let authenticatedUser = null;

  // Buscar usuario y autenticar
  usuarios.forEach((user) => {
    if (user.username === username && user.password === password) {
      authenticatedUser = user;
    }
  });

  if (authenticatedUser) {
    const token = jwt.sign(
      { username: authenticatedUser.username },
      jwtSecret,
      { expiresIn: '1h' }
    );
    res.json({ token, username: authenticatedUser.username });
  } else {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
});

// Ruta para el registro de usuario
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Carga de credenciales para Google Sheets
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Agregar usuario a la hoja de Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,  // Se recomienda usar la variable de entorno
      range: 'usuarios!A:B',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[username, password]],
      },
    });

    res.json({ success: true, message: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).json({ success: false, message: 'Hubo un problema al registrar el usuario', error: error.message });
  }
});

// Ruta para probar la conexión con Google Sheets
router.get("/test-google-sheets", async (_req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    res.json({ success: true, sheets: response.data.sheets });
  } catch (error) {
    console.error("Error conectando a Google Sheets:", error.message);
    res.status(500).json({ success: false, message: 'No se pudo conectar a Google Sheets', error: error.message });
  }
});

export default router;
