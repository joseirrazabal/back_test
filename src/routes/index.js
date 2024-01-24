import express from "express";

const router = express.Router();

import api from "../api";

router.use("/api", api);

router.get("/test", (_req, res) => {
  res.send("ok 01");
});

export default router;
