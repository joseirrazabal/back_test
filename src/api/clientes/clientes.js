import express from "express"

import config from "../../config";
import GoogleSheet from "../../googleSheet/GoogleSheet.js";

const router = express.Router()

const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID)

router.post("/clientes", async (req, res) => {
  const { nombre, direccion, banco, phone } = req.body;
  if (!nombre || !direccion || !banco || !phone) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: config.GOOGLE_API_KEY });

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: "clientes!A:E", // Actualizamos el rango para incluir el teléfono
      valueInputOption: "RAW",
      requestBody: { values: [[req.user.username, nombre, direccion, banco, phone]] },
    });

    res.json({ success: true, message: "Cliente agregado correctamente" });
  } catch (error) {
    console.error("Error al agregar cliente:", error.message);
    res.status(500).json({ success: false, message: "Error al agregar cliente" });
  }
});

router.get("/clientes", async (req, res) => {
  try {
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });
    const sheets = google.sheets({ version: "v4", auth: credentials });

    // Obtenemos datos desde la hoja "clientes"
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "clientes!A:E",
    });
    const rows = result.data.values || [];

    // Normalizamos el username del usuario autenticado
    const usuario = req.user.username.trim().toLowerCase();

    // Filtramos las filas, descartando la fila de encabezados y normalizando cada username
    const filteredRows = rows.slice(1).filter((row) => {
      return row[0] && row[0].trim().toLowerCase() === usuario;
    });

    // Mapear cada fila filtrada a un objeto
    const clientes = filteredRows.map((row) => ({
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

router.delete("/clientes", async (req, res) => {
  const { nombre_del_cliente, direccion, banco, phone } = req.body;
  if (!nombre_del_cliente || !direccion || !banco || !phone) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  try {
    // Autenticamos y preparamos la instancia de Google Sheets
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });
    const sheets = google.sheets({ version: "v4", auth: credentials });

    // Obtenemos todos los datos de la hoja "clientes"
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "clientes!A:E",
    });
    const rows = result.data.values || [];

    // Buscar la fila (descontando la cabecera) que coincida con los datos y que pertenezca al usuario autenticado.
    // El formato de cada fila es: [username, nombre_del_cliente, direccion, banco, phone]
    let rowIndexToDelete = -1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (
        row[0] === req.user.username &&
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

    // Necesitamos obtener el sheetId de la hoja "clientes"
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets.find(
      (sheet) => sheet.properties.title === "clientes"
    );
    if (!sheet) {
      return res.status(500).json({ success: false, message: "No se encontró la hoja 'clientes'" });
    }
    const sheetId = sheet.properties.sheetId;

    // Eliminamos la fila encontrada.
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
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

export default router