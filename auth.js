const fs = require("fs");

// Lee el archivo JSON
const credentialsFile = fs.readFileSync("./credenciales.json", "utf8");

// Convierte a string con formato JSON válido para variable de entorno
const credentialsString = JSON.stringify(JSON.parse(credentialsFile));

console.log(credentialsString);
