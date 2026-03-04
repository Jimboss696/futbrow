const pool = require('../db');

const crearReserva = async (req, res) => {
    try {
        const usuario_id = req.usuario.id; 
        const { cancha_id, fecha_reserva, hora_inicio, hora_fin, metodo_pago } = req.body;
        const comprobante = req.file;

        // 1. ¡ELIMINAMOS LA RESTRICCIÓN DE 09:00 A 22:00! AHORA ES 24/7.
        
        // 2. REGLA ANTI-OVERBOOKING (Opción A)
        const overlapQuery = `
            SELECT id FROM reservas 
            WHERE cancha_id = $1 
            AND fecha_reserva = $2 
            AND estado_pago != 'rechazado'
            AND (hora_inicio < $4 AND hora_fin > $3)
        `;
        const overlapResult = await pool.query(overlapQuery, [cancha_id, fecha_reserva, hora_inicio, hora_fin]);

        if (overlapResult.rows.length > 0) {
            return res.status(409).json({ error: 'Este horario ya está reservado. Por favor elige otro.' });
        }

        // 3. LÓGICA CONDICIONAL DE PAGOS
        let estado_pago = 'pendiente';
        let comprobante_url = null;

        if (metodo_pago === 'transferencia') {
            if (!comprobante) {
                return res.status(400).json({ error: 'Debes adjuntar el comprobante para transferencias.' });
            }
            comprobante_url = `/uploads/${comprobante.filename}`;
            estado_pago = 'pendiente'; 
        } else if (metodo_pago === 'efectivo') {
            estado_pago = 'por confirmar'; 
        } else {
            return res.status(400).json({ error: 'Método de pago no válido.' });
        }

        // 4. INSERTAR EN LA BASE DE DATOS
        const result = await pool.query(
            `INSERT INTO reservas 
            (usuario_id, cancha_id, fecha_reserva, hora_inicio, hora_fin, estado_pago, comprobante_url, metodo_pago) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [usuario_id, cancha_id, fecha_reserva, hora_inicio, hora_fin, estado_pago, comprobante_url, metodo_pago]
        );

        res.status(201).json({
            mensaje: 'Reserva procesada con éxito.',
            reserva: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getTodasLasReservas = async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.fecha_reserva, r.hora_inicio, r.hora_fin, r.estado_pago, r.comprobante_url, r.creado_en, r.metodo_pago,
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

const actualizarEstadoReserva = async (req, res) => {
    try {
        const { id } = req.params; 
        const { estado_pago } = req.body; 

        if (!['validado', 'rechazado', 'pendiente', 'por confirmar'].includes(estado_pago)) {
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

// Obtener horarios ocupados para una cancha y fecha específica
const getHorariosOcupados = async (req, res) => {
    try {
        const { cancha_id, fecha } = req.params;
        const query = `
            SELECT hora_inicio, hora_fin 
            FROM reservas 
            WHERE cancha_id = $1 AND fecha_reserva = $2 AND estado_pago != 'rechazado'
        `;
        const result = await pool.query(query, [cancha_id, fecha]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error obteniendo disponibilidad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener las reservas del usuario que inició sesión
const getMisReservas = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;
        const query = `
            SELECT r.*, c.nombre AS cancha_nombre 
            FROM reservas r
            JOIN canchas c ON r.cancha_id = c.id
            WHERE r.usuario_id = $1
            ORDER BY r.creado_en DESC
        `;
        const result = await pool.query(query, [usuario_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error obteniendo mis reservas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    crearReserva,
    getTodasLasReservas,
    actualizarEstadoReserva,
    getHorariosOcupados,
    getMisReservas // <- para mis reservas
};