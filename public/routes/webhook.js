const express = require('express');
const router = express.Router();
const mercadopago = require('../services/mercadopago');
const pool = require('../database/dbpool');
const { generarPDFBoleto } = require('../services/pdfService');

// Webhook Mercado Pago
router.post('/mercadopago', async (req, res) => {
  try {
    const paymentId = req.body.data.id;

    // 1️⃣ Obtener info real del pago
    const payment = await mercadopago.payment.findById(paymentId);

    if (payment.body.status !== 'approved') {
      return res.sendStatus(200);
    }

    const codigo = payment.body.metadata.codigo;

    if (!codigo) {
      console.error('Pago sin código de reserva');
      return res.sendStatus(400);
    }

    // 2️⃣ Confirmar reserva
    await pool.query(`
      UPDATE reserva
      SET estado = 'pagada'
      WHERE codigo = ?
    `, [codigo]);

    // 3️⃣ CONFIRMAR TODAS LAS SILLAS DE ESE CÓDIGO
    // 🔥 Esto reemplaza tu for(reservarMesa)

    const [result] = await pool.query(`
    UPDATE silla
    SET 
        estado = CASE WHEN bloqueada = 0 THEN 1 ELSE 0 END,
        enEspera = 0,
        enEsperaDesde = NULL
        WHERE codigo = ?
        AND enEspera = 1
    `, [codigo]);

    console.log(`Sillas confirmadas: ${result.affectedRows}`);

    
    await generarPDFBoleto(idEvento, codigo);
    // generarPDF(codigo);

    res.sendStatus(200);

  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error);
    res.sendStatus(500);
  }
});

module.exports = router;