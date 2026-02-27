// Importamos nuestra conexión a la base de datos
const pool = require('../db');

// Función para obtener todas las canchas activas
const getCanchas = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM canchas WHERE activa = TRUE ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener las canchas:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener las canchas' });
    }
};

// Función para obtener una sola cancha por su ID
const getCanchaById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM canchas WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cancha no encontrada' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener la cancha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getCanchas,
    getCanchaById
};