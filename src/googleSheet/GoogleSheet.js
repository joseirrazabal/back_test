import { google } from "googleapis";

class GoogleSheet {

  constructor(credentials, spreadsheetId) {
    this.spreadsheetId = spreadsheetId;

    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    // Inicialización diferida
    this._initPromise = this._initialize();
  }

  // Método privado para inicializar
  async _initialize() {
    const authClient = await this.auth.getClient();
    this.googleSheets = google.sheets({ version: "v4", auth: authClient });
    return this;
  }

  getData = async (range) => {
    try {
      const response = await this.googleSheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
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

  addData = async (sheetName, newData) => {
    try {
      // Convertir el objeto a un array de valores
      // Asumiendo que newData es un objeto con propiedades que coinciden con las columnas
      // Primero obtenemos los encabezados para saber el orden correcto
      const headersResponse = await this.googleSheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:Z1`,  // Obtenemos la primera fila (encabezados)
      });

      const headers = headersResponse.data.values[0];

      console.log({ headers })

      // Creamos el array de valores según el orden de los encabezados
      const values = [headers.map(header => newData[header] || '')];

      console.log({ values })
      // Añadimos los datos a la hoja
      await this.googleSheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: "RAW",
        requestBody: {
          values,
        },
      });

      return { success: true, message: "Datos agregados con éxito" };
    } catch (error) {
      console.log(error)
      console.error(`Error al agregar datos a ${sheetName}:`, error.message);
      throw new Error(`No se pudo agregar el contenido a Google Sheets: ${error.message}`);
    }
  };
}

export default GoogleSheet;