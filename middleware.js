const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_dev';

const SALT_ROUNDS = 10;

// --- Conexión a Supabase ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://ouqpeojilykkrmatijxp.supabase.co'; // <-- PEGA TU URL AQUÍ
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91cXBlb2ppbHlra3JtYXRpanhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTc3NjgsImV4cCI6MjA4NTU3Mzc2OH0.cI5AV0N-F1B2tqvBUKgOz0T2XCF3i56K23spLb3sHHY'; // <-- PEGA TU CLAVE ANON AQUÍ
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Datos simulados para funcionalidades aún no migradas ---


const mockData = {
    achievements: [],
    cosmetics: [{ id: 1, name: 'Cool Hat', price: 100 }],
    chatMessages: [{ id: 1, userId: 1, message: 'Hello world!' }],
    launchMessages: [{ id: 1, userId: 1, message: 'First launch!' }],
    downloads: [{ download_id: 1, name: 'Game Client v1.0', url: '/downloads/client.zip' }],
    gchatHistory: { '1-3': [{ senderId: 1, recipient_id: 3, message: 'Hey!' }] },
    shopItems: [{ id: 1, name: 'Gold Sword', price: 500 }],
    news: [
        { id: 1, title: 'Welcome to GLauncher', content: 'We are live!', date: '2023-10-27' },
        { id: 2, title: 'Patch Notes v1.1', content: 'Bug fixes and performance improvements.', date: '2023-11-01' }
    ]
};

/**
 * Middleware to verify if the user is authenticated via JWT.
 */
const loginRequired = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }
        req.user = user;
        next();
    });
};

/**
 * Middleware to verify if the user has admin privileges.
 */
const adminRequired = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Acceso denegado. Usuario no autenticado.' });
    }

    // Verificamos el rol desde la base de datos real para máxima seguridad
    const { data: user, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', req.user.id)
        .single();

    if (error || !user) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user && user.is_admin) {
        return next();
    }

    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
};

/**
 * Middleware for public endpoints (placeholder).
 */
const publicEndpoint = (req, res, next) => {
    next();
};

// --- HTML Generator for Neon Loading ---
const getNeonLoaderHtml = (provider, targetUrl) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conectando con ${provider}...</title>
    <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #050505; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
        .loader-container { position: relative; display: flex; flex-direction: column; align-items: center; }
        .loader { position: relative; width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(45deg, transparent, transparent 40%, #00ff0a); animation: animate 2s linear infinite; }
        .loader::before { content: ''; position: absolute; top: 6px; left: 6px; right: 6px; bottom: 6px; background: #050505; border-radius: 50%; z-index: 1000; }
        .loader::after { content: ''; position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; background: linear-gradient(45deg, transparent, transparent 40%, #00ff0a); border-radius: 50%; z-index: 1; filter: blur(30px); }
        @keyframes animate { 0% { transform: rotate(0deg); filter: hue-rotate(0deg); } 100% { transform: rotate(360deg); filter: hue-rotate(360deg); } }
        h2 { color: #fff; margin-top: 20px; letter-spacing: 2px; text-transform: uppercase; font-size: 1.2rem; z-index: 1001; text-shadow: 0 0 10px #00ff0a; }
    </style>
</head>
<body>
    <div class="loader-container">
        <div class="loader"></div>
        <h2>Redirigiendo a ${provider}</h2>
    </div>
    <script>
        setTimeout(() => {
            window.location.href = '${targetUrl}';
        }, 2500);
    </script>
</body>
</html>
`;

const getSuccessHtml = (token, targetUrl) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Autenticación Exitosa</title>
    <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #050505; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
        .loader-container { position: relative; display: flex; flex-direction: column; align-items: center; }
        .loader { position: relative; width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(45deg, transparent, transparent 40%, #00ff0a); animation: animate 2s linear infinite; }
        .loader::before { content: ''; position: absolute; top: 6px; left: 6px; right: 6px; bottom: 6px; background: #050505; border-radius: 50%; z-index: 1000; }
        .loader::after { content: ''; position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; background: linear-gradient(45deg, transparent, transparent 40%, #00ff0a); border-radius: 50%; z-index: 1; filter: blur(30px); }
        @keyframes animate { 0% { transform: rotate(0deg); filter: hue-rotate(0deg); } 100% { transform: rotate(360deg); filter: hue-rotate(360deg); } }
        h2 { color: #fff; margin-top: 20px; letter-spacing: 2px; text-transform: uppercase; font-size: 1.2rem; z-index: 1001; text-shadow: 0 0 10px #00ff0a; }
        p { color: #aaa; margin-top: 10px; font-size: 0.9rem; z-index: 1001; }
    </style>
</head>
<body>
    <div class="loader-container">
        <div class="loader"></div>
        <h2>¡Autenticación Exitosa!</h2>
        <p>Redirigiendo a GLauncher...</p>
    </div>
    <script>
        setTimeout(() => {
            window.location.href = '${targetUrl}?token=${token}';
        }, 2000);
    </script>
</body>
</html>
`;

// --- RUTAS DEL BACKEND ---

app.get('/', (req, res) => res.json({ message: 'Welcome to GLauncher API' }));
app.get('/api/news', (req, res) => res.json(mockData.news));

app.get('/login/google', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/auth/google/callback`;
    const clientId = '71330665801-6joq0752g7hhhp2hmld06hrfg67rhji0.apps.googleusercontent.com';
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile%20email`;
    res.send(getNeonLoaderHtml('Google', googleUrl));
});

// --- NUEVAS RUTAS DE AUTENTICACIÓN CON SUPABASE ---

app.post('/api/auth/register', async (req, res) => {
    const { username, password, security_code } = req.body;

    if (!username || !password || !security_code) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (security_code.length !== 6) {
        return res.status(400).json({ message: 'El código de seguridad debe tener 6 dígitos.' });
    }

    try {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                username,
                password_hash,
                security_code,
                account_type: 'standard',
                nickname: username
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Código de violación de unicidad (username ya existe)
                return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
            }
            throw error;
        }

        res.status(201).json({ message: 'Usuario registrado con éxito.', userId: data.id });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/api/auth/check_credentials', async (req, res) => {
    const { username, password } = req.body;
    const { data: user, error } = await supabase.from('users').select('id, password_hash').eq('username', username).single();

    if (error || !user || !await bcrypt.compare(password, user.password_hash)) {
        return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    res.status(200).json({ message: 'Credenciales correctas.' });
});

app.get('/auth/google/callback', async (req, res) => {
    // En una implementación real, aquí usarías el `req.query.code` para obtener los datos del usuario de Google.
    // Para esta demostración, simularemos que hemos obtenido un perfil de Google.
    const googleProfile = {
        email: `user_${Date.now()}@gmail.com`,
        name: 'Google User',
    };

    try {
        // 1. Buscar si el usuario ya existe en nuestra base de datos
        let { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('username', googleProfile.email) // Usamos el email como identificador único
            .single();

        // 2. Si el usuario no existe, lo creamos
        if (findError || !user) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    username: googleProfile.email,
                    nickname: googleProfile.name,
                    account_type: 'google',
                    register_complete: 'yes', // Marcamos el registro como completo
                })
                .select()
                .single();
            
            if (createError) throw createError;
            user = newUser;
        }

        // 3. Generar el token JWT para el usuario (ya sea existente o nuevo)
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // 4. Redirigir directamente al dashboard
        const targetUrl = 'https://glauncher.vercel.app/dashboard.html';
        res.send(getSuccessHtml(token, targetUrl));

    } catch (error) {
        console.error('Error en el callback de Google:', error);
        res.status(500).send('<h1>Error durante la autenticación con Google.</h1>');
    }
});

app.get('/login/microsoft', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/auth/microsoft/callback`;
    // En una implementación real, aquí construirías la URL de autenticación de Microsoft
    const microsoftUrl = `/auth/microsoft/callback`; // URL de callback simulada
    res.send(getNeonLoaderHtml('Microsoft', microsoftUrl));
});

app.get('/auth/microsoft/callback', async (req, res) => {
    // SIMULACIÓN: Al igual que con Google, aquí obtendrías el perfil del usuario de Microsoft.
    const microsoftProfile = {
        email: `user_${Date.now()}@outlook.com`,
        name: 'Microsoft User',
    };

    try {
        // 1. Buscar si el usuario ya existe
        let { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('username', microsoftProfile.email)
            .single();

        // 2. Si no existe, crearlo
        if (findError || !user) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    username: microsoftProfile.email,
                    nickname: microsoftProfile.name,
                    account_type: 'microsoft',
                    register_complete: 'yes',
                })
                .select()
                .single();
            
            if (createError) throw createError;
            user = newUser;
        }

        // 3. Generar token
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // 4. Redirigir al dashboard
        const targetUrl = 'https://glauncher.vercel.app/dashboard.html';
        res.send(getSuccessHtml(token, targetUrl));

    } catch (error) {
        console.error('Error en el callback de Microsoft:', error);
        res.status(500).send('<h1>Error durante la autenticación con Microsoft.</h1>');
    }
});

const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/auth/complete_registration', loginRequired, upload.single('profile_picture'), async (req, res) => {
    const { username, password, security_code } = req.body;
    const updateData = { register_complete: 'yes' };

    if (username) updateData.username = username;
    if (security_code) updateData.security_code = security_code;
    if (password) {
        updateData.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', req.user.id)
        .select()
        .single();

    if (error) {
        console.error('Error al completar registro:', error);
        return res.status(500).json({ message: 'No se pudo completar el registro.' });
    }

    const token = jwt.sign({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Registro completado con éxito.', token });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password, security_code } = req.body;

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (userError || !user) {
        return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    if (user.security_code !== security_code) {
        return res.status(401).json({ message: 'El código de seguridad es incorrecto.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// --- NUEVAS RUTAS DE DATOS DE USUARIO PARA EL DASHBOARD ---

app.get('/api/user_info', loginRequired, async (req, res) => {
    const { data: user, error } = await supabase
        .from('users')
        .select('username, nickname, gcoins, play_time_seconds, created_at, account_type, profile_picture_url, role, is_admin, register_complete')
        .eq('id', req.user.id)
        .single();

    if (error || !user) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json(user);
});

app.get('/api/friends', loginRequired, async (req, res) => {
    const userId = req.user.id;

    // Amigos aceptados
    const { data: friends1, error1 } = await supabase.from('friendships').select('user2:users!user_id_2(*)').eq('user_id_1', userId).eq('status', 'accepted');
    const { data: friends2, error2 } = await supabase.from('friendships').select('user1:users!user_id_1(*)').eq('user_id_2', userId).eq('status', 'accepted');

    // Solicitudes pendientes (que yo he recibido)
    const { data: pending, error3 } = await supabase.from('friendships').select('user1:users!user_id_1(*)').eq('user_id_2', userId).eq('status', 'pending');

    // Solicitudes enviadas (que yo he enviado)
    const { data: sent, error4 } = await supabase.from('friendships').select('user2:users!user_id_2(*)').eq('user_id_1', userId).eq('status', 'pending');

    if (error1 || error2 || error3 || error4) {
        console.error('Error fetching friends:', error1 || error2 || error3 || error4);
        return res.status(500).json({ message: 'Error al obtener la lista de amigos.' });
    }

    const friends = [...friends1.map(f => f.user2), ...friends2.map(f => f.user1)];

    res.json({
        friends: friends,
        pending: pending.map(p => p.user1),
        sent: sent.map(s => s.user2)
    });
});

// ... (Aquí irían las otras rutas como /admin, /protected, etc., que ya tienes)


module.exports = { app, loginRequired, adminRequired, publicEndpoint };