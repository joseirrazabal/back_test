import express from "express";

import admin from "./admin/admin.js"
import user from "./user/user.js"
import clientes from "./clientes/clientes.js"
import ventas from "./ventas/ventas.js"
import productos from "./productos/index.js"
import bancos from "./bancos/index.js"

const router = express.Router();

router.use("/user", user)
router.use("/admin", admin)
router.use("/clientes", clientes)
router.use("/ventas", ventas)
router.use("/productos", productos)
router.use("/bancos", bancos)

export default router;
