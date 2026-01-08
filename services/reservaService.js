const express = require('express');
const pool = require('../database/dbpool');
const router = express.Router();

async function confirmarReserva(codigo) {
  // 1️⃣ Marcar reserva como pagada
  await pool.query(`
    UPDATE reserva
    SET estado = 'pagada'
    WHERE codigo = ?
  `, [codigo]);

  // 2️⃣ Confirmar sillas
  const [result] = await pool.query(`
    UPDATE silla
    SET 
      estado = CASE WHEN bloqueada = 0 THEN 1 ELSE estado END,
      enEspera = 0,
      enEsperaDesde = NULL
    WHERE codigo = ?
      AND enEspera = 1
  `, [codigo]);

  return result.affectedRows;
}

module.exports = {
  confirmarReserva
};