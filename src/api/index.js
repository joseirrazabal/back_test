import express from "express";
import config from "../config";
import getData from "./getDataGSheet";

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

  const usuarios = await getData(credentials, spreadsheetId, "usuarios");
  let token = false;
  let userName = null;

  await Promise.all(
    usuarios.map((user) => {
      if (user.username === username && user.password === password) {
        token = true;
        userName = user.name;  // Supongamos que 'name' es el campo que almacena el nombre completo
      }
    }),
  );

  if (token) {
    res.json({ token, name: userName });
  } else {
    res.json({ token: false });
  }
});

export default router;
