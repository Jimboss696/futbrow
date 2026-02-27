const express = require('express');
const router = express.Router();

const { getCanchas, getCanchaById } = require('../controllers/canchasController');

router.get('/', getCanchas);
// Agregamos la ruta dinámica con el parámetro :id
router.get('/:id', getCanchaById); 

module.exports = router;