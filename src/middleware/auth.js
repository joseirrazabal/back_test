import jwt from "jsonwebtoken";

import config from "../config"

const authenticateUser = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ success: false, message: "Token no proporcionado" });
	}

	try {
		const decoded = jwt.verify(token, config.JWT_SECRET);

		req.user = decoded;

		next();

	} catch (error) {
		console.error("Error al verificar token:", error.message);
		return res.status(401).json({ success: false, message: "Token inválido o expirado" });
	}
};

export { authenticateUser }
