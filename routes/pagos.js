const express = require('express');
const router = express.Router();
const mercadopago = require('../services/mercadopago');

router.post('/crear-pago', async (req, res) => {
  try {
    const { codigo, idEvento, total } = req.body;

    const preference = {
      items: [
        {
          title: `Reserva evento ${idEvento}`,
          quantity: 1,
          unit_price: Number(total)
        }
      ],
      external_reference: codigo,
      metadata: { codigo, idEvento },
      back_urls: {
        success: '/pago-exitoso.html',
        failure: '/pago-fallido.html',
        pending: '/pago-pendiente.html'
      },
      auto_return: 'approved',
      notification_url: `${process.env.PUBLIC_BASE_URL}/api/pagos/mercadopago`
    };

    const response = await mercadopago.preferences.create(preference);
    console.log(response);
    // ✅ OJO AQUÍ
    res.json({
      init_point: response.init_point
    });

  } catch (error) {
    console.error('❌ Error al crear pago:', error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
});


module.exports = router;