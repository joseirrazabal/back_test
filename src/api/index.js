import express from "express";
import getData from "../api/getDataGSheet.js";
import { google } from 'googleapis';
import config from "../config";

const router = express.Router();
const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4"; // Asegúrate de que este es el ID correcto

// Ruta para obtener productos (ejemplo)
router.get("/productos", async (_req, res) => {
  const productos = await getData(credentials, spreadsheetId, "productos");
  res.json(productos);
});

// Ruta para obtener usuarios (ejemplo)
router.get("/usuarios", async (_req, res) => {
  const users = await getData(credentials, spreadsheetId, "usuarios");
  res.json(users);
});

// Ruta para el login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const usuarios = await getData(credentials, spreadsheetId, "usuarios"); // Asegúrate de que este getData funcione correctamente.
  
  let authenticatedUser = null;

  // Buscar el usuario en la lista
  usuarios.forEach((user) => {
    if (user.username === username && user.password === password) {
      authenticatedUser = user;
    }
  });

  if (authenticatedUser) {
    // Autenticación exitosa
    res.json({ token: 'authtoken', username: authenticatedUser.username });
  } else {
    // Usuario o contraseña incorrectos
    res.json({ token: false });
  }
});

// Nueva ruta para el registro
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Insertar los datos del nuevo usuario en la hoja de Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'usuarios!A:B',  // Cambiamos el rango a A y B para que coincida con el otro archivo
      valueInputOption: 'RAW',
      requestBody: {
        values: [[username, password]], // Datos a agregar
      },
    });

    res.json({ success: true, message: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error("Error al registrar el usuario:", error.message);
    res.status(500).json({ success: false, message: 'Hubo un problema al registrar el usuario' });
  }
});

export default router;
