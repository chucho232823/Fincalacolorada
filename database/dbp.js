const mysql = require('mysql2/promise');

async function conectar() {
  const conexion = await mysql.createConnection({
      host: 'http://srv1578.hstgr.io/',
      user: 'u506116281_Chucho',
      password: 'Finca_bd.2025',
      database: 'u506116281_Finca'
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
