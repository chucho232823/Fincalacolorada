const mysql = require('mysql2/promise');

async function conectar() {
  const conexion = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
  });
  return conexion;
}

// async function conectar() {
//   const conexion = await mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'Lawbin2328',
//   database: 'fincalacolorada'
//   });
//   return conexion;
// }




module.exports = conectar();
