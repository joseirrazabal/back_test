import express from "express";

const router = express.Router();

router.get("/test", (_req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

export default router;
