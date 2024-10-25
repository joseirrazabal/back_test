import express from "express"

const router = express.Router();

import api from "../api";

router.use("/api", api);

router.get("/healthcheck", (req, res) => {
  res.send("ok");
});

<<<<<<< Updated upstream
export default router
=======
// Registro de usuario en routes/index.js
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
>>>>>>> Stashed changes
