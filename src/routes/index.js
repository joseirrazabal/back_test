import express from "express";
import api from "../api";
import { authenticateUser } from "../middlewares.js";

const router = express.Router();

router.use("/api", api);

// 🔒 Aplica `authenticateUser` a las rutas protegidas
router.use("/api/clientes", authenticateUser);
router.use("/api/ventas", authenticateUser);

router.get("/healthcheck", (req, res) => {
  res.send("ok");
});

export default router;
