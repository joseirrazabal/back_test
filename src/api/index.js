import express from "express";
import config from "../config";
import getData from "./getDataGSheet";

const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4";

const router = express.Router();

router.get("/productos", async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;  // Parámetros de paginación con valores por defecto

    // Obtener productos desde Google Sheets
    const productos = await getData(credentials, spreadsheetId, "productos");
    
    // Log para verificar si se obtienen los productos correctamente
    console.log('Productos obtenidos:', productos);
    
    // Validar si hay productos disponibles
    if (!productos || productos.length === 0) {
      console.error('No se obtuvieron productos de Google Sheets');
      return res.status(500).json({ error: "No se obtuvieron productos" });
    }

    // Mostrar limit y offset para verificar que llegan correctamente
    console.log('Limit:', limit, 'Offset:', offset);

    // Aplicar paginación manualmente
    const paginatedProducts = productos.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Devolver los productos paginados
    res.json(paginatedProducts);
  } catch (error) {
    // Manejar errores en la obtención de productos
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

router.get("/bancos", async (_req, res) => {
  try {
    const bancos = await getData(credentials, spreadsheetId, "bancos");
    res.json(bancos);
  } catch (error) {
    console.error("Error al obtener bancos:", error);
    res.status(500).json({ error: "Error al obtener bancos" });
  }
});

router.get("/usuarios", async (_req, res) => {
  try {
    const users = await getData(credentials, spreadsheetId, "usuarios");
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const usuarios = await getData(credentials, spreadsheetId, "usuarios");

    let token = false;
    let authenticatedUsername = null;

    // Comprobar si el usuario y la contraseña coinciden
    await Promise.all(
      usuarios.map((user) => {
        if (user.username === username && user.password === password) {
          token = true;
          authenticatedUsername = user.username;  // Devolver el username autenticado
        }
      })
    );

    if (token) {
      res.json({ token, username: authenticatedUsername });
    } else {
      res.json({ token: false });
    }
  } catch (error) {
    console.error("Error en el proceso de login:", error);
    res.status(500).json({ error: "Error en el proceso de login" });
  }
});

export default router;
