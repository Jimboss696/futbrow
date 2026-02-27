const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { crearReserva } = require('../controllers/reservasController');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Indicamos que guarde los archivos en la carpeta uploads que creaste
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Generamos un nombre único: fecha_actual + extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Middleware que espera un archivo de imagen en el campo "comprobante"
const upload = multer({ storage: storage });

// Definimos la ruta POST. Primero se ejecuta upload.single(), luego crearReserva
router.post('/', upload.single('comprobante'), crearReserva);

module.exports = router;