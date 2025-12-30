const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'srv1578.hstgr.io',
  user: 'u506116281_Chucho',
  password: 'Finca_bd.2025',
  database: 'u506116281_Finca'
});

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'Lawbin2328',
//   database: 'fincalacolorada'
// });

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

module.exports = connection;
