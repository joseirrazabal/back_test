import express from "express"

import config from "../../config";
import GoogleSheet from "../../googleSheet/GoogleSheet.js";

const router = express.Router()

const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID)

// Ruta privada para listar usuarios con sesiones activas
router.get("/admin/multiple-sessions", async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Acceso denegado" });
  }

  try {
    const activeSessions = await getData(credentials, spreadsheetId, "active_sessions");

    const usuariosConSesion = activeSessions.filter((row) => row[3] === "active");
    /*  console.log("Usuarios con sesiones activas:", usuariosConSesion); */

    res.json({
      success: true,
      usuarios: usuariosConSesion.map((session, index) => ({
        id: index + 1,
        username: session[0],
        deviceId: session[2],
      })),
    });
  } catch (error) {
    console.error("Error al obtener usuarios con sesiones activas:", error.message);
    res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
});

// Ruta privada para cerrar sesión de un usuario específico
router.post("/admin/logout-user", async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Acceso denegado" });
  }

  const { username, deviceId } = req.body;

  try {
    const activeSessions = await getData(credentials, spreadsheetId, "active_sessions");
    const rowIndex = activeSessions.findIndex(
      (row) => row[0] === username && row[2] === deviceId
    );

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, message: "Sesión no encontrada" });
    }

    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });
    const sheets = google.sheets({ version: "v4", auth: credentials });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `active_sessions!A${rowIndex + 2}:D${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[username, "", deviceId, "inactive"]],
      },
    });

    /* console.log(
      "Sesión cerrada en active_sessions para usuario:",
      username,
      "con deviceId:",
      deviceId
    ); */

    res.json({
      success: true,
      message: `Sesión cerrada para el usuario: ${username} con deviceId: ${deviceId}`,
    });
  } catch (error) {
    console.error("Error al cerrar sesión del usuario:", error.message);
    res.status(500).json({ success: false, message: "Error al cerrar sesión" });
  }
});

export default router;