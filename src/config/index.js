import dotenv from "dotenv";

dotenv.config();

const config = {
  PORT: process.env.PORT,
  GOOGLE_APPLICATION_CREDENTIALS_JSON:
    (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON &&
      JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)) ||
    "",
};

export default config
