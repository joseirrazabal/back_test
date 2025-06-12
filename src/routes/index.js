import express from "express";

import api from "../api";
import login from "../login/login.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.use("/auth", login);
router.use("/api", api); // sin authenticateUser

router.get("/healthcheck", (req, res) => {
  res.send("ok");
});

export default router;
