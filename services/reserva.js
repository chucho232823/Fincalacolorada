const express = require('express');
const router = express.Router();
const { confirmarReserva } = require('../services/reservaService');
const { generarPDFBoleto } = require('../services/pdfService');

router.post('/confirmar-directa', async (req, res) => {
  try {
    const { codigo, idEvento } = req.body;

    const resultado = await confirmarReserva(codigo);

    await generarPDFBoleto(idEvento, codigo);

    res.json({
      ok: true,
      ...resultado
    });

  } catch (error) {
    console.error('❌ Error en confirmación directa:', error);
    res.status(500).json({ error: 'Error al confirmar reserva' });
  }
});

module.exports = router;
