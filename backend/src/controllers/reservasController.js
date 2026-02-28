const pool = require('../db');

const crearReserva = async (req, res) => {
    try {
        const { usuario_id = 1, cancha_id, fecha_reserva, hora_inicio, hora_fin } = req.body;
        const comprobante = req.file;

        if (!comprobante) {
            return res.status(400).json({ error: 'Debes adjuntar el comprobante de transferencia' });
        }

        const horaInicioNum = parseInt(hora_inicio.split(':')[0]);
        const horaFinNum = parseInt(hora_fin.split(':')[0]);

        if (horaInicioNum < 9 || horaFinNum > 22) {
            return res.status(400).json({ error: 'El horario de atención regular es de 09:00 a 22:00.' });
        }

        const comprobante_url = `/uploads/${comprobante.filename}`;

        const result = await pool.query(
            `INSERT INTO reservas 
            (usuario_id, cancha_id, fecha_reserva, hora_inicio, hora_fin, estado_pago, comprobante_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [usuario_id, cancha_id, fecha_reserva, hora_inicio, hora_fin, 'pendiente', comprobante_url]
        );

        res.status(201).json({
            mensaje: 'Reserva creada con éxito. Pendiente de validación.',
            reserva: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 1. Obtener todas las reservas (Para el Dashboard del Admin)
const getTodasLasReservas = async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.fecha_reserva, r.hora_inicio, r.hora_fin, r.estado_pago, r.comprobante_url, r.creado_en,
                   c.nombre AS cancha_nombre, 
                   u.nombre AS usuario_nombre, u.telefono
            FROM reservas r
            JOIN canchas c ON r.cancha_id = c.id
            JOIN usuarios u ON r.usuario_id = u.id
            ORDER BY r.creado_en DESC
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener las reservas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 2. Actualizar el estado del pago (Validar o Rechazar)
const actualizarEstadoReserva = async (req, res) => {
    try {
        const { id } = req.params; 
        const { estado_pago } = req.body; 

        if (!['validado', 'rechazado', 'pendiente'].includes(estado_pago)) {
            return res.status(400).json({ error: 'Estado de pago no válido' });
        }

        const result = await pool.query(
            'UPDATE reservas SET estado_pago = $1 WHERE id = $2 RETURNING *',
            [estado_pago, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.status(200).json({
            mensaje: `Reserva actualizada a ${estado_pago}`,
            reserva: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    crearReserva,
    getTodasLasReservas,
    actualizarEstadoReserva
};