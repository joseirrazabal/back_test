import express from "express";
import config from "../../config";
import GoogleSheet from "../../googleSheet/GoogleSheet";
import { google } from "googleapis";
import { authenticateUser } from "../../middleware/auth.js";

const router = express.Router();
router.use(authenticateUser);

const SHEET_NAME = "ventas";
const RANGE = `${SHEET_NAME}!A:G`; // username, descripcion, puntos, banco, valor_comisionable, cuotas, fecha

const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID);
const sheets = google.sheets({ version: "v4", auth: googleSheet.auth });

// Obtener productos y bancos reales
router.get("/data", async (req, res) => {
  try {
    const productosSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: "productos!A:Z", // Para acceder a columna Z (índice 25)
    });

    const bancosSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: "bancos!A:A",
    });

    const productos = productosSheet.data.values.slice(1).map((row) => ({
      descripcion: row[0],
      puntos: parseFloat(row[2]) || 0,
      valor_comisionable: parseFloat(row[25]) || 0, // Z
      vigencia: (row[4] || "").toLowerCase(),
    })).filter((p) => p.vigencia === "si");

    const bancos = bancosSheet.data.values.slice(1).flat();

    res.json({ productos, bancos });
  } catch (error) {
    console.error("❌ Error al obtener productos y bancos:", error);
    res.status(500).json({ success: false, message: "Error al obtener datos reales" });
  }
});

// Agregar venta
router.post("/", async (req, res) => {
  const { descripcion, puntos, banco, valor_comisionable, cuotas, fecha } = req.body;
  const username = req.user.username?.trim().toLowerCase();

  if (
    !username ||
    !descripcion ||
    puntos === undefined ||
    !banco ||
    !valor_comisionable ||
    !cuotas ||
    !fecha
  ) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
  }

  try {
    const row = [
      username, // Columna A
      descripcion, // B
      parseFloat(puntos), // C
      banco, // D
      parseFloat(valor_comisionable), // E
      cuotas, // F
      fecha, // G
      "sí", // H (activo por defecto)
    ];

    console.log("✅ Insertando venta:", row);

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: "ventas!A:H",
      valueInputOption: "RAW",
      requestBody: {
        values: [row],
      },
    });

    res.json({ success: true, message: "Venta guardada correctamente" });
  } catch (error) {
    console.error("❌ Error al guardar venta:", error?.response?.data || error.message);
    res.status(500).json({ success: false, message: "Error al guardar venta" });
  }
});

// Obtener ventas activas filtradas por usuario
router.get("/", async (req, res) => {
  const username = req.user.username.trim().toLowerCase();

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: "ventas!A:H",
    });

    const rows = result.data.values || [];

    const ventas = rows
      .slice(1)
      .filter((row) => 
        row[0]?.trim().toLowerCase() === username &&
        (row[7] || "").toLowerCase() === "sí" // Columna H: "activo"
      )
      .map((row) => ({
        descripcion: row[1],
        puntos: parseInt(row[2]) || 0,
        banco: row[3],
        valor_comisionable: row[4],
        cuotas: row[5],
        fecha: row[6] || "", // Columna G: fecha
      }));

    res.json({ ventas });
  } catch (error) {
    console.error("❌ Error al obtener ventas:", error);
    res.status(500).json({ success: false, message: "Error al obtener ventas" });
  }
});

// Cerrar mes: marcar como "no" todas las ventas activas del usuario
router.patch("/cerrar-mes", async (req, res) => {
  const username = req.user.username.trim().toLowerCase();

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: "ventas!A:H",
    });

    const rows = result.data.values || [];

    // Preparar updates
    const updates = [];

    rows.forEach((row, index) => {
      const usuario = row[0]?.trim().toLowerCase();
      const activo = row[7]?.toLowerCase();
      if (index !== 0 && usuario === username && activo === "sí") {
        const rowIndex = index + 1; // porque la hoja empieza en 1 y tiene encabezado
        updates.push({
          range: `ventas!H${rowIndex}`,
          values: [["no"]],
        });
      }
    });

    // Ejecutar actualizaciones en batch
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: config.GOOGLE_SHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data: updates,
        },
      });
    }

    res.json({ success: true, message: "Mes cerrado con éxito" });
  } catch (error) {
    console.error("❌ Error al cerrar mes:", error.message);
    res.status(500).json({ success: false, message: "Error al cerrar mes" });
  }
});

router.get("/ventas-anteriores", async (req, res) => {
  const username = req.user.username.trim().toLowerCase();

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: "ventas!A:H",
    });

    const rows = result.data.values || [];

    const ventasAnteriores = rows
      .slice(1)
      .filter((row) =>
        row[0]?.trim().toLowerCase() === username &&
        (row[7] || "").toLowerCase() === "no"
      )
      .map((row) => ({
        descripcion: row[1],
        puntos: parseInt(row[2]) || 0,
        banco: row[3],
        valor_comisionable: row[4],
        cuotas: row[5],
        fecha: row[6] || "",
      }));

    res.json({ ventas: ventasAnteriores });
  } catch (error) {
    console.error("❌ Error al obtener ventas anteriores:", error);
    res.status(500).json({ success: false, message: "Error al obtener ventas anteriores" });
  }
});

export default router;
