const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// const pool = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'Lawbin2328',
//   database: 'fincalacolorada'
// });


// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'tu_password',
//   database: 'tu_base_de_datos',
//   waitForConnections: true,
//   connectionLimit: 10, // Permite hasta 10 conexiones simultáneas
//   queueLimit: 0
// });

module.exports = pool;
