import { google } from "googleapis";

const readGoogleSheet = async (credentials, spreadsheetId, range) => {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();

  const googleSheets = google.sheets({ version: "v4", auth: client });

  const response = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range,
  });

  const rows = response.data.values;
  if (rows.length) {
    const headers = rows.shift();

    return rows.map((row) => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } else {
    console.log("No data found.");
    return [];
  }
};

export default readGoogleSheet;
