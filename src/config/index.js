import dotenv from "dotenv";

dotenv.config();

let googleCredentials;
try {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error("Falta la variable GOOGLE_CREDENTIALS en el entorno.");
  }
  googleCredentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (error) {
  console.error("Error al parsear GOOGLE_CREDENTIALS:", error.message);
  process.exit(1); // Corta la app si no están bien los datos
}

const config = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || "supersecretkey1234",
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
  GOOGLE_CREDENTIALS: googleCredentials
};

export default config;
