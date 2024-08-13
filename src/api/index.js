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
  const username = req.body.username;
  const password = req.body.password;

  const usuarios = await getData(credentials, spreadsheetId, "usuarios");
  let token = false;

  await Promise.all(
    usuarios.map((user) => {
      if (user.username === username && user.password === password) {
        token = true;
      }
    }),
  );

  res.json({ token });
});

export default router;
