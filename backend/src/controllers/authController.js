const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. Registro de Usuario
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, telefono, password, rol = 'cliente' } = req.body;

        // Verificamos si el correo ya existe
        const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        // Encriptamos la contraseña (el número 10 es el "salt rounds", nivel de seguridad)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertamos en la BD
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, telefono, password, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, rol',
            [nombre, email, telefono, hashedPassword, rol]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito',
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 2. Inicio de Sesión (Login)
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscamos al usuario por su email
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        // Comparamos la contraseña en texto plano con el hash guardado
        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generamos el Token JWT (El pase VIP)
        // Guardamos el ID y el ROL dentro del token para saber quién es en futuras peticiones
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // El token expira en 7 días
        );

        res.status(200).json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    registrarUsuario,
    loginUsuario
};