import express from "express"
import jwt from "jsonwebtoken";

import config from "../config/index.js";

import GoogleSheet from "../googleSheet/GoogleSheet.js";

const googleSheet = new GoogleSheet(config.GOOGLE_CREDENTIALS, config.GOOGLE_SHEET_ID)

const router = express.Router()

router.post("/login", async (req, res) => {
  const { username, password, deviceId } = req.body;

  try {
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

    // Consultar sesiones activas
    const activeSessions = await googleSheet.getData("active_sessions");

    const userSessions = activeSessions.filter(
      (session) => session[0] === username
    );

    const uniqueDevices = new Set(userSessions.map((session) => session[2]));

    // Si el dispositivo actual NO está entre los registrados y ya hay 3 → bloqueo
    if (!uniqueDevices.has(deviceId) && uniqueDevices.size >= 3) {
      return res.status(403).json({
        success: false,
        message: "Máximo de dispositivos alcanzado para este usuario.",
        showModal: true,
      });
    }

    // Guardar la sesión si aún no existe
    const existingSession = userSessions.find(
      (session) => session[2] === deviceId
    );

    if (!existingSession) {
      await googleSheet.addData("active_sessions", {
        username,
        fecha: new Date().toLocaleString("es-AR"),
        deviceId,
        status: "active",
      });
    }

    const token = jwt.sign(
      { username: authenticatedUser.username, deviceId },
      config.JWT_SECRET,
      { expiresIn: "50h" }
    );

    res.json({
      success: true,
      token,
      username: authenticatedUser.username,
    });

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

// ✅ Ruta para registrar usuario nuevo
router.post("/register", async (req, res) => {
  try {
    // 🟢 Extraemos todos los datos esperados
    const { username, password, rango, codigo_emprendedora } = req.body;

    // ❌ Validamos que no falte ninguno
    if (!username || !password || !rango || !codigo_emprendedora) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos (username, password, rango o código)",
      });
    }

    // 📝 Guardamos en la hoja de Google
    const resultado = await googleSheet.addData("usuarios", {
      username,
      password,
      rango,
      codigo_emprendedora,
    });

    // 🔁 Devolvemos la respuesta exitosa
    res.json({
      success: true,
      message: "Usuario registrado correctamente",
      data: resultado,
    });

  } catch (error) {
    console.error("❌ Error al registrar usuario:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
    });
  }
});

export default router