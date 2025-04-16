import express from "express"

import config from "../../config";
import GoogleSheet from "../../googleSheet/GoogleSheet.js";

const router = express.Router()

const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID)

// Ruta para obtener usuarios
router.get("/all", async (_req, res) => {
  try {

    const users = await googleSheet.getData("usuarios");
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error.message);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Ruta para actualizar la contraseña del usuario
router.post("/update-password", async (req, res) => {
  const { username, password } = req.body;

  try {
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });
    const sheets = google.sheets({ version: "v4", auth: credentials });
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");

    const rowIndex = usuarios.findIndex((user) => user.username === username);
    if (rowIndex === -1) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `usuarios!B${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: { values: [[password]] },
    });

    res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error.message);
    res.status(500).json({ success: false, message: "Error al actualizar la contraseña" });
  }
});

// Ruta para eliminar usuario de Google Sheets
router.post("/delete-account", async (req, res) => {
  const { username } = req.body;

  try {
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });
    const sheets = google.sheets({ version: "v4", auth: credentials });
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");

    const rowIndex = usuarios.findIndex((user) => user.username === username);
    if (rowIndex === -1) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `usuarios!A${rowIndex + 2}:C${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: { values: [["", "", ""]] },
    });

    res.json({ success: true, message: "Cuenta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la cuenta:", error.message);
    res.status(500).json({ success: false, message: "Error al eliminar la cuenta" });
  }
});

export default router