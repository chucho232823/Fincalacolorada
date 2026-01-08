const express = require('express');
const router = express.Router();
const { generarPDFBoleto } = require('.,/services/pdfService');

router.get('/creaPDFBoleto/:idEvento/:codigo', async (req, res) => {
  try {
    await generarPDFBoleto(req.params.idEvento, req.params.codigo);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;