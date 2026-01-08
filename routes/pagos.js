const express = require('express');
const router = express.Router();
const { Preference } = require('mercadopago');
const mpClient = require('../services/mercadopago');

/**
 * POST /api/pagos/crear-pago
 */
router.post('/crear-pago', async (req, res) => {
  try {
    const { codigo, idEvento, total, nombre } = req.body;

    if (!codigo || !idEvento || !total) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    if (req.session?.auth) {
      console.log("sesion iniciada");
      return res.json({
        modo: 'directo' // 👈 clave
      });
    }

    const preferenceData = {
      items: [
        {
          // title: `Reserva para: ${nombre}`,
          // quantity: 1,
          // unit_price: Number(total),
          // currency_id: 'MXN'
          title: `TEST PAGO`,
          quantity: 1,
          unit_price: 1,
          currency_id: 'MXN'
        }
      ],

      // 🔑 Identificador único
      external_reference: codigo,

      // 🔑 Datos que leerá el webhook
      metadata: {
        codigo,
        idEvento,
        nombre
      },

      // ✅ URLs ABSOLUTAS (frontend)
      back_urls: {
        success: `${process.env.PUBLIC_BASE_URL_R}/exitoso.html`,
        failure: `${process.env.PUBLIC_BASE_URL_R}/fallido.html`,
        pending: `${process.env.PUBLIC_BASE_URL_R}/pendiente.html`
      },

      auto_return: 'approved',

      // 🔔 Webhook (backend Render)
      notification_url: `${process.env.PUBLIC_BASE_URL_R}/api/pagos/mercadopago`
    };

    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: preferenceData
    });
    console.log(response);  
    res.json({
      init_point: response.init_point
    });

  } catch (error) {
    console.error(error?.cause || error);
    console.error('❌ Error al crear pago:', error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
});

module.exports = router;
