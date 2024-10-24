import express from "express";
import getData from "../api/getDataGSheet";
import { google } from 'googleapis';
import config from "../config";

const router = express.Router();
const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4"; // Asegúrate de que este es el ID correcto de tu hoja de Google Sheets

// Ruta para el login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const usuarios = await getData(credentials, spreadsheetId, "usuarios");
  let token = false;
  let authenticatedUsername = null;

  usuarios.forEach((user) => {
    if (user.username === username && user.password === password) {
      token = true;
      authenticatedUsername = user.username;
    }
  });

  if (token) {
    res.json({ token, username: authenticatedUsername });
  } else {
    res.json({ token: false });
  }
});

// Ruta para el registro
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Carga de credenciales para Google Sheets
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Usa el archivo de credenciales
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Agregar usuario a la hoja de Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,  // Asegúrate de que este es el ID correcto
      range: 'usuarios!A:B',  // Especifica el rango en la hoja de Google Sheets, por ejemplo, columnas A y B
      valueInputOption: 'RAW',
      requestBody: {
        values: [[username, password]],  // Datos a agregar en la hoja
      },
    });

    res.json({ success: true, message: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error("Error al registrar el usuario:", error.message);
    res.status(500).json({ success: false, message: 'Hubo un problema al registrar el usuario' });
  }
});

export default router;
