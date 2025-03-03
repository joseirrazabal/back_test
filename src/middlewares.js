import jwt from "jsonwebtoken";

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ⬅️ VERIFICAMOS TOKEN
    req.user = decoded; // ⬅️ GUARDAMOS EL USUARIO DECODIFICADO EN req.user
    next(); // ⬅️ CONTINÚA AL SIGUIENTE MIDDLEWARE O CONTROLADOR
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
};

const notFound = (req, res, next) => {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
};

const errorHandler = (err, _req, res, _next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
};

export { authenticateUser, notFound, errorHandler };

