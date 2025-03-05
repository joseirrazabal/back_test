import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const credentialsPath = path.join(__dirname, "google-credentials.json");

const credentialsData = {
  type: process.env.GOOGLE_TYPE,
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "",
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
};

// Crear el archivo JSON de credenciales solo si no existe
try {
  if (!fs.existsSync(credentialsPath)) {
    fs.writeFileSync(credentialsPath, JSON.stringify(credentialsData, null, 2));
    // console.log("Archivo de credenciales creado exitosamente"); // Eliminado para evitar log sensitivo
  } else {
    // console.log("Archivo de credenciales ya existe, no se vuelve a crear."); // Eliminado para evitar log sensitivo
  }
} catch (error) {
  console.error("Error al manejar las credenciales:", error.message); // Mensaje genérico
}

// Establecer la variable de entorno GOOGLE_APPLICATION_CREDENTIALS con la ruta al archivo JSON
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

const config = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || "supersecretkey1234", // Asegurar que está definido
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  GOOGLE_APPLICATION_CREDENTIALS_JSON:
    (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON &&
      JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)) ||
    "",
};

//console.log(config);

export default config;
