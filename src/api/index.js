import express from "express"
import config from "../config"
import getData from "./getDataGSheet"

const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4";

const router = express.Router();

router.get("/productos", async (_req, res) => {
  const productos = await getData(credentials, spreadsheetId, "productos");
  res.json(productos);
});

router.get("/bancos", async (_req, res) => {
  const bancos = await getData(credentials, spreadsheetId, "bancos");
  res.json(bancos);
});

router.get("/usuarios", async (_req, res) => {
  const users = await getData(credentials, spreadsheetId, "usuarios");
  res.json(users);
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const usuarios = await getData(credentials, spreadsheetId, "usuarios");
  let token = false;
  let authenticatedUsername = null;

  await Promise.all(
    usuarios.map((user) => {
      if (user.username === username && user.password === password) {
        token = true;
        authenticatedUsername = user.username;  // Devolver el username autenticado
      }
    }),
  );

  if (token) {
    res.json({ token, username: authenticatedUsername });
  } else {
    res.json({ token: false });
  }
});

<<<<<<< Updated upstream
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


>>>>>>> Stashed changes
export default router;
