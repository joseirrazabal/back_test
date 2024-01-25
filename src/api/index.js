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

router.get("/login", async (req, res) => {
  const username = req.body.user;
  const password = req.body.pass;

  const usuarios = await getData(credentials, spreadsheetId, "usuarios");
  usuarios.map((user) => {
    if (user.username === username && user.password === password) {
      res.json({ token: true });
    }
  });

  res.json({ token: false });
});

export default router;
