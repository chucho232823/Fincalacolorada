const express = require('express');
const router = express.Router();
const mpClient = require('../services/mercadopago');
const { Payment } = require('mercadopago');
const pool = require('../database/dbpool');
const { generarPDFBoleto } = require('../services/pdfService');
const { confirmarReserva } = require('../services/reservaService');

router.post('/mercadopago', async (req, res) => {
  console.log("Volviendo de mercado pago")
  try {
    const paymentId = req.body?.data?.id;

    if (!paymentId) {
      return res.sendStatus(400);
    }

    // 1️⃣ Obtener info real del pago
    const paymentInstance = new Payment(mpClient);
    const payment = await paymentInstance.get({ id: paymentId });
    //console.log("OBJETO PAYMENT COMPLETO:", JSON.stringify(payment, null, 2));
    console.log(`payment estado: ${payment.status}`);
    // Extraemos la metadata temprano para usarla en ambos casos (aprobado/rechazado)
    // Intentamos obtener metadata de la raíz o del cuerpo (body) del objeto
    const metadata = payment.metadata || payment.body?.metadata || {};
    const codigo = metadata.codigo || payment.external_reference || payment.body?.external_reference;
    const idEvento = metadata.idEvento || metadata.id_evento; 
    console.log("Debug Metadata:", metadata);
    console.log("Debug Codigo:", codigo);
    console.log("Debug Evento:", idEvento);
    //

    if (!codigo || !idEvento) {
      console.error('Pago sin metadata completa. Metadata recibida:', metadata);
      // IMPORTANTE: Si el pago es rechazado pero no hay metadata, 
      // a veces es mejor devolver 200 para que MP no sature tu servidor con reintentos
      return res.sendStatus(200);
    }
    
    // 2️⃣ MANEJO DE PAGO RECHAZADO
    if (payment.status === 'rejected') {
      console.log(`Pago rechazado para el código: ${codigo}`);
      await pool.query(`
        UPDATE reserva
        SET estado = 'rechazada',
            tipoPago = 'Linea'
        WHERE codigo = ?
      `, [codigo]);
      
      return res.sendStatus(200); // Respondemos 200 para que MP no reintente
    }

    // 3️⃣ MANEJO DE PAGO APROBADO
    if (payment.status === 'approved') {
      // Verificar si ya fue procesado para evitar duplicidad
      const [[reserva]] = await pool.query(
        'SELECT estado FROM reserva WHERE codigo = ?',
        [codigo]
      );

      if (!reserva || reserva.estado === 'pagada') {
        return res.sendStatus(200);
      }
      console.log(`Pago aprobado para el código: ${codigo}`);
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
          estado = CASE WHEN bloqueada = 0 THEN 1 ELSE estado END,
          enEspera = 0,
          enEsperaDesde = NULL
        WHERE codigo = ?
        AND enEspera = 1
      `, [codigo]);

      console.log(`Sillas confirmadas: ${result.affectedRows}`);

      // Generar PDF
      await generarPDFBoleto(idEvento, codigo);
      
      return res.sendStatus(200);
    }

    // Para cualquier otro estado (pending, in_process), solo avisamos a MP que recibimos el aviso
    res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error en webhook Mercado Pago:', error);
    res.sendStatus(500);
  }
});

module.exports = router;