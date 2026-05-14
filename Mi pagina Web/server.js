const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const jarvis = require('./jarvis');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('trust proxy', 1);
app.use(session({
    store: new FileStore({ path: './sessions' }),
    secret: process.env.SESSION_SECRET || 'mi_secreto_saas_pro',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const USERS_PATH = path.join(__dirname, 'views', 'users.json');

const getUsers = () => {
    try {
        if (!fs.existsSync(USERS_PATH)) return [];
        const data = fs.readFileSync(USERS_PATH, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error leyendo usuarios:', e);
        return [];
    }
};

const getData = (filename) => {
    try {
        const filePath = path.join(__dirname, 'views', filename);
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Error leyendo ${filename}:`, e);
        return [];
    }
};

const saveUsers = (users) => {
    try {
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error guardando users:', e);
    }
};

const saveData = (filename, data) => {
    try {
        const filePath = path.join(__dirname, 'views', filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`Error guardando ${filename}:`, e);
    }
};

const { saveRegistro, saveContacto, saveLead, saveTicket, saveProgresoCliente } = require('./sheets');
const { notifyNewLead, notifyNewContact } = require('./mailer');
const multer = require('multer');
const PDFDocument = require('pdfkit');
require('./cron');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, req.body.userEmail || 'general');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/login');
};

// Notificaciones disponibles en todos los templates
app.use((req, res, next) => {
    if (req.session.user) {
        const tickets = getData('tickets.json');
        res.locals.notifCount = tickets.filter(t =>
            t.email === req.session.user.email && t.adminResponse && !t.seenByUser
        ).length;
    } else {
        res.locals.notifCount = 0;
    }
    next();
});

// ── Rutas públicas ────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    const stats = getData('stats.json');
    stats.visits = (stats.visits || 0) + 1;
    saveData('stats.json', stats);
    res.render('index', { user: req.session.user || null, visits: stats.visits });
});

app.get('/precios', (req, res) => {
    res.render('precios', { user: req.session.user || null });
});

app.get('/portafolio', (req, res) => {
    const projects = getData('projects.json');
    res.render('portafolio', { projects, user: req.session.user || null });
});

app.get('/contacto', (req, res) => {
    res.render('contacto', { user: req.session.user || null, sent: false });
});

app.post('/contacto', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const contacts = getData('contacts.json');
        contacts.push({
            id: `CNT-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            name, email, subject, message,
            read: false
        });
        saveData('contacts.json', contacts);
        saveContacto({ name, email, subject, message }).catch(e => console.error('Sheets contacto:', e));
        notifyNewContact({ name, email, subject, message }).catch(e => console.error('Mailer contacto:', e));
    } catch (e) {
        console.error('Error /contacto POST:', e);
    }
    res.render('contacto', { user: req.session.user || null, sent: true });
});

app.post('/cotizacion', async (req, res) => {
    try {
        const { name, whatsapp, email, service, budget, deadline, description } = req.body;
        const leads = getData('leads.json');
        leads.push({
            id: `LEAD-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            name, whatsapp, email, service, budget,
            deadline: deadline || '—',
            description,
            status: 'Nuevo'
        });
        saveData('leads.json', leads);
        saveLead({ name, whatsapp, email, service, budget, deadline, description })
            .catch(e => console.error('Sheets lead:', e));
        notifyNewLead({ name, whatsapp, email, service, budget, description })
            .catch(e => console.error('Mailer lead:', e));
        jarvis.notifyLead({ name, whatsapp, email, service, budget, deadline: deadline || '—', description });
    } catch (e) {
        console.error('Error /cotizacion POST:', e);
    }
    res.redirect('/?ok=1#cotizacion');
});

// ── Auth ──────────────────────────────────────────────────────────────────────

app.get('/register', (req, res) => res.render('register', { error: null }));
app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = {
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company || '',
            projectType: user.projectType || '',
            whatsapp: user.whatsapp || ''
        };
        return res.redirect('/dashboard');
    }
    res.render('login', { error: 'Credenciales inválidas' });
});

app.post('/register', async (req, res) => {
    try {
        const { name, email, password, company, projectType } = req.body;
        if (!name || !email || !password) {
            return res.render('register', { error: 'Completa todos los campos requeridos' });
        }
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            return res.render('register', { error: 'El usuario ya existe' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ name, email, company, projectType, password: hashedPassword, role: 'user' });
        saveUsers(users);
        saveRegistro({ name, email, company, projectType }).catch(e => console.error('Sheets registro:', e));
        res.redirect('/login');
    } catch (e) {
        console.error('Error /register POST:', e);
        res.render('register', { error: 'Error al registrar. Intenta de nuevo.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ── Rutas privadas ────────────────────────────────────────────────────────────

app.get('/dashboard', isAuthenticated, (req, res) => {
    const tickets = getData('tickets.json');
    const userTickets = tickets.filter(t => t.email === req.session.user.email);
    const ticketCount = userTickets.filter(t => t.status === 'Abierto').length;
    const newResponses = userTickets.filter(t => t.adminResponse && !t.seenByUser);
    const allUsers = getUsers();
    const fullUser = allUsers.find(u => u.email === req.session.user.email);
    res.render('dashboard', {
        user: req.session.user,
        ticketCount,
        newResponses,
        projectProgress: fullUser?.projectProgress ?? 0,
        isDelayed: fullUser?.isDelayed ?? false
    });
});

app.get('/tickets', isAuthenticated, (req, res) => {
    let tickets = getData('tickets.json');
    tickets = tickets.map(t => {
        if (t.email === req.session.user.email && t.adminResponse && !t.seenByUser) {
            return { ...t, seenByUser: true };
        }
        return t;
    });
    saveData('tickets.json', tickets);
    const userTickets = tickets.filter(t => t.email === req.session.user.email);
    res.render('tickets', { tickets: userTickets, user: req.session.user });
});

app.post('/tickets', isAuthenticated, (req, res) => {
    const { subject, message } = req.body;
    const tickets = getData('tickets.json');
    const newTicket = {
        id: `TK-${Date.now()}`,
        user: req.session.user.name,
        email: req.session.user.email,
        subject,
        message,
        status: 'Abierto',
        date: new Date().toISOString().split('T')[0],
        adminResponse: null,
        seenByUser: true
    };
    tickets.push(newTicket);
    saveData('tickets.json', tickets);
    saveTicket({ user: newTicket.user, email: newTicket.email, subject, message, ticketId: newTicket.id })
        .catch(e => console.error('Sheets ticket:', e));
    jarvis.notifyTicket({ user: newTicket.user, email: newTicket.email, subject, message });
    res.redirect('/tickets');
});

app.get('/perfil', isAuthenticated, (req, res) => {
    res.render('perfil', { user: req.session.user, saved: false, error: null });
});

app.post('/perfil', isAuthenticated, async (req, res) => {
    const { name, company, projectType, whatsapp, newPassword } = req.body;
    const users = getUsers();
    const idx = users.findIndex(u => u.email === req.session.user.email);
    if (idx === -1) {
        return res.render('perfil', { user: req.session.user, saved: false, error: 'Usuario no encontrado' });
    }
    users[idx].name = name;
    users[idx].company = company;
    users[idx].projectType = projectType;
    users[idx].whatsapp = whatsapp;
    if (newPassword && newPassword.length >= 6) {
        users[idx].password = await bcrypt.hash(newPassword, 10);
    }
    saveUsers(users);
    req.session.user = { ...req.session.user, name, company, projectType, whatsapp };
    res.render('perfil', { user: req.session.user, saved: true, error: null });
});

app.get('/clients', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Acceso denegado');
    const clients = getData('clients.json');
    res.render('clients', { clients, user: req.session.user });
});

app.get('/admin', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Acceso denegado');
    const allUsers = getUsers();
    const tickets = getData('tickets.json');
    const stats = getData('stats.json');
    const leads = getData('leads.json');
    const contacts = getData('contacts.json');
    res.render('admin', { users: allUsers, tickets, stats, leads, contacts });
});

app.post('/admin/tickets/respond', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Acceso denegado');
    const { ticketId, response } = req.body;
    const tickets = getData('tickets.json');
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.adminResponse = response;
        ticket.status = 'Cerrado';
        ticket.seenByUser = false;
    }
    saveData('tickets.json', tickets);
    res.redirect('/admin');
});

app.post('/admin/leads/status', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Acceso denegado');
    const { leadId, status } = req.body;
    const leads = getData('leads.json');
    const lead = leads.find(l => l.id === leadId);
    if (lead) lead.status = status;
    saveData('leads.json', leads);
    res.redirect('/admin#leads');
});

app.post('/admin/users/progress', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Acceso denegado');
    const { email, progress, isDelayed } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (user) {
        user.projectProgress = Math.min(100, Math.max(0, parseInt(progress) || 0));
        user.isDelayed = isDelayed === 'true';
        saveProgresoCliente({
            email: user.email,
            name: user.name,
            company: user.company,
            progress: user.projectProgress,
            isDelayed: user.isDelayed
        }).catch(e => console.error('Sheets progreso:', e));
    }
    saveUsers(users);
    res.redirect('/admin#clientes');
});

// ── Subir archivo a cliente ───────────────────────────────────────────────────
app.post('/admin/upload', isAuthenticated, (req, res, next) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Acceso denegado');
    next();
}, upload.single('file'), (req, res) => {
    res.redirect('/admin#clientes');
});

// ── Descargar archivos del cliente ────────────────────────────────────────────
app.get('/mis-archivos', isAuthenticated, (req, res) => {
    const dir = path.join(uploadDir, req.session.user.email);
    let files = [];
    if (fs.existsSync(dir)) {
        files = fs.readdirSync(dir).map(f => ({
            name: f.replace(/^\d+-/, ''),
            raw: f,
            url: `/archivos/${encodeURIComponent(req.session.user.email)}/${encodeURIComponent(f)}`
        }));
    }
    res.render('mis-archivos', { user: req.session.user, files });
});

app.get('/archivos/:email/:file', isAuthenticated, (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const file  = decodeURIComponent(req.params.file);
    if (req.session.user.role !== 'admin' && req.session.user.email !== email)
        return res.status(403).send('Acceso denegado');
    const filePath = path.join(uploadDir, email, file);
    if (!fs.existsSync(filePath)) return res.status(404).send('Archivo no encontrado');
    res.download(filePath, file.replace(/^\d+-/, ''));
});

// ── Generar factura PDF ───────────────────────────────────────────────────────
app.get('/admin/factura/:email', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Acceso denegado');
    const users  = getUsers();
    const client = users.find(u => u.email === req.params.email);
    if (!client) return res.status(404).send('Cliente no encontrado');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${client.name.replace(/\s/g,'-')}.pdf`);
    doc.pipe(res);

    doc.fontSize(22).font('Helvetica-Bold').text('GARETT BARRANTES', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#888').text('Desarrollo Digital · Costa Rica', 50, 78);
    doc.fillColor('#888').text('garettjohan12@gmail.com  ·  +506 6314-4171', 50, 92);

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#333').stroke();

    doc.fillColor('#fff').fontSize(14).font('Helvetica-Bold').text('FACTURA DE SERVICIO', 50, 130);
    const inv = `INV-${Date.now()}`;
    doc.fontSize(10).font('Helvetica').fillColor('#aaa').text(`N° ${inv}`, 50, 150);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CR')}`, 50, 165);

    doc.fillColor('#fff').fontSize(12).font('Helvetica-Bold').text('Facturado a:', 50, 200);
    doc.fontSize(10).font('Helvetica').fillColor('#ccc')
        .text(client.name, 50, 218)
        .text(client.email, 50, 233)
        .text(client.company || '', 50, 248);

    doc.moveTo(50, 280).lineTo(545, 280).strokeColor('#333').stroke();
    doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold')
        .text('Descripción', 50, 292).text('Monto', 460, 292);
    doc.moveTo(50, 308).lineTo(545, 308).strokeColor('#333').stroke();

    doc.fillColor('#ccc').font('Helvetica')
        .text(client.projectType || 'Servicio de desarrollo web', 50, 320)
        .text('$___________', 460, 320);

    doc.moveTo(50, 350).lineTo(545, 350).strokeColor('#333').stroke();
    doc.fillColor('#fff').font('Helvetica-Bold').text('TOTAL:', 380, 365).text('$___________', 460, 365);

    doc.fillColor('#555').fontSize(9).font('Helvetica')
        .text('Gracias por confiar en Garett Barrantes — Desarrollo Digital.', 50, 680, { align: 'center', width: 495 });

    doc.end();
});

app.post('/admin/users/delete', isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'admin') return res.status(403).send('Acceso denegado');
    const { email } = req.body;
    const users = getUsers().filter(u => u.email !== email);
    saveUsers(users);
    res.redirect('/admin#clientes');
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('404', { user: req.session?.user || null });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).send('Error interno del servidor. Por favor intenta de nuevo.');
});

app.listen(PORT, () => {
    console.log(`Servidor de Mi Web Pro corriendo en http://localhost:${PORT}`);
});
