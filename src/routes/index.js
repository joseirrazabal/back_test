import express from "express"

const router = express.Router();

import api from "../api";

router.use("/api", api);

router.get("/healthcheck", (req, res) => {
  res.send("ok");
});

export default router
