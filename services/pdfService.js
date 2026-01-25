// services/pdfService.js
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const pool = require('../database/dbpool');
const { uploadToFtp } = require('./ftpService');



async function generarPDFBoleto(idEvento, codigo) {
  // 1. Query actualizada con los campos de precio y preventa
  const query = `
    SELECT 
        r.nombre, r.apellido, r.preventa, e.nombre AS titulo, e.fecha, e.hora,
        m.numero AS numero_mesa, p.precio, p.precioD,
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
        r.codigo = ? AND e.idEvento = ? AND s.bloqueada = 0;
  `;

  const [results] = await pool.query(query, [codigo, idEvento]);

  if (results.length === 0) {
    throw new Error('No se encontró información para este código y evento');
  }

  // Datos generales del primer registro
  const { titulo, nombre, apellido, hora, fecha } = results[0];
  const [horas, minutos] = hora.split(':');
  const fechap = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit'
  }).format(new Date(fecha));

  // 2. Preparar documento PDF nuevo y cargar plantilla
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const plantillaPath = path.join(__dirname, '..', 'public', 'bplantilla', 'plantilla.pdf');
  const plantillaBytes = fs.readFileSync(plantillaPath);
  const plantillaDoc = await PDFDocument.load(plantillaBytes);

  // 3. Cargar y embeber fuentes
  const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
  const HindBold = await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-Bold.ttf')));
  const HindReg = await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-Regular.ttf')));

  // 4. Bucle para generar una página por cada silla
  for (const row of results) {
    // Determinar precio según preventa
    const precioFinal = row.preventa === 1 ? row.precio : row.precioD;

    // Copiar página de la plantilla al documento nuevo
    const [copiedPage] = await pdfDoc.copyPages(plantillaDoc, [0]);
    const page = pdfDoc.addPage(copiedPage);

    // TÍTULO
    page.drawText(titulo, {
      x: 235, y: 250, size: 36, font: HindBold,
      maxWidth: 600, lineHeight: 38, color: rgb(1, 1, 1)
    });

    // FECHA / HORA
    page.drawText(`${fechap} - ${horas}:${minutos}H`, {
      x: 235, y: 160, size: 32, font: HindReg, color: rgb(1, 1, 1)
    });

    // NOMBRE
    const nombreCliente = `${nombre.split(' ')[0].toUpperCase()} ${apellido.split(' ')[0].toUpperCase()}`;
    page.drawText(nombreCliente, {
      x: 235, y: 90, size: 28, font: HindReg, color: rgb(1, 1, 1)
    });

    // MESA Y SILLA INDIVIDUAL
    page.drawText(`Mesa ${row.numero_mesa} - Silla ${row.letra_silla}`, {
      x: 235, y: 55, size: 28, font: HindReg, color: rgb(1, 1, 1)
    });

    // CÓDIGO Y PRECIO
    page.drawText(`#${codigo}`, { x: 700, y: 300, size: 28, font: HindReg, color: rgb(1, 1, 1) });
    page.drawText(`$${precioFinal}`, { x: 700, y: 270, size: 24, font: HindBold, color: rgb(1, 1, 1) });

    // TEXTO VERTICAL (Talón)
    page.drawText(`Mesa ${row.numero_mesa}\nSilla ${row.letra_silla}`, {
      x: 940, y: 45, size: 28, font: HindReg,
      rotate: degrees(90), color: rgb(1, 1, 1)
    });
  }

  // 5. Guardar y subir
  const dir = path.join(__dirname, '..', 'public', 'boletosEventos', `evento_${idEvento}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const outputPath = path.join(dir, `${codigo}.pdf`);
  const finalPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, finalPdfBytes);

  // Subida a FTP
  await uploadToFtp(outputPath, `${codigo}.pdf`, 'PDF', idEvento);

  return outputPath;
}


/* async function generarPDFBoleto(idEvento, codigo) {

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

  const mesasMap = new Map();

  const [results] = await pool.query(query, [codigo, idEvento]);

  if (results.length === 0) {
    throw new Error('No se encontró información para este código y evento');
  }

  const { titulo, nombre, apellido, hora, fecha } = results[0];
  const [horas, minutos] = hora.split(':');

  const fechap = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit'
  }).format(new Date(fecha));

  results.forEach(row => {
    if (!mesasMap.has(row.numero_mesa)) {
      mesasMap.set(row.numero_mesa, []);
    }
    mesasMap.get(row.numero_mesa).push(row.letra_silla);
  });

  const plantillaPath = path.join(__dirname, '..', 'public', 'bplantilla', 'plantilla.pdf');
  const pdfBytes = fs.readFileSync(plantillaPath);

  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
  const Hind = {
    bold: await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-Bold.ttf'))),
    regular: await pdfDoc.embedFont(fs.readFileSync(path.join(fontsDir, 'Hind-Regular.ttf')))
  };

  const page = pdfDoc.getPages()[0];

  // TÍTULO
  page.drawText(titulo, {
    x: 235,
    y: 250,
    size: 36,
    font: Hind.bold,
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
  page.drawText(
    `${nombre.split(' ')[0].toUpperCase()} ${apellido.split(' ')[0].toUpperCase()}`,
    {
      x: 235,
      y: 90,
      size: 28,
      font: Hind.regular,
      color: rgb(1, 1, 1)
    }
  );

  // MESAS
  let y = 55;
  let size = 28;
  let spacing = 25;

  if (mesasMap.size > 2) { size = 20; spacing = 20; }
  if (mesasMap.size > 3) { size = 12; spacing = 14; }

  mesasMap.forEach((sillas, mesa) => {
    page.drawText(`Mesa ${mesa} - ${sillas.sort().join('-')}`, {
      x: 235,
      y,
      size,
      font: Hind.regular,
      color: rgb(1, 1, 1)
    });
    y -= spacing;
  });

  // CÓDIGO
  page.drawText(`#${codigo}`, {
    x: 700,
    y: 300,
    size: 28,
    font: Hind.regular,
    color: rgb(1, 1, 1)
  });

  // TEXTO VERTICAL
  let x = 940;
  size = mesasMap.size > 2 ? 14 : 28;
  spacing = mesasMap.size > 2 ? 40 : 50;

  mesasMap.forEach((sillas, mesa) => {
    page.drawText(`Mesa ${mesa}\n${sillas.sort().join('-')}`, {
      x,
      y: 45,
      size,
      font: Hind.regular,
      rotate: degrees(90),
      color: rgb(1, 1, 1)
    });
    x += spacing;
  });

  // GUARDAR
  const dir = path.join(__dirname, '..', 'public', 'boletosEventos', `evento_${idEvento}`);
  fs.mkdirSync(dir, { recursive: true });

  const outputPath = path.join(dir, `${codigo}.pdf`);
  fs.writeFileSync(outputPath, await pdfDoc.save());

  await uploadToFtp(outputPath, `${codigo}.pdf`, 'PDF', idEvento);

  return outputPath;
} */

module.exports = { generarPDFBoleto };
