const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const registrarUsuario = async (req, res) => {
    try {
        const { nombre, nickname, email, telefono, password, rol = 'cliente' } = req.body;

        const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO usuarios (nombre, nickname, email, telefono, password, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, nickname, email, rol',
            [nombre, nickname, email, telefono, hashedPassword, rol]
        );

        res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuario: result.rows[0] });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

        const usuario = result.rows[0];

        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

        // Guardamos el nickname en el Token
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol, nickname: usuario.nickname },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            mensaje: 'Login exitoso', token,
            usuario: { id: usuario.id, nombre: usuario.nombre, nickname: usuario.nickname, rol: usuario.rol }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { registrarUsuario, loginUsuario };