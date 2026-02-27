const pool = require('../db');

const crearReserva = async (req, res) => {
    try {
        // Recibimos los datos del formulario (vendrán del celular)
        // Nota: usuario_id lo quemaremos en 1 por ahora hasta que hagamos el login
        const { usuario_id = 1, cancha_id, fecha_reserva, hora_inicio, hora_fin } = req.body;
        
        // Multer nos deja el archivo subido en req.file
        const comprobante = req.file;

        if (!comprobante) {
            return res.status(400).json({ error: 'Debes adjuntar el comprobante de transferencia' });
        }

        // 1. REGLA DE NEGOCIO: Validar horario general (09:00 a 22:00)
        // Convertimos las horas a números para comparar fácilmente (ej. "09:00" -> 9)
        const horaInicioNum = parseInt(hora_inicio.split(':')[0]);
        const horaFinNum = parseInt(hora_fin.split(':')[0]);

        // Dejamos una pequeña puerta trasera lógica: Si es antes de las 9, el admin tendría que aprobarlo manual después,
        // pero por regla estricta del sistema validamos el horario base:
        if (horaInicioNum < 9 || horaFinNum > 22) {
            return res.status(400).json({ error: 'El horario de atención regular es de 09:00 a 22:00.' });
        }

        // 2. Guardar la ruta de la imagen
        // Generamos la ruta que se guardará en PostgreSQL
        const comprobante_url = `/uploads/${comprobante.filename}`;

        // 3. Insertar en la Base de Datos
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

module.exports = {
    crearReserva
};