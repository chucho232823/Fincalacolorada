const express = require('express');
const router = express.Router();
const { confirmarReserva } = require('../services/reservaService');

router.post('/confirmar-directa', async (req, res) => {
  try {
    const { codigo } = req.body;

    const filas = await confirmarReserva(codigo);

    res.json({
      ok: true,
      sillasConfirmadas: filas
    });

  } catch (error) {
    console.error('❌ Error en confirmación directa:', error);
    res.status(500).json({ error: 'Error al confirmar reserva' });
  }
});

module.exports = router;