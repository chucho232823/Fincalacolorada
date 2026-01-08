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

    // 2️⃣ Verificar si el pago fue aprobado o rechazado
    const { status, metadata } = payment;
    const { codigo, idEvento } = metadata || {};

    if (!codigo || !idEvento) {
      console.error('Pago sin metadata completa');
      return res.sendStatus(400);
    }

    // Si el pago fue aprobado
    if (status === 'approved') {
      // Verificar si ya fue procesado (idempotencia)
      const [[reserva]] = await pool.query(
        'SELECT estado FROM reserva WHERE codigo = ?',
        [codigo]
      );

      if (!reserva || reserva.estado === 'pagada') {
        return res.sendStatus(200);
      }

      // Confirmar reserva
      await pool.query(`
        UPDATE reserva
        SET estado = 'pagada',
            tipoPago = 'Linea'
        WHERE codigo = ?
      `, [codigo]);

      // Confirmar sillas
      const [result] = await pool.query(`
        UPDATE silla
        SET 
          estado = CASE WHEN bloqueada = 1 THEN 0 ELSE 1 END,
          enEspera = 0,
          enEsperaDesde = NULL
        WHERE codigo = ?
        AND enEspera = 1
      `, [codigo]);

      console.log(`Sillas confirmadas: ${result.affectedRows}`);

      // Generar PDF
      await generarPDFBoleto(idEvento, codigo);

    } else if (status === 'rejected') {
      // Si el pago fue rechazado, actualizar la reserva como rechazada
      await pool.query(`
        UPDATE reserva
        SET estado = 'rechazado',
            tipoPago = 'Linea'
        WHERE codigo = ?
      `, [codigo]);

      console.log(`Pago rechazado para el código de reserva: ${codigo}`);
    } else {
      // Si el pago tiene cualquier otro estado, simplemente no se hace nada
      console.log('Estado del pago no manejado:', status);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error en webhook Mercado Pago:', error);
    res.sendStatus(500);
  }
});
