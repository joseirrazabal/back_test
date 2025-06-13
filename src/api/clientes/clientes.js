import express from "express";
import config from "../../config";
import GoogleSheet from "../../googleSheet/GoogleSheet";
import { google } from "googleapis";

const router = express.Router();
const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID);
const SHEET_NAME = "clientes";
const sheets = google.sheets({ version: "v4", auth: googleSheet.auth });
const RANGE = `${SHEET_NAME}!A:E`;
const USUARIO_TEMPORAL = "demo_user"; // reemplazar por req.user.username cuando actives auth

// Agregar cliente
router.post("/", async (req, res) => {
  const { nombre, direccion, banco, phone } = req.body;

  if (!nombre || !direccion || !banco || !phone) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: RANGE,
      valueInputOption: "RAW",
      requestBody: {
        values: [[USUARIO_TEMPORAL, nombre, direccion, banco, phone]],
      },
    });

    res.json({ success: true, message: "Cliente agregado correctamente" });
  } catch (error) {
    console.error("Error al agregar cliente:", error.message);
    res.status(500).json({ success: false, message: "Error al agregar cliente" });
  }
});

// Obtener clientes del usuario
router.get("/", async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: RANGE,
    });

    const rows = result.data.values || [];

    const clientes = rows
      .slice(1)
      .filter((row) => row[0]?.trim().toLowerCase() === USUARIO_TEMPORAL)
      .map((row) => ({
        username: row[0],
        nombre: row[1],
        direccion: row[2],
        banco: row[3],
        phone: row[4],
      }));

    res.json({ clientes });
  } catch (error) {
    console.error("Error al obtener clientes:", error.message);
    res.status(500).json({ success: false, message: "Error al obtener clientes" });
  }
});

// Eliminar cliente
router.delete("/", async (req, res) => {
  const { nombre_del_cliente, direccion, banco, phone } = req.body;

  if (!nombre_del_cliente || !direccion || !banco || !phone) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: RANGE,
    });

    const rows = result.data.values || [];
    let rowIndexToDelete = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (
        row[0] === USUARIO_TEMPORAL &&
        row[1] === nombre_del_cliente &&
        row[2] === direccion &&
        row[3] === banco &&
        row[4] === phone
      ) {
        rowIndexToDelete = i;
        break;
      }
    }

    if (rowIndexToDelete === -1) {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
    });

    const sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === SHEET_NAME
    );

    if (!sheet) {
      return res.status(500).json({ success: false, message: "No se encontró la hoja 'clientes'" });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndexToDelete,
                endIndex: rowIndexToDelete + 1,
              },
            },
          },
        ],
      },
    });

    res.json({ success: true, message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar cliente:", error.message);
    res.status(500).json({ success: false, message: "Error al eliminar cliente" });
  }
});

// Editar cliente
router.put("/", async (req, res) => {
  const {
    nombre,
    direccion,
    banco,
    phone,
    nuevoNombre,
    nuevaDireccion,
    nuevoBanco,
    nuevoPhone,
  } = req.body;

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: RANGE,
    });

    const rows = result.data.values || [];
    let rowIndexToUpdate = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (
        row[0] === USUARIO_TEMPORAL &&
        row[1] === nombre &&
        row[2] === direccion &&
        row[3] === banco &&
        row[4] === phone
      ) {
        rowIndexToUpdate = i;
        break;
      }
    }

    if (rowIndexToUpdate === -1) {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: `clientes!B${rowIndexToUpdate + 1}:E${rowIndexToUpdate + 1}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[nuevoNombre, nuevaDireccion, nuevoBanco, nuevoPhone]],
      },
    });

    res.json({ success: true, message: "Cliente actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar cliente:", error.message);
    res.status(500).json({ success: false, message: "Error al actualizar cliente" });
  }
});

export default router;
