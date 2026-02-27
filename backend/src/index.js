const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const path = require('path'); 

const canchasRoutes = require('./routes/canchasRoutes');
const reservasRoutes = require('./routes/reservasRoutes'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Le decimos a Express que la carpeta uploads es pública para poder ver las fotos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/canchas', canchasRoutes);
app.use('/api/reservas', reservasRoutes);

// Ruta de prueba base
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            mensaje: '¡Servidor de Futbrow corriendo al 100%!',
            hora_db: result.rows[0].now
        });
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
        res.status(500).send('Error de base de datos');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});