const mysql = require('mysql2');
console.log('DB_HOST:', process.env.DB_HOST);
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
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
