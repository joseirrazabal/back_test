import express from "express";

import api from "../api";

const router = express.Router();

router.use("/api", api);

router.get("/healthcheck", (req, res) => {
  res.send("ok");
});

export default router;
