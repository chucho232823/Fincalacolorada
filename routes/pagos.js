const express = require('express');
const router = express.Router();
const { Preference } = require('mercadopago');
const mpClient = require('../services/mercadopago');

router.post('/crear-pago', async (req, res) => {
  try {
    const { codigo, idEvento, total , nombre} = req.body;

    const preferenceData = {
      items: [
        {
          title: `Reserva evento ${nombre}`,
          quantity: 1,
          unit_price: Number(total)
        }
      ],
      external_reference: codigo,
      metadata: { codigo, idEvento, nombre },
      back_urls: {
        success: '/public/exitoso.html',
        failure: '/public/fallido.html',
        pending: '/public/pendiente.html'
      },
      auto_return: 'approved',
      notification_url: `${process.env.PUBLIC_BASE_URL_R}/api/pagos/mercadopago`
    };

    const preference = new Preference(mpClient);
    const response = await preference.create({ body: preferenceData });

    res.json({
      init_point: response.init_point
    });

  } catch (error) {
    console.error('❌ Error al crear pago:', error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
});

module.exports = router;
