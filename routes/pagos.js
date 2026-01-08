const express = require('express');
const router = express.Router();
const mercadopago = require('../services/mercadopago');

app.post('/crear-pago', async (req, res) => {
  const { codigo, idEvento, total } = req.body;

  const preference = {
    items: [
      {
        title: `Reserva evento ${idEvento}`,
        quantity: 1,
        unit_price: Number(total)
      }
    ],

    external_reference: codigo, // 🔑 CLAVE

    metadata: {
      codigo,
      idEvento
    },

    back_urls: {
      success: '/pago-exitoso.html',
      failure: '/pago-fallido.html',
      pending: '/pago-pendiente.html'
    },

    auto_return: 'approved',

    notification_url: `${process.env.PUBLIC_BASE_URL}/webhook-mercadopago`
  };

  const response = await mercadopago.preferences.create(preference);

  res.json({
    init_point: response.body.init_point
  });
});
module.exports = router;