const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const conexion = require('./database/db');
const bodyParser = require('body-parser');
const conexionPromise = require('./database/dbp');
const pool = require('./database/dbpool');
//const PDFDocument = require('pdfkit');
const { error } = require('console');
const cron = require('node-cron'); //para cronometro

const fontkit = require('@pdf-lib/fontkit');





const { PDFDocument, rgb, degrees } = require('pdf-lib');
(async () => {
  const pdfBytes = fs.readFileSync(
    path.join(__dirname, 'public' ,'bplantilla', 'plantilla.pdf')
  );

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
})();


app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));

// Ejecutar cada minuto
cron.schedule('* * * * *', () => {
  const query = `
    UPDATE silla
    SET enEspera = false,
        enEsperaDesde = NULL
    WHERE enEspera = true
      AND enEsperaDesde < NOW() - INTERVAL 5 MINUTE;
  `;
  conexion.query(query, (err, result) => {
    if (err) {
      console.error('Error liberando sillas:', err);
    } else if (result.affectedRows > 0) {
      //console.log(`Sillas liberadas automáticamente: ${result.affectedRows}`);
    }
  });
});

/**
 * funcion para generar pdf
 */
function generarPDFReserva(nombre, codigo, mesa, silla, idEvento) {
    const dir = path.join(__dirname,'public' ,'boletosEventos', `evento_${idEvento}`);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const pdfPath = path.join(dir, `${codigo}.pdf`);
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(18).text('🎫 Boleto de Reserva', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Código de reserva: ${codigo}`);
    doc.text(`Nombre: ${nombre}`);
    doc.text(`Mesa: ${mesa}`);
    doc.text(`Silla: ${silla}`);
    doc.text(`Evento ID: ${idEvento}`);

    doc.end();
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'eventosAdmin.html'));
});

//Eventos 
app.get('/evento',(req,res)=>{
  const query = 'SELECT * FROM evento';
  conexion.query(query,(error,resultado) => {
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
app.get('/listado-de-eventos', (req, res) => {
  conexion.query("SET lc_time_names = 'es_ES'", (error1) => {
    if (error1) {
      console.error('Error al configurar lc_time_names:', error1);
      res.status(500).send('Error interno del servidor');
      return;
    }

    const query = `SELECT e.idEvento AS idEvento, e.nombre AS nombre, t.tipo AS tipo, DATE_FORMAT(e.fecha, '%d de %M de %Y') AS fecha,
      TIME_FORMAT(e.hora, '%H:%i') AS hora, e.imagen AS imagen, e.subtitulo AS subtitulo 
      FROM evento e
      JOIN tipoEvento t ON e.idTipoEVento = t.idTipoEvento
      WHERE e.fecha >= CURDATE()
      ORDER BY e.fecha ASC;
    `;

    conexion.query(query, (error2, resultado) => {
      if (error2) {
        console.error('Error en la consulta:', error2);
        res.status(500).send('Error en la consulta');
      } else {
        res.json(resultado);
      }
    });
  });
}); 

/**
 * Carga de listado de eventos
 * 
 */
app.get('/listado-de-eventos-pasados', (req, res) => {
  conexion.query("SET lc_time_names = 'es_ES'", (error1) => {
    if (error1) {
      console.error('Error al configurar lc_time_names:', error1);
      res.status(500).send('Error interno del servidor');
      return;
    }

    const query = `SELECT e.idEvento AS idEvento, e.nombre AS nombre, t.tipo AS tipo, DATE_FORMAT(e.fecha, '%d de %M de %Y') AS fecha,
      e.imagen AS imagen, e.subtitulo AS descripcion
      FROM evento e
      JOIN tipoEvento t ON e.idTipoEVento = t.idTipoEvento
      WHERE e.fecha < CURDATE()
      ORDER BY e.fecha ASC;
    `;

    conexion.query(query, (error2, resultado) => {
      if (error2) {
        console.error('Error en la consulta:', error2);
        res.status(500).send('Error en la consulta');
      } else {
        res.json(resultado);
      }
    });
  });
}); 


//Encontrando evento por nombre
app.get('/evento/nombre/:nombre',(req,res) => {
  const nombre = req.params.nombre;

  const query = 'SELECT * FROM evento WHERE nombre = ?';
  conexion.query(query,[nombre],(error,resultado) => {
    if(error){
      console.error('Error en la consulta: ',error);
      return res.status(500).send('Error en el servidor');
    }

    if(resultado.length === 0){
      return res.status(404).send('Evento no encontrado');
    }

    res.json(resultado);
  })
})


/**
 * Cargando el estado de las sillas de acuerdo al evento
 */
app.get('/estado-sillas/:idEvento',(req,res) => {
  const idEvento = req.params.idEvento;
  
  const query = ` SELECT e.nombre, m.numero AS Mesa, s.letra AS Silla, s.estado, p.precio, s.bloqueada, s.enEspera, tm.tipo
                  FROM evento e 
                  JOIN precioEvento p ON e.idEvento = p.idEvento
                  JOIN tipomesa tm ON tm.idTipoMesa = p.idTipoMesa
                  JOIN mesa m ON p.idPrecio = m.idPrecio
                  JOIN silla s ON m.idMesa = s.idMesa
                  WHERE e.idEvento = ?;`;
  conexion.query(query,[idEvento], (error,resultado) => {
    if(error){
      console.error('Error al conectar la  base',error);
      return res.status(500).send('error en el servidor');
    }
    if(resultado.length ===0){
      return res.status(404).send('No se encontro el evento');
    }

    res.json(resultado);
  })
})

/**
 * Cargando estado de sillas individuales
 */
app.get('/estado-silla/:idEvento', (req, res) => {
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

    conexion.query(query, [idEvento, mesa, silla], (error, resultado) => {
      if (error) {
        console.error('Error al conectar la base', error);
        return res.status(500).send('Error en el servidor');
      }
      if (resultado.length === 0) {
        return res.status(404).send('No se encontró el evento');
      }

      res.json(resultado);
    });
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


/**
 * Enviar creacion de evento
 */
app.post('/crearEvento', (req, res) => {
  const { nombre, fecha, fechaP , tipo, precio, precioD, hora, img, subtitulo} = req.body;
  const imagen = "img/img.JPG";
  let query = '';
  let params = [];

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
      parseFloat(precioD.General),
    ];
  } else {
    return res.status(400).send('❌ Tipo de evento no válido');
  }

  conexion.query(query, params, (err, result) => {
    if (err) {
      console.error('❌ Error al insertar evento:', err);
      return res.status(500).send('Error al crear el evento');
    }

    const idEvento = result[0]?.[0]?.id;
    if (!idEvento) {
      console.error('❌ No se obtuvo el ID del evento');
      return res.status(500).send('No se pudo obtener el ID del evento');
    }

    const nombreCarpeta = `evento_${idEvento}`;
    const rutaCarpeta = path.join(carpetaBase, nombreCarpeta);

    fs.mkdir(rutaCarpeta, { recursive: true }, (err) => {
      if (err) {
        console.error('❌ Error al crear la carpeta:', err);
        return res.status(500).send('Evento creado, pero falló la creación de carpeta');
      }
      //console.log(`Carpeta creada: ${rutaCarpeta}`);
      res.send(`✅ Evento '${nombre}' agregado!`);
    });
  });
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
  res.render(evento.tipo, { evento });
})

/**
 * Reservacion de sillas
 */
app.put('/reservar/:idEvento', (req, res) => {
  const { idEvento } = req.params; 
  const { silla , codigo} = req.body; 
  const mesa = silla.mesa;
  const sil = silla.silla;
  let preventa;
  if (!mesa || !sil || isNaN(mesa) || typeof sil !== 'string') {
    return res.status(400).json({ error: 'Los parámetros mesa y silla deben ser números válidos' });
  }

  const query = ` UPDATE silla s
                  JOIN mesa m ON m.idMesa = s.idMesa
                  JOIN precioEvento p ON p.idPrecio = m.idPrecio
                  JOIN evento e ON e.idEvento = p.idEvento
                  SET s.estado = true,
                      s.codigo = ?
                  WHERE m.numero = ? 
                  AND e.idEvento = ?
                  AND s.letra = ?;`;

  // Ejecutar la consulta con parámetros
  conexion.query(query, [codigo, mesa, parseInt(idEvento), sil], (err, result) => {
    if (err) {
      console.error('Error al actualizar:', err);
      return res.status(500).json({ error: 'Error al actualizar los datos' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró el registro con los datos proporcionados' });
    }
    res.status(200).json({ message: 'Reserva realizada correctamente' });
  });
});

/**
 * Bloqueo de sillas para apartar mesa
 */
app.put('/bloqueo/:idEvento', (req, res) => {
  const { idEvento } = req.params; 
  const { silla } = req.body; 
  const mesa = silla.mesa;
  const sil = silla.silla;
  // Validación básica
  if (!mesa || !sil || isNaN(mesa) || typeof sil !== 'string') {
    return res.status(400).json({ error: 'Los parámetros mesa y silla deben ser números válidos' });
  }

  const query = ` UPDATE silla s
                  JOIN mesa m ON m.idMesa = s.idMesa
                  JOIN precioEvento p ON p.idPrecio = m.idPrecio
                  JOIN evento e ON e.idEvento = p.idEvento
                  SET s.bloqueada = true
                  WHERE m.numero = ? 
                  AND e.idEvento = ?
                  AND s.letra = ?;`;
  // Ejecutar la consulta con parámetros
  conexion.query(query, [mesa, parseInt(idEvento), sil], (err, result) => {
    if (err) {
      console.error('Error al actualizar:', err);
      return res.status(500).json({ error: 'Error al actualizar los datos' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró el registro con los datos proporcionados' });
    }
    res.status(200).json({ message: 'Bloqueo de silla realizado' });
  });
});

/**
 * Enviando los datos para el formulario de los datos del usuario
 */
app.post('/datos', (req,res) => {
    const reserva = JSON.parse(req.body.jsonData);
    const sembrado = reserva.sembrado;
    const listaMesaSilla = reserva.listaMesaSilla;
    const controlFila = reserva.controlFila;
    const tipo = reserva.tipo;
    const consecutivas = reserva.consecutivas;
    const agrupadasPorMesa = reserva.agrupadasPorMesa;
    res.render( 'datos' , { sembrado, listaMesaSilla, controlFila, tipo, consecutivas, agrupadasPorMesa} );
})

/**
 * Obtencion del conteo de forma asyncrona
 */
async function obtenerConteo(idEvento) {
  const conexionConteo = await conexionPromise
  const [rows] = await conexionConteo.execute(
    `SELECT COUNT(*) AS numero
     FROM silla s
     JOIN mesa m ON m.idMesa = s.idMesa
     JOIN precioEvento p ON p.idPrecio = m.idPrecio
     JOIN evento e ON e.idEvento = p.idEvento
     WHERE estado = true AND e.idEvento = ?`,
    [idEvento]
  );
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
app.post('/codigo',(req,res) =>{
    const {codigo,nombre,apellidos,telefono,fechaP,mesasJuntadas} = req.body;
    let preventa;
    if (fechaP) {
      const hoy = new Date();
      const fecha = new Date(fechaP);

      if (hoy <= fecha) {
        preventa = true;
      } else {
        preventa = false;
      }
    }
    if( !codigo || !nombre || !apellidos || !telefono){
      return res.status(400).json({ error: 'Parametros invalidos' });
    }
    let cadena = "";
    mesasJuntadas.forEach(mesas =>{
      if(mesas.juntar){
        cadena += `${mesas.mesas} `; 
      }
    })
    
    const query = `INSERT INTO reserva (codigo,nombre,apellido,telefono,preventa,juntar)
             VALUES( ? , ? , ? , ? , ? , ?);`;

    conexion.query(query,[codigo,nombre,apellidos,telefono,1,cadena],(err,result) =>{
      if (err) {
      console.error('Error al actualizar:', err);
        return res.status(500).json({ error: 'Error al actualizar los datos' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'No se encontró el registro con los datos proporcionados' });
      }
      res.status(200).json({ message: 'Reserva realizada correctamente' });
    })
})

app.get('/lista/:idEvento', async (req, res) => {
  const { idEvento } = req.params;

  const queryReservas = `
    SELECT DISTINCT r.nombre, r.telefono, r.codigo, r.juntar
    FROM reserva r
    JOIN silla s ON s.codigo = r.codigo
    JOIN mesa m ON m.idMesa = s.idMesa
    JOIN precioEvento p ON p.idPrecio = m.idPrecio
    JOIN evento e ON e.idEvento = p.idEvento
    WHERE e.idEvento = ? 
    ORDER BY r.nombre;
  `;

  const queryNombreEvento = `SELECT nombre FROM evento WHERE idEvento = ?;`;

  try {
    const conexion = await conexionPromise;

    // Obtener las reservas
    const [reservas] = await conexion.execute(queryReservas, [idEvento]);

    // Obtener el nombre del evento
    const [eventoResultado] = await conexion.execute(queryNombreEvento, [idEvento]);

    if (eventoResultado.length === 0) {
      return res.status(404).send('Evento no encontrado');
    }

    const nombreEvento = eventoResultado[0].nombre;

    // Obtener el conteo de boletos para cada reserva
    const reservasConBoletos = await Promise.all(
      reservas.map(async (reserva) => {
        const [conteo] = await conexion.execute(
          `SELECT COUNT(*) AS boletos
           FROM reserva r
           JOIN silla s ON r.codigo = s.codigo
           JOIN mesa m ON m.idMesa = s.idMesa
           JOIN precioEvento p ON p.idPrecio = m.idPrecio
           JOIN evento e ON e.idEvento = p.idEvento
           WHERE e.idEvento = ? AND r.codigo = ?;`,
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

app.get('/precios/:idEvento', (req, res) => {
  const { idEvento } = req.params;

  const query = `
    SELECT t.tipo, p.precio, p.precioD, e.fechaP
    FROM precioEvento p
    JOIN tipoMesa t ON t.idTipoMesa = p.idTipoMesa
    JOIN evento e ON p.idEvento = e.idEvento
    WHERE e.idEvento = ?;
  `;

  conexion.query(query, [idEvento], (err, resultado) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    res.json(resultado); // ← enviamos los resultados al cliente
  });
});

/**
 * Obtener fecha Preventa
 */

app.get('/fechaP/:idEvento', (req, res) => {
  const { idEvento } = req.params;

  const query = `
    SELECT fechaP
    FROM evento 
    WHERE idEvento = ?;
  `;

  conexion.query(query, [idEvento], (err, resultado) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    res.json(resultado);
  });
});

/**
 * Edicion de un evento
 */

app.get('/editar/:idEvento', (req, res) => {
  const { idEvento } = req.params;

  const query = `
    SELECT m.tipo, p.precio, p.precioD, e.fecha, e.fechaP, e.nombre, t.tipo AS tipoEvento
    FROM evento e 
    JOIN tipoEvento t ON e.idTipoEvento = t.idTipoEvento
    JOIN precioEvento p ON e.idEvento = p.idEvento
    JOIN tipoMesa m ON m.idTipoMesa = p.idTipoMesa 
    WHERE e.idEvento = ?;
  `;

  conexion.query(query, [idEvento], (err, resultado) => {
    if (err) {
      console.error('Error al consultar evento:', err);
      return res.status(500).send('Error en el servidor');
    }
    if (resultado.length === 0) {
      return res.status(404).send('Evento no encontrado');
    }
    
    const nombreEvento = resultado[0].nombre;
    const fechaEvento = resultado[0].fecha;
    const tipoEvento = resultado[0].tipoEvento;
    const fechaPreventa = resultado[0].fechaP;
    // Preparamos los datos de precios y tipos de mesa para la vista
    // Para que sea más cómodo en el EJS, agrupamos precios por tipo
    const precios = resultado.map(row => ({
      tipo: row.tipo,
      precio: row.precio,
      precioD: row.precioD
    }));

    res.render('editarEvento', { idEvento, nombreEvento, fechaEvento, fechaPreventa, precios , tipoEvento });
  });
});

// para el modal
app.get('/api/editar/:idEvento', (req, res) => {
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

  conexion.query(query, [idEvento], (err, resultado) => {
    if (err) return res.status(500).json({ error: "Error en el servidor" });

    if (resultado.length === 0)
      return res.status(404).json({ error: "Evento no encontrado" });

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
  });
});


/**
 * Edicion del evento
 */
app.put(`/cambio/:idEvento`, (req, res) => {
  const { idEvento } = req.params;
  const { tipo, nombre, subtitulo, fecha, fechaP, hora, precio, precioD } = req.body;
  // Actualización del evento
  const queryEvento = `UPDATE evento 
                  SET nombre = ?, subtitulo = ?, fecha = ?, 
                  fechaP = ?, hora = ?
                  WHERE idEvento = ?`;

  conexion.query(queryEvento, [nombre,subtitulo,fecha,fechaP,hora,parseInt(idEvento)], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar los datos del evento' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró el registro con los datos proporcionados' });
    }

    // Si la actualización del evento es exitosa, proceder con la actualización de precios.
    if (tipo == "Trova") {
      const VIP = parseFloat(precio.VIP);
      const Preferente = parseFloat(precio.Preferente);
      const General = parseFloat(precio.General);
      const Laterales = parseFloat(precio.Laterales);
      const VIPD = parseFloat(precio.VIP);
      const PreferenteD = parseFloat(precio.Preferente);
      const GeneralD = parseFloat(precio.General);
      const LateralesD = parseFloat(precio.Laterales);
      const queryPrecio = `UPDATE precioEvento
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
                          WHERE idEvento = ?`;

      conexion.query(queryPrecio, [VIP, Preferente, General, Laterales,VIPD, PreferenteD, GeneralD, LateralesD, parseInt(idEvento)], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Error al actualizar los datos del precio' });
        }

        if (result.affectedRows == 0) {
          return res.status(404).json({ message: 'No se encontró el registro de precio para el evento' });
        }
        res.status(200).json({ message: 'Reserva realizada correctamente' });
      });
    } else if(tipo == "Baile") {
          const VIP = parseFloat(precio.VIP);
          const Preferente = parseFloat(precio.Preferente);
          const General = parseFloat(precio.General);
          const VIPD = parseFloat(precioD.VIP);
          const PreferenteD = parseFloat(precioD.Preferente);
          const GeneralD = parseFloat(precioD.General);
          const queryPrecio = `UPDATE precioEvento
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
                            WHERE idEvento = ?`;

        conexion.query(queryPrecio, [VIP, Preferente, General, VIPD, PreferenteD, GeneralD, parseInt(idEvento)], (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Error al actualizar los datos del precio' });
          }

          if (result.affectedRows == 0) {
            return res.status(404).json({ message: 'No se encontró el registro de precio para el evento' });
          }
          res.status(200).json({ message: 'Reserva realizada correctamente' });
      });
      } else{
      res.status(200).json({ message: 'Evento actualizado correctamente' });
    }
  });
});

app.delete(`/eliminar/:idEvento`, (req,res) =>{
  const { idEvento } = req.params;
  
  const query = `DELETE FROM evento WHERE idEvento = ?`

  conexion.query(query,[idEvento],(err,result) =>{
    if(err){
      res.status(500).json({error: 'Error al eliminar el evento'});
    }
    if(result.affectedRows === 0){
        return res.status(404).json({ message: 'No se elimino ningun evento' });
    }
    res.status(200).json({ message: 'Evento eliminado correctamente!' });
  })
})


/**
 * Conteo de reservas de forma asyncrona
 */
async function conteoReservas(idEvento,codigo) {
  const conexionConteo = await conexionPromise
  const [rows] = await conexionConteo.execute(
    `SELECT COUNT(*) AS boletos
    FROM reserva r
    JOIN silla s ON r.codigo = s.codigo
    JOIN mesa m ON m.idMesa = s.idMesa
    JOIN precioEvento p ON p.idPrecio = m.idPrecio
    JOIN evento e ON e.idEvento = p.idEvento
    WHERE e.idEvento = 4 AND r.codigo = 52;`,
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
            r.codigo = ?;
    `;

    conexion.query(query, [codigoBoleto], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (results.length > 0) {
            res.json(results);
        } else {
            res.status(404).json({ error: 'Boleto no encontrado.' });
        }
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
  conexion.query(query, [codigo, idEvento], async (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta:', err);
      return res.status(500).json({ error: 'Error al generar el PDF' });
    }

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
    results.forEach(row => {
      if (!mesasMap.has(row.numero_mesa)) {
        mesasMap.set(row.numero_mesa, []);
      }
      mesasMap.get(row.numero_mesa).push(row.letra_silla);
    });

    // Cargar PDF base
    const plantillaPath = path.join(__dirname,'public' ,'bplantilla', 'plantilla.pdf');
    const pdfBytes = fs.readFileSync(plantillaPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    //cargando fuentes
    const fontsDir = path.join(__dirname, 'public', 'fonts');
    //objeto para organizarlas mejor
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
    ;
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

    //texto vertical
    //codigo para ordenar mesas
    let x = 940;
    tam = 28;
    esp = 50;
    if (mesasMap.size > 2) {
      tam = 14;
      esp = 40;
    }
    // if (mesasMap.size > 3) {
    //   tam = 3;
    //   esp = 0;
    // }
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
    const dir = path.join(__dirname, 'public' ,'boletosEventos', `evento_${idEvento}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const outputPath = path.join(dir, `${codigo}.pdf`);
    const finalPdf = await pdfDoc.save();
    fs.writeFileSync(outputPath, finalPdf);

    res.status(200).json({ message: 'PDF generado correctamente' });
  });
});

/**
 * Generacion de reporte
 */
app.get('/reporte/:idEvento', async (req, res) => {
    const idEvento = req.params.idEvento;

    try {
        const [evento] = await pool.query(
            `SELECT nombre, fecha FROM evento WHERE idEvento = ?`, [idEvento]
        );

        const [precios] = await pool.query(
            `SELECT pe.precio AS precioPreventa, pe.precioD AS precioDia, tm.tipo AS tipo
             FROM evento e
             JOIN precioevento pe ON pe.idEvento = e.idEvento
             JOIN tipomesa tm ON pe.idTipoMesa = tm.idTipoMesa
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
             JOIN tipomesa t ON t.idtipoMesa = p.idtipoMesa 
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
             JOIN tipomesa t ON t.idtipoMesa = p.idtipoMesa 
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
app.post('/espera-silla/:idEvento', (req, res) => {
  try {
    const idEvento = req.params.idEvento;
    const { letra, numeroMesa } = req.body;

    const query = `
      UPDATE silla s 
      JOIN mesa m ON m.idMesa = s.idMesa
      JOIN precioevento pe ON m.idPrecio = pe.idPrecio
      JOIN evento e ON e.idEvento = pe.idEvento
      SET s.enEspera = true,
          s.enEsperaDesde = NOW()
      WHERE s.letra = ?
        AND e.idEvento = ?
        AND m.numero = ?;
    `;

    const values = [letra, idEvento, numeroMesa];

    conexion.query(query, values, (err, result) => {
      if (err) {
        console.error('Error liberando enEspera:', err);
        return res.sendStatus(500);
      }

      res.sendStatus(200);
    });
  } catch (e) {
    console.error('Error procesando solicitud:', e);
    res.sendStatus(400);
  }
});


/**
 * Verificacion y liberacion de sillas
 */
app.post('/liberar-sillas/:idEvento', express.text(), (req, res) => {
  try {
    const idEvento = req.params.idEvento;
    const { sillas } = JSON.parse(req.body);

    if (!Array.isArray(sillas) || sillas.length === 0) {
      return res.status(400).send('No hay sillas para liberar');
    }

    const values = sillas.map(({ letra, numeroMesa }) => [letra, idEvento, numeroMesa]);

    const query = `
      UPDATE silla s 
      JOIN mesa m ON m.idMesa = s.idMesa
      JOIN precioevento pe ON m.idPrecio = pe.idPrecio
      JOIN evento e ON e.idEvento = pe.idEvento
      SET s.enEspera = false
      WHERE (s.letra, m.numero) IN (?)
        AND e.idEvento = ?;
    `;

    const letrasYMesas = sillas.map(s => [s.letra, s.numeroMesa]);
    const placeholders = letrasYMesas.map(() => '(?, ?)').join(', ');
    const flatValues = letrasYMesas.flat();

    const fullQuery = `
      UPDATE silla s
      JOIN mesa m ON m.idMesa = s.idMesa
      JOIN precioevento pe ON m.idPrecio = pe.idPrecio
      JOIN evento e ON e.idEvento = pe.idEvento
      SET s.enEspera = false
      WHERE (s.letra, m.numero) IN (${placeholders})
        AND e.idEvento = ?;
    `;

    conexion.query(fullQuery, [...flatValues, idEvento], (err, result) => {
      if (err) {
        console.error('❌ Error liberando múltiples sillas:', err);
        return res.sendStatus(500);
      }

      res.sendStatus(200);
    });

  } catch (e) {
    console.error('❌ Error procesando liberación múltiple:', e);
    res.sendStatus(400);
  }
});


/**
 * Descargas de boletos pdf
 */
app.get('/descargar-boleto', (req, res) => {
    const { idEvento, codigo } = req.query; 

    const rutaArchivo = path.join(
        __dirname,
        'public', 
        'boletosEventos', 
        `evento_${idEvento}`, 
        `${codigo}.pdf`       
    );

    res.download(rutaArchivo, `${codigo}.pdf`, (err) => {
        if (err) {
            console.error("Error en la descarga:", err);
            if (!res.headersSent) {
                res.status(404).send("El boleto específico no existe en la carpeta del evento.");
            }
        }
    });
});