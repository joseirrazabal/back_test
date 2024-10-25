import { google } from 'googleapis';
import config from '../config'; // Importamos la configuración

const readGoogleSheet = async (spreadsheetId, range) => {
  // Configuración de GoogleAuth usando el contenido de las credenciales JSON desde una variable de entorno
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON), // Aquí utilizas directamente el contenido JSON de las credenciales
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: 'v4', auth: client });

  try {
    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (rows && rows.length) {
      const headers = rows.shift();
      return rows.map((row) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    } else {
      console.log('No data found.');
      return [];
    }
  } catch (error) {
    console.error("Error while reading Google Sheet:", error.message);
    return [];
  }
};

export default readGoogleSheet;
