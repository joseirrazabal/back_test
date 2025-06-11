import express from "express"
import { v4 as uuidv4 } from "uuid";

import config from "../../config";
import GoogleSheet from "../../googleSheet/GoogleSheet.js";

const router = express.Router()

const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID)

// =========================================
// POST /api/ventas -> Agregar una venta
// =========================================
router.post("/ventas", async (req, res) => {
  const { nombreCliente, monto, fecha, producto } = req.body;

  if (!nombreCliente || !monto || !fecha || !producto) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos (nombreCliente, monto, fecha, producto)",
    });
  }

  try {
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });
    const sheets = google.sheets({ version: "v4", auth: credentials });

    const newId = uuidv4(); // Generamos un ID único

    // Guardamos en Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "ventas!A:F", 
      valueInputOption: "RAW",
      requestBody: {
        values: [[newId, req.user.username, nombreCliente, monto, fecha, producto]],
      },
    });

    return res.json({
      success: true,
      message: "Venta registrada correctamente",
      id: newId,
    });
  } catch (error) {
    console.error("Error al registrar venta:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar la venta",
    });
  }
});

// =========================================
// GET /api/ventas -> Listar las ventas del usuario logueado
// =========================================
router.get("/ventas", async (req, res) => {
  try {
    const allSales = await getData(credentials, spreadsheetId, "ventas");
    const userSales = allSales.filter((row) => row[1] === req.user.username);

    const result = userSales.map((row) => ({
      id: row[0],
      username: row[1],
      nombreCliente: row[2],
      monto: row[3],
      fecha: row[4],
      producto: row[5],
    }));

    return res.json(result);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las ventas",
    });
  }
});

// =========================================
// DELETE /api/ventas/:id -> Eliminar una venta
// =========================================
router.delete("/ventas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const allSales = await getData(credentials, spreadsheetId, "ventas");
    const rowIndex = allSales.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, message: "Venta no encontrada" });
    }

    if (allSales[rowIndex][1] !== req.user.username) {
      return res.status(403).json({ success: false, message: "No tienes permiso para eliminar esta venta" });
    }

    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });
    const sheets = google.sheets({ version: "v4", auth: credentials });

    const targetRow = rowIndex + 2;
    const emptyRow = ["", "", "", "", "", ""];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `ventas!A${targetRow}:F${targetRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [emptyRow],
      },
    });

    return res.json({ success: true, message: "Venta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar venta:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar la venta",
    });
  }
});

export default router