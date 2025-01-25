import express from "express";

const router = express.Router();

router.get("/dynamic-urls", (req, res) => {
  try {
    const base = "https://catalogosimple.ar";
    const palabraClave = "catalogo";
    const now = new Date();
    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();
    const cuotas = [3, 6, 9, 10, 12, 18, 24];

    const urls = cuotas.map((cuota) => `${base}/${palabraClave}/${month}-${year}/${cuota}`);

    res.json({ success: true, urls });
  } catch (error) {
    console.error("Error generating dynamic URLs:", error.message);
    res.status(500).json({ success: false, message: "Error generating dynamic URLs." });
  }
});

export default router;
