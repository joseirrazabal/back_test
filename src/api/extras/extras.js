import express from "express"

import config from "../../config";
import GoogleSheet from "../../googleSheet/GoogleSheet.js";

const router = express.Router()

const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID)

// Ruta para obtener extras
router.get("/extras", async (_req, res) => {
  try {
    const extras = await googleSheet.getData("extras");
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
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });

    const sheets = google.sheets({ version: "v4", auth: credentials });

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

export default router