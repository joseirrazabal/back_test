import dotenv from "dotenv";

dotenv.config();

const config = {
  PORT: process.env.PORT || 5000, // Cambia a un puerto diferente, por ejemplo 5000
  GOOGLE_APPLICATION_CREDENTIALS_JSON: (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON &&
    JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)) ||
    "",
};

export default config
