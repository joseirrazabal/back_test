import express from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import config from "../config";
import getData from "../api/getDataGSheet.js";
/* import { v4 as uuidv4 } from "uuid"; */
import dotenv from "dotenv";
dotenv.config(); // Carga las variables de entorno

if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

const router = express.Router();
const credentials = config.GOOGLE_API_KEY;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4"; // Asegúrate de que este es el ID correcto

/* console.log("JWT_SECRET en el backend:", config.JWT_SECRET); */

// Middleware para autenticar usuario
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token no proporcionado" });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    //console.log("Token decodificado:", decoded); // Log para verificar el token
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
};

// Middleware para autenticar al administrador
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token no proporcionado" });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }
    req.user = decoded; // Guarda la info del usuario en la request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token inválido" });
  }
};

// =========================================
// POST /api/clientes -> Agregar un cliente
// =========================================
router.post("/clientes", authenticateUser, async (req, res) => {
  const { nombre, direccion, banco, phone } = req.body;
  if (!nombre || !direccion || !banco || !phone) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  try {
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });
    const sheets = google.sheets({ version: "v4", auth: credentials });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
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

// Ruta para obtener extras
router.get("/extras", async (_req, res) => {
  try {
    const extras = await getData(credentials, spreadsheetId, "extras");
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

// Ruta para obtener productos filtrados por cuota
router.get("/productos", async (req, res) => {
  try {
    const productos = await getData(credentials, spreadsheetId, "productos");

    const { cuota } = req.query;

    const cuotasValidas = [
      'contado', 'tres_sin_interes', 'seis_sin_interes', 'nueve_sin_interes',
      'diez_sin_interes', 'doce_sin_interes', 'catorce_sin_interes',
      'dieciocho_sin_interes', 'veinte_sin_interes', 'veinticuatro_sin_interes'
    ];

    // Si no se especifica cuota, devuelve todos los productos
    if (!cuota) {
      return res.json(productos);
    }

    // Validar cuota
    if (!cuotasValidas.includes(cuota)) {
      return res.status(400).json({ message: "La cuota especificada no es válida." });
    }

    // Filtrar productos según cuota
    const productosFiltrados = productos.filter(producto => 
      producto[cuota] && producto[cuota].toUpperCase() !== 'NO'
    );

    res.json(productosFiltrados);

  } catch (error) {
    console.error("Error al obtener productos:", error.message);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// Ruta para obtener usuarios
router.get("/usuarios", async (_req, res) => {
  try {
    const users = await getData(credentials, spreadsheetId, "usuarios");
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error.message);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Ruta para obtener bancos
router.get("/bancos", async (_req, res) => {
  try {
    const bancos = await getData(credentials, spreadsheetId, "bancos");
    res.json(bancos);
  } catch (error) {
    console.error("Error al obtener datos de bancos:", error.message);
    res.status(500).json({ message: "Error al obtener datos de bancos" });
  }
});

// Ruta para el login
router.post("/login", async (req, res) => {
  const { username, password, deviceId } = req.body;

  //console.log("probando", username, password, deviceId)

  try {
    // Obtenemos usuarios de Google Sheets
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");

    let authenticatedUser = null;
    usuarios.forEach((user) => {
      if (user.username === username && user.password === password) {
        authenticatedUser = user;
      }
    });

    if (!authenticatedUser) {
      //console.log("incorrecto")

      return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }

    //console.log("🔐 JWT_SECRET en el backend:", config.JWT_SECRET);

    const token = jwt.sign(
      { username: authenticatedUser.username, deviceId },
      config.JWT_SECRET, // ⬅️ Asegúrate de que usa el mismo secreto
      { expiresIn: "100h" }
    );

    //console.log("✅ Token generado en login:", token);

    res.json({ success: true, token, username: authenticatedUser.username });
  } catch (error) {
    console.error("❌ Error en el login:", error.message);
    res.status(500).json({ success: false, message: "Error al intentar el login" });
  }
});

router.get("/clientes", authenticateUser, async (req, res) => {
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

// Ruta privada para listar usuarios con sesiones activas
router.get("/admin/multiple-sessions", authenticateAdmin, async (_req, res) => {
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
router.post("/admin/logout-user", authenticateAdmin, async (req, res) => {
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

// Ruta para validar la sesión
router.post("/validate-session", async (req, res) => {
  const { token, deviceId } = req.body;

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET); // ⬅️ VERIFICAMOS EL TOKEN

    const activeSessions = await getData(credentials, spreadsheetId, "active_sessions");
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
  const { username, password, rango } = req.body; // Incluimos rango en el cuerpo de la solicitud

  if (!username || !password || !rango) {
    // Validamos que todos los campos estén presentes
    return res.status(400).json({
      success: false,
      message: "Faltan datos requeridos (username, password o rango)",
    });
  }

  try {
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });

    const sheets = google.sheets({ version: "v4", auth: credentials });

    // Aseguramos que se registra el rango junto con el usuario y contraseña
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios!A:C", // Aseguramos que el rango incluye hasta la columna C
      valueInputOption: "RAW",
      requestBody: {
        values: [[username, password, rango]], // Incluimos rango aquí
      },
    });

    res.json({ success: true, message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error al registrar el usuario:", error.message);
    res.status(500).json({
      success: false,
      message: "Hubo un problema al registrar el usuario",
    });
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

export default router;
