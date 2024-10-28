import { google } from 'googleapis';
import config from '../config'; // Importamos la configuración

const readGoogleSheet = async (spreadsheetId, range) => {
  // Configuración de GoogleAuth usando el archivo de credenciales
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Usa la ruta del archivo de credenciales
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();

  const googleSheets = google.sheets({ version: 'v4', auth: client });

  try {
    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId: "1LZ0U2xWVxmYWoQ3dm0rtXM5arj8F_vZdyGCgdLgu4h4", // Asegúrate de que este ID es correcto
      range: "usuarios!A:B",  // Asegúrate de que el nombre de la pestaña es "usuarios"
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
      console.log('No se encontraron datos en la hoja de cálculo.');
      return [];
    }
  } catch (error) {
    console.error("Error al leer Google Sheet:", error.message);
    return [];
  }
};

export default readGoogleSheet;
