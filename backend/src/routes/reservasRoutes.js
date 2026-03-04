const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { crearReserva, getTodasLasReservas, actualizarEstadoReserva, getHorariosOcupados, getMisReservas } = require('../controllers/reservasController');
const verificarToken = require('../middlewares/authMiddleware');

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Protegemos las rutas de creación y administración
router.post('/', verificarToken, upload.single('comprobante'), crearReserva);
router.get('/', verificarToken, getTodasLasReservas);
router.put('/:id/estado', verificarToken, actualizarEstadoReserva);

// NUEVA RUTA: Pública para que el calendario del celular pueda consultar qué horas están ocupadas
router.get('/disponibilidad/:cancha_id/:fecha', getHorariosOcupados);

// Para que vean la rerva los clientes
router.get('/cliente/mis-reservas', verificarToken, getMisReservas);

module.exports = router;