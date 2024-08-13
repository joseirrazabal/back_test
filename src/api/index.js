import express from "express";

import config from "../config";
import getData from "./getDataGSheet";

// import productos from "./listadoProductos";
// import usuarios from "./listadoUsuarios";

const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4";

const router = express.Router();

router.get("/productos", async (_req, res) => {
  const productos = await getData(credentials, spreadsheetId, "productos");

  res.json(productos);
});

router.get("/bancos", async (_req, res) => {
  const bancos = await getData(credentials, spreadsheetId, "bancos");

  res.json(bancos);
});

router.get("/usuarios", async (_req, res) => {
  const users = await getData(credentials, spreadsheetId, "usuarios");

  res.json(users);
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");
    let usuarioEncontrado = usuarios.find(user => user.username === username && user.password === password);

    if (usuarioEncontrado) {
      // Si las credenciales son correctas, envía una respuesta afirmativa y el nombre de usuario
      res.json({ success: true, message: "Login exitoso.", username });
    } else {
      // Si las credenciales no coinciden, notifica al usuario
      res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos." });
    }
  } catch (error) {
    // Manejo de errores en caso de problemas con la base de datos o el servidor
    console.error('Error en la autenticación:', error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
});

export default router;
