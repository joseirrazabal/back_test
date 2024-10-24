import 'dotenv/config';

export default {
  PORT: process.env.PORT || 4000,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
};

