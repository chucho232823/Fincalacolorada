const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'srv1578.hstgr.io',
  user: 'u506116281_Chucho',
  password: 'Finca_bd.2025',
  database: 'u506116281_Finca'
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
