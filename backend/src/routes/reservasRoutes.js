const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { crearReserva, getTodasLasReservas, actualizarEstadoReserva } = require('../controllers/reservasController');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Rutas
router.post('/', upload.single('comprobante'), crearReserva);
router.get('/', getTodasLasReservas);
router.put('/:id/estado', actualizarEstadoReserva);

module.exports = router;