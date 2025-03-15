import { google } from "googleapis";

const readGoogleSheet = async (apiKey, spreadsheetId, range) => {
  try {
    // const auth = new google.auth.GoogleAuth({
    //   credentials,
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });

    // const client = await auth.getClient();

    const googleSheets = google.sheets({ version: "v4", auth: apiKey });

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
      // Log genérico para indicar que no se encontraron datos
      console.warn("No se encontraron datos en el rango especificado.");
      return [];
    }
  } catch (error) {
    console.error("Error al leer datos de Google Sheets:", error.message); // Mensaje genérico
    throw new Error("No se pudo leer el contenido de Google Sheets.");
  }
};

export default readGoogleSheet;
