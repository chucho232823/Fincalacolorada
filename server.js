const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
//const conexion = require('./database/db');
const bodyParser = require('body-parser');
//const conexionPromise = require('./database/dbp');
const pool = require('./database/dbpool');
//const PDFDocument = require('pdfkit');
const { error } = require('console');
const cron = require('node-cron'); //para cronometro
const fontkit = require('@pdf-lib/fontkit');
const formidable = require('formidable');
const ftp = require("basic-ftp");

const session = require("express-session");
const bcrypt = require("bcryptjs");

// Middleware para parsear los datos del formulario
app.use(bodyParser.json()); // Para procesar JSON si es necesario
const axios = require("axios");

const { PDFDocument, rgb, degrees } = require('pdf-lib');
(async () => {
  const pdfBytes = fs.readFileSync(
    path.join(__dirname, 'public' ,'bplantilla', 'plantilla.pdf')
  );

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
})();


app.set('trust proxy', 1); // Debe ir antes de la sesión

app.use(session({
    name: "admin-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true, // Obligatorio para sameSite: 'none'
        maxAge: 1000 * 60 * 60 * 4,
        sameSite: 'lax' // Permitir cookies entre dominios/pestañas si es necesario
    }
}));



app.use(express.static('public'));
// app.use('/public', requireAuth, express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
// app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));
//console.log("Directorio actual:", __dirname);
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/reservas', require('./routes/reservas'));
// app.use('/api/reservas', require('./routes/reservaService'));


app.get('/api/session/estado', (req, res) => {
    if (req.session && req.session.auth) {
        return res.json({ 
            autenticado: true,
            expira: req.session.cookie.maxAge 
        });
    } else {
        return res.json({ autenticado: false });
    }
});
//Autenticacion de usuario
// Middleware para verificar si el usuario está autenticado
function checkAuthentication(req, res, next) {
  if (req.session.auth) {
    return next();
  }
  res.redirect('/login');
}

app.get('/login', (req, res) => {
  if (req.session?.auth) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'sesion.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname,'public','sesion.html'));; // Asegúrate de tener un archivo login.html
});


app.post("/login", async (req, res) => {
    const { usuario, password } = req.body;

    if (usuario !== process.env.ADMIN_USER) {
      return res.redirect('/login');
    }

    const ok = await bcrypt.compare(
        password,
        process.env.ADMIN_PASSWORD_HASH
    );

    if (!ok) {
      return res.redirect('/login');
    }

    req.session.auth = true;
    // console.log("Sesión iniciada: ", req.session)
    return res.redirect('/');
});

//middleWare de proteccion
function requireAuth(req, res, next) {
  if (req.session?.auth) {
    return next();
  }
  return res.redirect('/login');
}

app.get('/', checkAuthentication, (req, res) => {
  // console.log("SESSION EN /:", req.session);
  res.sendFile(path.join(__dirname,'private','eventosAdmin.html'));
});

app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'eventosAdmin.html')) ;
});


app.get('/clientes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'clientes.html')) ;
});

app.get('/eventosPasados', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'eventosPasados.html'));
});

// function requireAuthApi(req, res, next) {
//   if (req.session?.auth) {
//     return next();
//   }
//   return res.status(401).json({ error: 'No autorizado' });
// }

// app.post('/api/crear-evento', requireAuthApi, (req, res) => {
//   res.json({ ok: true });
// });

//middleWare de proteccion

app.get("/admin", requireAuth, (req, res) => {
    res.send("Panel admin");
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("admin-session");
        res.json({ success: true });
    });
});

//funcion volver mapa de mesas
app.get('/volverEventos', (req, res) => {
  if (req.session?.auth) {
    // Está logueado
    return res.redirect('/');
  } else {
    // No está logueado
    return res.redirect('/clientes');
  }
});


//Para la subir los archivos al servidor

// Datos de conexión FTP
// const ftpHost = "156.67.75.166";
// const ftpUser = "u506116281.Chucho"; 
// const ftpPass = "Finca_ftp.2025"; 
// const ftpDir = "ftp://u506116281.Chucho@156.67.75.166/Eventos/";

const ftpHost = process.env.FTP_HOST;  // Dirección IP o dominio de tu servidor FTP
const ftpUser = process.env.FTP_USER;  // Tu usuario FTP
const ftpPass = process.env.FTP_PASS;  // Tu contraseña FTP
const ftpDir = process.env.FTP_DIR;    // Ruta en tu servidor

// Ejecutar cada minuto
/*cron.schedule('* * * * *', async () => {
  const query = `
    UPDATE silla
    SET enEspera = false,
        enEsperaDesde = NULL
    WHERE enEspera = true
      AND enEsperaDesde < NOW() - INTERVAL 5 MINUTE;
  `;
  
  try {
    const [result] = await pool.query(query); // Usando async/await
    if (result.affectedRows > 0) {
      // Si deseas ver cuántas filas fueron afectadas:
      // console.log(`Sillas liberadas automáticamente: ${result.affectedRows}`);
    }
  } catch (err) {
    console.error('Error liberando sillas:', err); // Manejo de error
  }
}); */
//agregar clausula de espera para boletos en espera
cron.schedule('* * * * *', async () => {
  const query = `
    UPDATE silla
    SET 
        estado = false,
        bloqueada = false,
        enEspera = false,
        enEsperaDesde = NULL
    WHERE enEspera = true
      AND enEsperaDesde < NOW() - INTERVAL 5 MINUTE;
  `;
  
  try {
    const [result] = await pool.query(query); // Usando async/await para ejecutar la consulta
    if (result.affectedRows > 0) {
      console.log(`Sillas liberadas automáticamente: ${result.affectedRows}`);
    }
  } catch (err) {
    console.error('Error liberando sillas:', err); // Manejo de error
  }
});


// poner evento como terminado si ya paso 12 horas despues de que paso el evento 
cron.schedule('0 * * * *', async () => {
  const query = `
    UPDATE evento
    SET estado = 'terminado'
    WHERE estado = 'venta'
      AND NOW() >= DATE_ADD(DATE(fecha), INTERVAL 36 HOUR);
  `;

  try {
    const [result] = await pool.query(query);
    if (result.affectedRows > 0) {
      console.log(`Eventos terminados: ${result.affectedRows}`);
    }
  } catch (err) {
    console.error('Error en cron de evento:', err);
  }
});



//Eventos 
app.get('/evento',(req,res)=>{
  const query = 'SELECT * FROM evento';
  pool.query(query,(error,resultado) => {
    if(error){
      console.error('Error en la consulta: ',error);
    }else{
      res.json(resultado);
    }
  })
})

/**
 * Carga de listado de eventos
 * 
 */

app.get('/listado-de-eventos', async (req, res) => {
  try {
    // Establecer el idioma en español (con el SET lc_time_names)
    await pool.query("SET lc_time_names = 'es_ES'");
    
    const query = `
      SELECT e.idEvento AS idEvento, e.nombre AS nombre, t.tipo AS tipo, e.estado AS estado,
             DATE_FORMAT(e.fecha, '%d de %M de %Y') AS fecha,
             TIME_FORMAT(e.hora, '%H:%i') AS hora, e.imagen AS imagen, e.subtitulo AS subtitulo 
      FROM evento e
      JOIN tipoEvento t ON e.idTipoEVento = t.idTipoEvento
      WHERE e.fecha >= CURDATE()
      ORDER BY e.fecha ASC;
    `;

    // Realizar la consulta
    const [resultado] = await pool.query(query); 

    // Enviar los resultados en formato JSON
    res.json(resultado);
  } catch (error) {
    // Manejo de errores
    console.error('Error en la consulta:', error);
    res.status(500).send('Error en la consulta');
  }
});

/**
 * Carga de listado de eventos
 * 
 */
app.get('/listado-de-eventos-pasados', async (req, res) => {
  const querySetLocale = "SET lc_time_names = 'es_ES'"; // Configurar el locale
  
  try {
    // Primero ejecutamos el SET lc_time_names
    await pool.query(querySetLocale);

    // Luego, la consulta para obtener los eventos pasados
    const query = `
      SELECT e.idEvento AS idEvento, e.nombre AS nombre, t.tipo AS tipo, e.estado AS estado,
             DATE_FORMAT(e.fecha, '%d de %M de %Y') AS fecha,
             TIME_FORMAT(e.hora, '%H:%i') AS hora, e.imagen AS imagen, e.subtitulo AS subtitulo 
      FROM evento e
      JOIN tipoEvento t ON e.idTipoEVento = t.idTipoEvento
      WHERE e.fecha < CURDATE() OR e.estado = "cancelado"
      ORDER BY e.fecha ASC;
    `;
    
    // Ejecutamos la consulta para obtener los resultados
    const [resultado] = await pool.query(query);

    // Enviamos los resultados como respuesta
    res.json(resultado);

  } catch (error) {
    // Si ocurre algún error, se captura y se responde con el error
    console.error('Error en la consulta:', error);
    res.status(500).send('Error interno del servidor');
  }
});


//Encontrando evento por nombre
/*app.get('/evento/nombre/:nombre',(req,res) => {
  const nombre = req.params.nombre;

  const query = 'SELECT * FROM evento WHERE nombre = ?';
  pool.query(query,[nombre],(error,resultado) => {
    if(error){
      console.error('Error en la consulta: ',error);
      return res.status(500).send('Error en el servidor');
    }

    if(resultado.length === 0){
      return res.status(404).send('Evento no encontrado');
    }

    res.json(resultado);
  })
}) */


/**
 * Cargando el estado de las sillas de acuerdo al evento
 */
app.get('/estado-sillas/:idEvento', async (req, res) => {
  const idEvento = req.params.idEvento;

  const query = `
    SELECT e.nombre, m.numero AS Mesa, s.letra AS Silla, s.estado, p.precio, p.precioD, s.bloqueada, s.enEspera, tm.tipo
    FROM evento e 
    JOIN precioEvento p ON e.idEvento = p.idEvento
    JOIN tipoMesa tm ON tm.idTipoMesa = p.idTipoMesa
    JOIN mesa m ON p.idPrecio = m.idPrecio
    JOIN silla s ON m.idMesa = s.idMesa
    WHERE e.idEvento = ?;
  `;

  try {
    // Ejecutar la consulta con Promesas
    const [resultado] = await pool.query(query, [idEvento]);

    if (resultado.length === 0) {
      return res.status(404).send('No se encontró el evento');
    }

    // Responder con los resultados
    res.json(resultado);
  } catch (error) {
    // Manejo de errores
    console.error('Error al conectar la base de datos:', error);
    return res.status(500).send('Error en el servidor');
  }
});


/**
 * Cargando estado de sillas individuales
 */
app.get('/estado-silla/:idEvento', async (req, res) => {
  const idEvento = req.params.idEvento;
  const { mesa, silla } = req.query;

  const query = `
    SELECT s.estado, s.bloqueada, s.enEspera
    FROM evento e 
    JOIN precioEvento p ON e.idEvento = p.idEvento
    JOIN mesa m ON p.idPrecio = m.idPrecio
    JOIN silla s ON m.idMesa = s.idMesa
    WHERE e.idEvento = ?
    AND m.numero = ?
    AND s.letra = ?;
  `;

  try {
    // Ejecutar la consulta con Promesas
    const [resultado] = await pool.query(query, [idEvento, mesa, silla]);

    if (resultado.length === 0) {
      return res.status(404).send('No se encontró el evento');
    }

    // Responder con los resultados
    res.json(resultado);
  } catch (error) {
    // Manejo de errores
    console.error('Error al conectar la base de datos:', error);
    return res.status(500).send('Error en el servidor');
  }
});
// Puerto en que correrá el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  //console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

/**
 * Creacion de carpeta para eventos
 */
const carpetaBase = path.join(__dirname, 'public' , 'boletosEventos');

// Asegúrate de que la carpeta base exista
if (!fs.existsSync(carpetaBase)) {
    fs.mkdirSync(carpetaBase, { recursive: true });
}

//Aqui se crea la carpeta del evento
async function crearCarpetaFtp(rutaRemota) {
    const client = new ftp.Client();

    try {
        console.log("Conectando al servidor FTP...");
        await client.access({
            host: ftpHost,
            user: ftpUser,
            password: ftpPass,
        });

        // console.log("Creando / asegurando carpeta FTP:", rutaRemota);

        // console.log("Carpeta FTP lista:", await client.pwd());
        
        await client.ensureDir(`${ftpDir}${rutaRemota}`);
        // console.log(`carpeta en ${ftpDir}${rutaRemota} creada`);
    } catch (error) {
        console.error("Error al crear carpeta FTP:", error);
        throw error;
    } finally {
        client.close();
    }
}


/**
 * Enviar creacion de evento
 */
app.post('/crearEvento', async (req, res) => {
  const { nombre, fecha, fechaP, tipo, precio, precioD, hora, subtitulo } = req.body;
  const imagen = "img/img.JPG"; // Imagen estática, puedes modificar si necesitas algo dinámico

  let query = '';
  let params = [];

  try {
    if (tipo === "Trova") {
      query = `CALL eventoTrova(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        nombre,
        subtitulo,
        fecha,
        fechaP,
        hora,
        imagen,
        parseFloat(precio.VIP),
        parseFloat(precio.Preferente),
        parseFloat(precio.General),
        parseFloat(precio.Laterales),
        parseFloat(precioD.VIP),
        parseFloat(precioD.Preferente),
        parseFloat(precioD.General),
        parseFloat(precioD.Laterales)
      ];
    } else if (tipo === "Baile") {
      query = `CALL eventoBaile(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        nombre,
        subtitulo,
        fecha,
        fechaP,
        hora,
        imagen,
        parseFloat(precio.VIP),
        parseFloat(precio.Preferente),
        parseFloat(precio.General),
        parseFloat(precioD.VIP),
        parseFloat(precioD.Preferente),
        parseFloat(precioD.General)
      ];
    } else {
      return res.status(400).send('❌ Tipo de evento no válido');
    }

    // Ejecutar la consulta para crear el evento
    const [result] = await pool.query(query, params);

    const idEvento = result[0]?.[0]?.id;
    if (!idEvento) {
      console.error('❌ No se obtuvo el ID del evento');
      return res.status(500).send('No se pudo obtener el ID del evento');
    }

    const nombreCarpeta = `evento_${idEvento}`;
    const rutaCarpeta = path.join(carpetaBase, nombreCarpeta);

    // Crear la carpeta para el evento
    await fs.promises.mkdir(rutaCarpeta, { recursive: true });
    await crearCarpetaFtp(`boletos/${nombreCarpeta}`);


    // Responder que el evento fue creado correctamente
    res.json({
        message: `Evento '${nombre}' agregado!`,
        idEvento: idEvento
    });
  } catch (err) {
    console.error('❌ Error al crear el evento:', err);
    res.status(500).send('Error al crear el evento');
  }
});
/**
 * cargar pagina de sembrado
 */
app.post('/sembrado/:nombre',(req,res) => {
  const raw = req.body.data;
  if (!raw) {
    return res.status(400).send("No se recibió 'data' en el cuerpo del formulario.");
  }

  const evento = JSON.parse(req.body.data);
  res.render(evento.tipo.toLowerCase(), { evento });
})

/**
 * Reservacion de sillas
 */
app.put('/reservar/:idEvento', async (req, res) => {
  const { idEvento } = req.params;
  const { silla, codigo } = req.body;
  const mesa = silla.mesa;
  const sil = silla.silla;

  // Validación de los parámetros silla y mesa
  if (!mesa || !sil || isNaN(mesa) || typeof sil !== 'string') {
    return res.status(400).json({ error: 'Los parámetros mesa y silla deben ser números válidos' });
  }

  // Consulta SQL para actualizar la reserva
  const query = `
    UPDATE silla s
    JOIN mesa m ON m.idMesa = s.idMesa
    JOIN precioEvento p ON p.idPrecio = m.idPrecio
    JOIN evento e ON e.idEvento = p.idEvento
    SET  s.codigo = ?
    WHERE m.numero = ?
    AND e.idEvento = ?
    AND s.letra = ?;
  `;

    "    AND s.le...' at line 5"

  try {
    // Ejecutar la consulta usando pool.query y await
    const [result] = await pool.query(query, [codigo, mesa, parseInt(idEvento), sil]);

    // Verificar si se realizó alguna actualización
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró el registro con los datos proporcionados' });
    }

    // Respuesta exitosa
    res.status(200).json({ message: 'Reserva realizada correctamente' });
  } catch (err) {
    // Manejo de errores
    console.error('Error al actualizar:', err);
    res.status(500).json({ error: 'Error al actualizar los datos' });
  }
});

/**
 * Bloqueo de sillas para apartar mesa
 */
app.put('/bloqueo/:idEvento', async (req, res) => {
  const { idEvento } = req.params;
  const { silla } = req.body;
  const mesa = silla.mesa;
  const sil = silla.silla;

  // Validación básica
  if (!mesa || !sil || isNaN(mesa) || typeof sil !== 'string') {
    return res.status(400).json({ error: 'Los parámetros mesa y silla deben ser números válidos' });
  }

  // Consulta para bloquear la silla
  const query = `
    UPDATE silla s
    JOIN mesa m ON m.idMesa = s.idMesa
    JOIN precioEvento p ON p.idPrecio = m.idPrecio
    JOIN evento e ON e.idEvento = p.idEvento
    SET s.bloqueada = true
    WHERE m.numero = ?
    AND e.idEvento = ?
    AND s.letra = ?;
  `; 

  try {
    // Ejecutar la consulta usando async/await
    const [result] = await pool.query(query, [mesa, parseInt(idEvento), sil]);

    // Verificar si la consulta afectó alguna fila
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró el registro con los datos proporcionados' });
    }

    // Respuesta exitosa
    res.status(200).json({ message: 'Bloqueo de silla realizado' });
  } catch (err) {
    // Manejo de errores
    console.error('Error al actualizar:', err);
    res.status(500).json({ error: 'Error al actualizar los datos' });
  }
});

/**
 * Enviando los datos para el formulario de los datos del usuario
 */
app.post('/datos', (req,res) => {
    const reserva = JSON.parse(req.body.jsonData);
    const nombre = reserva.nombre;
    const sembrado = reserva.sembrado;
    const listaMesaSilla = reserva.listaMesaSilla;
    const controlFila = reserva.controlFila;
    const tipo = reserva.tipo;
    const consecutivas = reserva.consecutivas;
    const agrupadasPorMesa = reserva.agrupadasPorMesa;
    const tipoPago = reserva.tipoPago;
    res.render( 'datos' , {nombre, sembrado, listaMesaSilla, controlFila, tipo, consecutivas, agrupadasPorMesa, tipoPago} );
})

/**
 * Obtencion del conteo de forma asyncrona
 */
async function obtenerConteo(idEvento) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS numero
     FROM reserva WHERE codigo LIKE ?;`,
    [`${idEvento}-%`]
  );
  console.log(`conteo: ${rows[0].numero}`)
  return rows[0].numero;
}
/**
 * consulta para la creacion del codigo
 */

app.get('/conteo/:idEvento', async (req, res) => {
  const { idEvento } = req.params;
  try {
    const conteo = await obtenerConteo(idEvento);
    res.json({ conteo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * Insercion del codigo y el nombre de quien reserva
 */
app.post('/codigo', async (req, res) => {
  const { codigo, nombre, apellidos, telefono, fechaP, mesasJuntadas, tipoPago} = req.body;
  const tPago = (tipoPago === "Transferencia") ? 'Mostrador(Transferencia)' : 
                (tipoPago  === "Efectivo") ? 'Mostrador(Efectivo)' : 
                (tipoPago  === "Baucher") ? 'Mostrador(Baucher)': 'Linea';

  // Validar que los parámetros requeridos estén presentes
  if (!codigo || !nombre || !apellidos || !telefono) {
    return res.status(400).json({ error: 'Parametros invalidos' });
  }

  let preventa;
  if (fechaP) {
    const hoy = new Date();
    const fecha = new Date(fechaP);

    // Determinar si la reserva es preventa (fecha futura)
    preventa = hoy <= fecha;
  } else {
    preventa = false;  // Si no se pasa la fecha, asignamos preventa como false
  }

  // Crear la cadena de mesas
  let cadena = "";
  mesasJuntadas.forEach(mesas => {
    if (mesas.juntar) {
      cadena += `${mesas.mesas} `;
    }
  });

  // Consulta para insertar la reserva
  const query = `
    INSERT INTO reserva (codigo, nombre, apellido, telefono, preventa, juntar, tipoPago)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;

  try {
    // Ejecutar la consulta para insertar los datos
    const [result] = await pool.query(query, [codigo, nombre, apellidos, telefono, preventa ? 1 : 0, cadena, tPago]);

    // Verificar si se insertaron filas
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se pudo realizar la reserva' });
    }

    // Respuesta exitosa
    res.status(200).json({ message: 'Reserva realizada correctamente' });
  } catch (err) {
    console.error('Error al realizar la reserva:', err);
    res.status(500).json({ error: 'Error al realizar la reserva' });
  }
});

app.get('/lista/:idEvento', requireAuth, async (req, res) => {
  const { idEvento } = req.params;
  const queryReservas = `
    SELECT DISTINCT r.nombre, r.apellido, r.telefono, r.codigo, r.juntar, r.tipoPago, r.estado
    FROM reserva r
    JOIN silla s ON s.codigo = r.codigo
    JOIN mesa m ON m.idMesa = s.idMesa
    JOIN precioEvento p ON p.idPrecio = m.idPrecio
    JOIN evento e ON e.idEvento = p.idEvento
    WHERE e.idEvento = ?
    AND r.estado = "pagada"
    ORDER BY r.nombre;
  `;

  const queryNombreEvento = `SELECT nombre FROM evento WHERE idEvento = ?;`;

  try {
    // Obtener las reservas
    const [reservas] = await pool.query(queryReservas, [idEvento]);

    // Obtener el nombre del evento
    const [eventoResultado] = await pool.query(queryNombreEvento, [idEvento]);

    if (eventoResultado.length === 0) {
      return res.status(404).send('Evento no encontrado');
    }

    const nombreEvento = eventoResultado[0].nombre;

    // Obtener el conteo de boletos para cada reserva
    const reservasConBoletos = await Promise.all(
      reservas.map(async (reserva) => {
        const [conteo] = await pool.query(
          `SELECT COUNT(*) AS boletos
           FROM reserva r
           JOIN silla s ON r.codigo = s.codigo
           JOIN mesa m ON m.idMesa = s.idMesa
           JOIN precioEvento p ON p.idPrecio = m.idPrecio
           JOIN evento e ON e.idEvento = p.idEvento
           WHERE e.idEvento = ? AND r.codigo = ? AND s.bloqueada = 0;`,
          [idEvento, reserva.codigo]
        );

        return {
          ...reserva,
          boletos: conteo[0].boletos
        };
      })
    );

    // Renderizar la vista con los datos
    res.render('lista', {
      reservas: reservasConBoletos,
      nombreEvento,
      idEvento
    });

  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).send('Error interno del servidor');
  }
});


/**
 * Obtencion de precios
 */

app.get('/precios/:idEvento', async (req, res) => {
  const { idEvento } = req.params;

  const query = `
    SELECT t.tipo, p.precio, p.precioD, e.fechaP
    FROM precioEvento p
    JOIN tipoMesa t ON t.idTipoMesa = p.idTipoMesa
    JOIN evento e ON p.idEvento = e.idEvento
    WHERE e.idEvento = ?;
  `;
  try {
    // Ejecutar la consulta con Promesas
    const [resultado] = await pool.query(query, [idEvento]);

    // Enviar la respuesta como JSON
    res.json(resultado); 
  } catch (err) {
    // Manejo de errores
    console.error('Error en la consulta:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/**
 * Obtener fecha Preventa
 */

app.get('/fechaP/:idEvento', async (req, res) => {
  const { idEvento } = req.params;

  const query = `
    SELECT fechaP
    FROM evento 
    WHERE idEvento = ?;
  `;

  try {
    // Usar await para ejecutar la consulta con mysql2/promise
    const [resultado] = await pool.query(query, [idEvento]);
    console.log(resultado);
    if (resultado.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json(resultado);
  } catch (err) {
    console.error('Error en la consulta:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});


/**
 * Edicion de un evento
 */

// para el modal
app.get('/api/editar/:idEvento', async (req, res) => {
  const { idEvento } = req.params;

  const query = `
    SELECT m.tipo, p.precio, p.precioD, e.fecha, e.fechaP, e.nombre, t.tipo AS tipoEvento,
    e.hora, e.subtitulo
    FROM evento e 
    JOIN tipoEvento t ON e.idTipoEvento = t.idTipoEvento
    JOIN precioEvento p ON e.idEvento = p.idEvento
    JOIN tipoMesa m ON m.idTipoMesa = p.idTipoMesa 
    WHERE e.idEvento = ?;
  `;

  try {
    // Usar await para ejecutar la consulta con mysql2/promise
    const [resultado] = await pool.query(query, [idEvento]);

    if (resultado.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const evento = {
      idEvento,
      nombreEvento: resultado[0].nombre,
      fechaEvento: resultado[0].fecha,
      fechaPreventa: resultado[0].fechaP,
      tipoEvento: resultado[0].tipoEvento,
      hora: resultado[0].hora,
      subtitulo: resultado[0].subtitulo,
      precios: resultado.map(row => ({
        tipo: row.tipo,
        precio: row.precio,
        precioD: row.precioD
      }))
    };

    res.json(evento);
  } catch (err) {
    console.error('Error al obtener el evento:', err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * Edicion del evento
 */
app.put(`/cambio/:idEvento`, async (req, res) => {
  const { idEvento } = req.params;
  const { tipo, nombre, subtitulo, fecha, fechaP, hora, precio, precioD } = req.body;

  const queryEvento = `
    UPDATE evento 
    SET nombre = ?, subtitulo = ?, fecha = ?, 
        fechaP = ?, hora = ?
    WHERE idEvento = ?;
  `;

  try {
    // Actualización del evento
    const [resultEvento] = await pool.query(queryEvento, [nombre, subtitulo, fecha, fechaP, hora, parseInt(idEvento)]);

    if (resultEvento.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró el registro con los datos proporcionados' });
    }

    // Si la actualización del evento es exitosa, proceder con la actualización de precios.
    if (tipo === "Trova") {
      const VIP = parseFloat(precio.VIP);
      const Preferente = parseFloat(precio.Preferente);
      const General = parseFloat(precio.General);
      const Laterales = parseFloat(precio.Laterales);
      const VIPD = parseFloat(precioD.VIP);
      const PreferenteD = parseFloat(precioD.Preferente);
      const GeneralD = parseFloat(precioD.General);
      const LateralesD = parseFloat(precioD.Laterales);

      const queryPrecio = `
        UPDATE precioEvento
        SET precio = 
          CASE
            WHEN idTipoMesa = 1 THEN ?
            WHEN idTipoMesa = 2 THEN ?
            WHEN idTipoMesa = 3 THEN ?
            WHEN idTipoMesa = 4 THEN ?
          END,
          precioD = 
          CASE
            WHEN idTipoMesa = 1 THEN ?
            WHEN idTipoMesa = 2 THEN ?
            WHEN idTipoMesa = 3 THEN ?
            WHEN idTipoMesa = 4 THEN ?
          END
        WHERE idEvento = ?;
      `;

      const [resultPrecio] = await pool.query(queryPrecio, [VIP, Preferente, General, Laterales, VIPD, PreferenteD, GeneralD, LateralesD, parseInt(idEvento)]);

      if (resultPrecio.affectedRows === 0) {
        return res.status(404).json({ message: 'No se encontró el registro de precio para el evento' });
      }

      return res.status(200).json({ message: 'Evento y precios actualizados correctamente' });

    } else if (tipo === "Baile") {
      const VIP = parseFloat(precio.VIP);
      const Preferente = parseFloat(precio.Preferente);
      const General = parseFloat(precio.General);
      const VIPD = parseFloat(precioD.VIP);
      const PreferenteD = parseFloat(precioD.Preferente);
      const GeneralD = parseFloat(precioD.General);

      const queryPrecio = `
        UPDATE precioEvento
        SET precio = 
          CASE
            WHEN idTipoMesa = 1 THEN ?
            WHEN idTipoMesa = 2 THEN ?
            WHEN idTipoMesa = 3 THEN ?
          END,
          precioD = 
          CASE
            WHEN idTipoMesa = 1 THEN ?
            WHEN idTipoMesa = 2 THEN ?
            WHEN idTipoMesa = 3 THEN ?
          END
        WHERE idEvento = ?;
      `;

      const [resultPrecio] = await pool.query(queryPrecio, [VIP, Preferente, General, VIPD, PreferenteD, GeneralD, parseInt(idEvento)]);

      if (resultPrecio.affectedRows === 0) {
        return res.status(404).json({ message: 'No se encontró el registro de precio para el evento' });
      }

      return res.status(200).json({ message: 'Evento actualizado correctamente' });

    } else {
      return res.status(200).json({ message: 'Evento actualizado correctamente' });
    }

  } catch (err) {
    console.error('Error al actualizar los datos:', err);
    return res.status(500).json({ error: 'Error al actualizar los datos del evento' });
  }
});

/**
 * Eliminacion definitiva de evento
 */
app.delete(`/eliminar/:idEvento`, async (req, res) => {
  const { idEvento } = req.params;

  const query = `DELETE FROM evento WHERE idEvento = ?`;

  try {
    // Ejecutar la consulta utilizando async/await
    const [result] = await pool.query(query, [idEvento]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se eliminó ningún evento' });
    }

    res.status(200).json({ message: 'Evento eliminado correctamente!' });
  } catch (err) {
    console.error('Error al eliminar el evento:', err);
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
});


/**
 * Conteo de reservas de forma asyncrona
 */
async function conteoReservas(idEvento,codigo) {
  const conexionConteo = await pool
  const [rows] = await conexionConteo.execute(
    `SELECT COUNT(*) AS boletos
    FROM reserva r
    JOIN silla s ON r.codigo = s.codigo
    JOIN mesa m ON m.idMesa = s.idMesa
    JOIN precioEvento p ON p.idPrecio = m.idPrecio
    JOIN evento e ON e.idEvento = p.idEvento
    WHERE e.idEvento = ? AND r.codigo = ?;`,
    [idEvento,codigo]
  );
  return rows[0].boletos;
}

/**
 * consulta para la creacion del codigo
 */

app.get('/conteoReservas/:idEvento', async (req, res) => {
  const { idEvento,codigo} = req.params;
  try {
    const conteo = await conteoReservas(idEvento,codigo);
    res.json({ conteo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * Consulta de boletos
 */
app.get('/verBoleto/:codigo', async (req, res) => {
  const codigoBoleto = req.params.codigo;
  const query = `
    SELECT 
        r.nombre, 
        m.numero AS numero_mesa, 
        s.letra AS letra_silla 
    FROM 
        mesa m 
    INNER JOIN 
        silla s ON m.idMesa = s.idMesa
    INNER JOIN 
        reserva r ON s.codigo = r.codigo
    WHERE 
        r.codigo = ?
    AND s.bloqueada = 0;
  `;

  try {
    // Usar await para ejecutar la consulta de manera asincrónica
    const [results] = await pool.query(query, [codigoBoleto]);

    if (results.length > 0) {
      res.json(results);
    } else {
      res.status(404).json({ error: 'Boleto no encontrado.' });
    }
  } catch (err) {
    console.error('Error al ejecutar la consulta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/**
 * Actualizar nombre de la imagen
 */
async function actualizarImagenEvento(idEvento, nombreImagen) {
  try {
    const query = `
      UPDATE evento
      SET imagen = ?
      WHERE idEvento = ?;
    `;
    
    const [result] = await pool.query(query, [`img/${nombreImagen}`, idEvento]);
    
    if (result.affectedRows > 0) {
      //console.log(`Imagen para evento ${idEvento} actualizada correctamente.`);
      return true; // Indica que la actualización fue exitosa
    } else {
      console.log(`No se encontró el evento con id ${idEvento}.`);
      return false; // Si no se encontró el evento
    }
  } catch (e) {
    console.error('Error al actualizar la imagen:', e);
    throw e; // Lanza el error para manejarlo en la ruta si es necesario
  }
}


/**
 * Funcion para guardar el pdf en el servidor
 */
// filename PDF evento_01/1-0
async function uploadToFtp(rutaLocal, nombreRemoto, accion,idEvento) {
    const client = new ftp.Client();

    try {
        // Conectar al servidor FTP
        console.log("Conectando al servidor FTP...");
        await client.access({
            host: ftpHost,
            user: ftpUser,
            password: ftpPass,
        });

        console.log("Conectado al servidor FTP");
        console.log("Ruta local del archivo:", rutaLocal);
        console.log("Nombre remoto del archivo:", nombreRemoto);

        // Cambiar al directorio donde quieres subir el archivo
        if (accion === "PDF") {
            // console.log("Entrando al directorio FTP:", `${ftpDir}boletos/evento_${idEvento}`);
            await client.cd(`${ftpDir}boletos/evento_${idEvento}`);
            // console.log("Directorio actual FTP:", await client.pwd());
            // console.log("Guardando PDF en el servidor...");
        } else if(accion === "IMG"){
            // console.log("Entrando al directorio FTP:", `${ftpDir}img`);
            await client.cd(`${ftpDir}img`);
            // console.log("Directorio actual FTP:", await client.pwd());
            // console.log("Guardando IMG en el servidor...");
        }

        // Subir el archivo al servidor
       
        await client.uploadFrom(rutaLocal, nombreRemoto);
        console.log(`Archivo ${nombreRemoto} subido al FTP correctamente`);

    } catch (error) {
        console.error("Error al subir el archivo:", error);
    } finally {
        client.close();
    }
}

/**
 * Subir la imagen al servidor
 */
// 1. Configuración de almacenamiento

app.post('/subir-imagen', (req, res) => {
    // 1. Configurar Formidable
    const form = new formidable.IncomingForm({
        uploadDir: path.join(__dirname, 'public', 'imgEventos'),     // Carpeta destino
        keepExtensions: true,    // Mantener .jpg, .png, etc.
        multiples: false         // Solo una imagen
    });

    // 2. Asegurarse de que la carpeta 'public/img' exista, si no, crearla
    const imgDir = path.join(__dirname, 'public', 'imgEventos');
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
    }

    // 3. Parsear el request
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Error parseando form:", err);
            return res.status(500).json({ error: "Error al procesar archivo" });
        }

        // 'fields' contiene los textos (idEvento)
        // 'files' contiene los archivos (imagen)
        //console.log('fields:', fields);  // Verifica que contiene idEvento
        //console.log('files:', files);    // Verifica que contiene imagen

        const idEvento = fields.idEvento; 
        const archivo = Array.isArray(files.imagen) ? files.imagen[0] : files.imagen; // Si es un array, tomar el primer archivo
        
        if (!archivo) {
            return res.status(400).json({ error: "No se subió ninguna imagen" });
        }
      
        // 4. Renombrar el archivo al formato img_ID.ext
        const extension = path.extname(archivo.originalFilename);
        const nuevoNombre = `evento_${idEvento}${extension}`;

        // Ruta final donde se guardará la imagen (directorio público)
        const rutaFinal = path.join(__dirname, 'public', 'imgEventos', nuevoNombre);
        // Ruta del servidor (solo para ser almacenada en la base de datos)

        await uploadToFtp(archivo.filepath,nuevoNombre,"IMG",idEvento);

        // 5. Actualizar la imagen en la base de datos o hacer alguna otra acción
        await actualizarImagenEvento(idEvento, nuevoNombre);  // Asegúrate de que esta función exista y actualice correctamente la base de datos.

        // 6. Mover el archivo de la ruta temporal a la final
        fs.rename(archivo.filepath, rutaFinal, (err) => {
            if (err) {
                console.error("Error al renombrar:", err);
                return res.status(500).json({ error: "Error al guardar archivo" });
            }

            // console.log(`Imagen guardada como: ${nuevoNombre}`);

            // 7. Enviar respuesta al cliente
            res.json({
                message: "Imagen subida correctamente",
                nombre: nuevoNombre,  // El nombre del archivo subido
                ruta: rutaFinal     // La ruta del archivo en el servidor (útil para usarla en tu frontend)
            });
        });
    });
});

/**
 * Generacion de boletos con pdf
 */
app.get('/creaPDFBoleto/:idEvento/:codigo', async (req, res) => {
  const { idEvento, codigo } = req.params;

  const query = `
    SELECT 
        r.nombre, r.apellido, e.nombre AS titulo, e.fecha, e.hora,
        m.numero AS numero_mesa, 
        s.letra AS letra_silla 
    FROM 
        mesa m 
    INNER JOIN 
        silla s ON m.idMesa = s.idMesa
    INNER JOIN 
        reserva r ON s.codigo = r.codigo
    INNER JOIN 
        precioEvento p ON m.idPrecio = p.idPrecio
    INNER JOIN 
        evento e ON p.idEvento = e.idEvento
    WHERE 
        r.codigo = ? AND e.idEvento = ?;
  `;

  // Agrupar sillas por mesa
  const mesasMap = new Map();

  try {
    // Usar await para ejecutar la consulta con mysql2/promise
    const [results] = await pool.query(query, [codigo, idEvento]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontró información para este código y evento' });
    }

    //resultados del query
    const titulo = results[0].titulo;
    const nombre = results[0].nombre;
    const apellido = results[0].apellido;
    const [horas, minutos] = results[0].hora.split(':');
    const fecha = new Date(results[0].fecha);

    const fechap = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit'
    }).format(fecha);

    // Agrupar los resultados por mesa
    results.forEach(row => {
      if (!mesasMap.has(row.numero_mesa)) {
        mesasMap.set(row.numero_mesa, []);
      }
      mesasMap.get(row.numero_mesa).push(row.letra_silla);
    });

    // Cargar plantilla PDF base
    const plantillaPath = path.join(__dirname,'public', 'bplantilla', 'plantilla.pdf');
    const pdfBytes = fs.readFileSync(plantillaPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);

    // Cargando fuentes
    const fontsDir = path.join(__dirname, 'public', 'fonts');
    const Hind = {
      bold: await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-Bold.ttf'))),
      light: await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-Light.ttf'))),
      medium: await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-Medium.ttf'))),
      regular: await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-Regular.ttf'))),
      semiBold: await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-SemiBold.ttf')))
    };

    const page = pdfDoc.getPages()[0];

    // TÍTULO (2 líneas)
    page.drawText(`${titulo}`, {
      x: 235,
      y: 250,
      size: 36,
      font: Hind.bold,
      maxWidth: 600,
      lineHeight: 38,
      color: rgb(1, 1, 1)
    });

    // FECHA / HORA
    page.drawText(`${fechap} - ${horas}:${minutos}H`, {
      x: 235,
      y: 160,
      size: 32,
      font: Hind.regular,
      color: rgb(1, 1, 1)
    });

    // NOMBRE
    page.drawText(`${nombre.split(" ")[0].toUpperCase()} ${apellido.split(" ")[0].toUpperCase()}`, {
      x: 235,
      y: 90,
      size: 28,
      font: Hind.regular,
      color: rgb(1, 1, 1)
    });

    // MESA / ASIENTOS
    let y = 55;
    let tam = 28;
    let esp = 25;
    if (mesasMap.size > 2) {
      tam = 20;
      esp = 20;
    }
    if (mesasMap.size > 3) {
      tam = 12;
      esp = 14;
    }
    mesasMap.forEach((sillas, mesa) => {
      const texto = `Mesa ${mesa} - ${sillas.sort().join('-')}`;
      page.drawText(texto, {
        x: 235,
        y: y,
        size: tam,
        font: Hind.regular,
        color: rgb(1, 1, 1)
      });
      y -= esp;
    });

    // CÓDIGO
    page.drawText(`#${codigo}`, {
      x: 700,
      y: 300,
      size: 28,
      font: Hind.regular,
      color: rgb(1, 1, 1)
    });

    // Texto vertical
    let x = 940;
    tam = 28;
    esp = 50;
    if (mesasMap.size > 2) {
      tam = 14;
      esp = 40;
    }
    mesasMap.forEach((sillas, mesa) => {
      const texto = `Mesa ${mesa}\n${sillas.sort().join('-')}`;
      page.drawText(texto, {
        x: x,
        y: 45,
        size: tam,
        font: Hind.regular,
        rotate: degrees(90),
        color: rgb(1, 1, 1)
      });
      x += esp;
    });

    // Guardar PDF
    const dir = path.join(__dirname, 'public', 'boletosEventos', `evento_${idEvento}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const outputPath = path.join(dir, `${codigo}.pdf`);
    const finalPdf = await pdfDoc.save();
    fs.writeFileSync(outputPath, finalPdf);

    await uploadToFtp(outputPath,`${codigo}.pdf`,"PDF",idEvento);

    res.status(200).json({ message: 'PDF generado correctamente' });
  } catch (error) {
    console.error('❌ Error al generar el PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

/**
 * Generacion de reporte
 */
app.get('/reporte/:idEvento', requireAuth , async (req, res) => {
    const idEvento = req.params.idEvento;

    try {
        const [evento] = await pool.query(
            `SELECT nombre, fecha FROM evento WHERE idEvento = ?`, [idEvento]
        );

        const [precios] = await pool.query(
            `SELECT pe.precio AS precioPreventa, pe.precioD AS precioDia, tm.tipo AS tipo
             FROM evento e
             JOIN precioEvento pe ON pe.idEvento = e.idEvento
             JOIN tipoMesa tm ON pe.idTipoMesa = tm.idTipoMesa
             WHERE e.idEvento = ?`, [idEvento]
        );

        const [conteoPreventa] = await pool.query(
            `SELECT 
                COUNT(CASE WHEN tipo = 'VIP' THEN 1 END) AS VIP,
                COUNT(CASE WHEN tipo = 'Preferente' THEN 1 END) AS Preferente,
                COUNT(CASE WHEN tipo = 'General' THEN 1 END) AS General
             FROM reserva r
             JOIN silla s ON r.codigo = s.codigo
             JOIN mesa m ON m.idMesa = s.idMesa
             JOIN precioEvento p ON p.idPrecio = m.idPrecio
             JOIN evento e ON e.idEvento = p.idEvento
             JOIN tipoMesa t ON t.idtipoMesa = p.idtipoMesa 
             WHERE s.estado = TRUE AND e.idEvento = ? AND r.preventa = 1`, [idEvento]
        );

        const [conteoDiaEvento] = await pool.query(
            `SELECT 
                COUNT(CASE WHEN tipo = 'VIP' THEN 1 END) AS VIP,
                COUNT(CASE WHEN tipo = 'Preferente' THEN 1 END) AS Preferente,
                COUNT(CASE WHEN tipo = 'General' THEN 1 END) AS General
             FROM reserva r
             JOIN silla s ON r.codigo = s.codigo
             JOIN mesa m ON m.idMesa = s.idMesa
             JOIN precioEvento p ON p.idPrecio = m.idPrecio
             JOIN evento e ON e.idEvento = p.idEvento
             JOIN tipoMesa t ON t.idtipoMesa = p.idtipoMesa 
             WHERE s.estado = TRUE AND e.idEvento = ? AND r.preventa = 0`, [idEvento]
        );

        res.render('reporte', {
            evento: evento[0],
            precios,
            conteos: {
                preventa: conteoPreventa[0],
                diaEvento: conteoDiaEvento[0]
            }
        });

    } catch (error) {
        console.error('Error al cargar reporte:', error);
        res.status(500).send('Error en el servidor');
    }
});

/**
 * Apartando sillas deseadas
 */
app.post('/espera-silla/:idEvento', async (req, res) => {
  try {
    const idEvento = req.params.idEvento;
    const { letra, numeroMesa } = req.body;

    const query = `
      UPDATE silla s 
      JOIN mesa m ON m.idMesa = s.idMesa
      JOIN precioEvento pe ON m.idPrecio = pe.idPrecio
      JOIN evento e ON e.idEvento = pe.idEvento
      SET s.enEspera = true,
          s.enEsperaDesde = NOW()
      WHERE s.letra = ?
        AND e.idEvento = ?
        AND m.numero = ?;
    `;

    const values = [letra, idEvento, numeroMesa];

    // Usamos await para ejecutar la consulta
    const [result] = await pool.query(query, values);

    res.sendStatus(200);
  } catch (e) {
    console.error('Error procesando solicitud:', e);
    res.sendStatus(400);
  }
});



/**
 * Verificacion y liberacion de sillas
 */
app.post('/liberar-sillas/:idEvento', express.text(), async (req, res) => {
  try {
    const idEvento = req.params.idEvento;
    const { sillas } = JSON.parse(req.body);

    if (!Array.isArray(sillas) || sillas.length === 0) {
      return res.status(400).send('No hay sillas para liberar');
    }

    const values = sillas.map(({ letra, numeroMesa }) => [letra, idEvento, numeroMesa]);
    // Generamos los placeholders para el IN
    const letrasYMesas = sillas.map(s => [s.letra, s.numeroMesa]);
    const placeholders = letrasYMesas.map(() => '(?, ?)').join(', ');
    const flatValues = letrasYMesas.flat();

    const fullQuery = `
      UPDATE silla s
      JOIN mesa m ON m.idMesa = s.idMesa
      JOIN precioEvento pe ON m.idPrecio = pe.idPrecio
      JOIN evento e ON e.idEvento = pe.idEvento
      SET s.estado = false,
          s.bloqueada = false,
          s.enEspera = false,
          s.enEsperaDesde = NULL
      WHERE (s.letra, m.numero) IN (${placeholders})
        AND e.idEvento = ?;
    `;

    // Ejecutamos la consulta
    const [result] = await pool.query(fullQuery, [...flatValues, idEvento]);

    res.sendStatus(200);
  } catch (e) {
    console.error('❌ Error procesando liberación múltiple:', e);
    res.sendStatus(400);
  }
});

/**
 * Descargas de boletos pdf
 */
app.get("/descargar-boleto", async (req, res) => {
    const { idEvento, codigo } = req.query;

    try {
        const urlPdf = `${process.env.PUBLIC_BASE_URL}/Eventos/boletos/evento_${idEvento}/${codigo}.pdf`;

        const response = await axios.get(urlPdf, {
            responseType: "stream"
        });

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${codigo}.pdf"`
        );
        res.setHeader("Content-Type", "application/pdf");

        response.data.pipe(res);

    } catch (error) {
        console.error("Error al descargar el boleto:", error.message);
        res.status(404).send("El boleto no existe o no está disponible.");
    }
});

app.post(`/quitar-reserva/:codigo`, async (req, res) => {
  try {
    const codigo = req.params.codigo;
    const query = `
      UPDATE silla s 
      SET s.estado = 0,
          s.bloqueada = 0,
          s.codigo = NULL
      WHERE s.codigo = ?
    `;

    const values = [codigo];

    // Usamos await para ejecutar la consulta
    const [result] = await pool.query(query, values);
    console.log(`reserva:${result} deshecha`);
    res.sendStatus(200);
  } catch (e) {
    console.error('Error procesando solicitud:', e);
    res.sendStatus(400);
  }
});

app.post(`/cancelar-evento/:idEvento`, async (req, res) => {
  try {
    const idEvento = req.params.idEvento;
    const query = `
      UPDATE evento
      SET estado = "cancelado"
      WHERE idEvento = ?
    `;

    const values = [parseInt(idEvento)];

    // Usamos await para ejecutar la consulta
    const [result] = await pool.query(query, values);
    res.status(200).json({ status: 'success', message: 'Evento cancelado' });
  } catch (e) {
    console.error('Error procesando solicitud:', e);
    res.sendStatus(400);
  }
});