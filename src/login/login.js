import express from "express"
import jwt from "jsonwebtoken";

import config from "../config/index.js";

import GoogleSheet from "../googleSheet/GoogleSheet.js";

const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID)

const router = express.Router()

// Ruta para el login
router.post("/login", async (req, res) => {
  const { username, password, deviceId } = req.body;

  try {
    // Obtenemos usuarios de Google Sheets
    const usuarios = await googleSheet.getData("usuarios");

    let authenticatedUser = null;
    usuarios.forEach((user) => {
      if (user.username === username && user.password === password) {
        authenticatedUser = user;
      }
    });

    if (!authenticatedUser) {
      return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { username: authenticatedUser.username, deviceId },
      config.JWT_SECRET, // ⬅️ Asegúrate de que usa el mismo secreto
      { expiresIn: "50h" }
    );

    res.json({ success: true, token, username: authenticatedUser.username });
  } catch (error) {
    console.error("❌ Error en el login:", error.message);
    res.status(500).json({ success: false, message: "Error al intentar el login" });
  }
});

router.post("/validate-session", async (req, res) => {
  const { token, deviceId } = req.body;

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET); // ⬅️ VERIFICAMOS EL TOKEN

    const activeSessions = await googleSheet.getData("active_sessions");
    const sessionRow = activeSessions.find(
      (row) => row[0] === decoded.username && row[2] === deviceId
    );

    if (!sessionRow) {
      return res.json({ valid: true }); // Consideramos la sesión válida si no se encuentra explícitamente como "inactive"
    }

    if (sessionRow[3] === "inactive") {
      return res.json({ valid: false });
    }

    return res.json({ valid: true });
  } catch (error) {
    console.error("Error al validar el token:", error.message);
    return res.json({ valid: false });
  }
});

// Código actualizado para incluir el rango en el registro
router.post("/register", async (req, res) => {
  try {

    const { username, password, rango } = req.body; // Incluimos rango en el cuerpo de la solicitud

    if (!username || !password || rango) {
      // Validamos que todos los campos estén presentes
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos (username, password o rango)",
      });
    }

    const resultado = await googleSheet.addData("usuarios", { username, password, rango });

    res.json(resultado);

  } catch (error) {
    console.error("Error al registrar usuario:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario"
    });
  }
});

export default router