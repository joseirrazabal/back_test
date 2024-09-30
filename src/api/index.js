import express from "express";
import config from "../config";
import getData from "./getDataGSheet";

const credentials = config.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const spreadsheetId = "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4";

const router = express.Router();

router.get("/productos", async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;  // Parámetros de paginación con valores por defecto

  const productos = await getData(credentials, spreadsheetId, "productos");

  // Aplicar paginación manualmente
  const paginatedProducts = productos.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json(paginatedProducts);  // Devolver solo los productos paginados
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

  const usuarios = await getData(credentials, spreadsheetId, "usuarios");
  let token = false;
  let authenticatedUsername = null;

  await Promise.all(
    usuarios.map((user) => {
      if (user.username === username && user.password === password) {
        token = true;
        authenticatedUsername = user.username;  // Devolver el username autenticado
      }
    }),
  );

  if (token) {
    res.json({ token, username: authenticatedUsername });
  } else {
    res.json({ token: false });
  }
});

export default router;
