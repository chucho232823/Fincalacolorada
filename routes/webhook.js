const express = require('express');
const router = express.Router();
const mercadopago = require('../services/mercadopago');
const pool = require('../database/dbpool');
const { generarPDFBoleto } = require('../services/pdfService');
const { confirmarReserva } = require('../services/reservaService');

router.post('/mercadopago', async (req, res) => {
  try {
    const paymentId = req.body?.data?.id;

    if (!paymentId) {
      return res.sendStatus(400);
    }

    // 1️⃣ Obtener info real del pago
    const payment = await mercadopago.payment.get({ id: paymentId });

    if (payment.status !== 'approved') {
      return res.sendStatus(200);
    }

    const { codigo, idEvento } = payment.metadata || {};

    if (!codigo || !idEvento) {
      console.error('Pago sin metadata completa');
      return res.sendStatus(400);
    }

    // 2️⃣ Verificar si ya fue procesado (idempotencia)
    const [[reserva]] = await pool.query(
      'SELECT estado FROM reserva WHERE codigo = ?',
      [codigo]
    );

    if (!reserva || reserva.estado === 'pagada') {
      return res.sendStatus(200);
    }

    // 3️⃣ Confirmar reserva
    await pool.query(`
      UPDATE reserva
      SET estado = 'pagada'
      WHERE codigo = ?
    `, [codigo]);

    // 4️⃣ Confirmar sillas
   const [result] = await pool.query(`
    UPDATE silla
    SET 
      estado = CASE WHEN bloqueada = 0 THEN 1 ELSE estado END,
      enEspera = 0,
      enEsperaDesde = NULL
      WHERE codigo = ?
      AND enEspera = 1
  `, [codigo]);

    console.log(`Sillas confirmadas: ${result.affectedRows}`);

    // 5️⃣ Generar PDF
    await generarPDFBoleto(idEvento, codigo);

    res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error en webhook Mercado Pago:', error);
    res.sendStatus(500);
  }
});

module.exports = router;
