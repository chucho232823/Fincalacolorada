const express = require('express');
const router = express.Router();
const { confirmarReserva } = require('../services/reservaService');

router.post('/confirmar-directa', async (req, res) => {
    const { codigo } = req.body;
    
    if (!req.session.auth) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        // 3️⃣ Confirmar reserva
        await pool.query(`
            UPDATE reserva
            SET estado = 'pagada'
            WHERE codigo = ?
        `, [codigo]);

        // 4️⃣ Confirmar sillas
        await pool.query(`
            UPDATE silla
            SET 
                estado = CASE WHEN bloqueada = 0 THEN 1 ELSE estado END,
                enEspera = 0,
                enEsperaDesde = NULL
            WHERE codigo = ?
            AND enEspera = 1
        `, [codigo]);

        res.json({ success: true, message: 'Reserva confirmada directamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al confirmar reserva' });
    }
});

module.exports = router;