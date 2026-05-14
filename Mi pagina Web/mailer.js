const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER || 'garettjohan12@gmail.com',
        pass: process.env.MAIL_PASS || ''
    }
});

async function notifyNewLead({ name, email, whatsapp, service, budget, description }) {
    await transporter.sendMail({
        from: `"Mi Web Pro" <${process.env.MAIL_USER || 'garettjohan12@gmail.com'}>`,
        to: 'garettjohan12@gmail.com',
        subject: `🔥 Nuevo lead: ${name} — ${service}`,
        html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:#111;padding:28px 32px;border-bottom:1px solid #222;">
                <h2 style="margin:0;font-size:1.3rem;">🔥 Nuevo lead recibido</h2>
            </div>
            <div style="padding:28px 32px;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="color:#666;padding:8px 0;font-size:0.85rem;width:130px;">Nombre</td><td style="color:#fff;font-weight:600;">${name}</td></tr>
                    <tr><td style="color:#666;padding:8px 0;font-size:0.85rem;">Email</td><td style="color:#fff;">${email}</td></tr>
                    <tr><td style="color:#666;padding:8px 0;font-size:0.85rem;">WhatsApp</td><td style="color:#fff;">${whatsapp}</td></tr>
                    <tr><td style="color:#666;padding:8px 0;font-size:0.85rem;">Servicio</td><td style="color:#fff;">${service}</td></tr>
                    <tr><td style="color:#666;padding:8px 0;font-size:0.85rem;">Presupuesto</td><td style="color:#fff;">${budget}</td></tr>
                </table>
                <div style="margin-top:20px;padding:16px;background:#181818;border-radius:8px;border-left:3px solid #444;">
                    <p style="margin:0;color:#aaa;font-size:0.9rem;">${description}</p>
                </div>
                <a href="https://wa.me/${whatsapp.replace(/\D/g,'')}?text=Hola%20${encodeURIComponent(name)}%2C%20vi%20tu%20solicitud%20de%20cotizaci%C3%B3n."
                   style="display:inline-block;margin-top:24px;padding:12px 24px;background:#25d366;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:0.9rem;">
                    📲 Responder por WhatsApp
                </a>
            </div>
        </div>`
    });
}

async function notifyNewContact({ name, email, subject, message }) {
    await transporter.sendMail({
        from: `"Mi Web Pro" <${process.env.MAIL_USER || 'garettjohan12@gmail.com'}>`,
        to: 'garettjohan12@gmail.com',
        subject: `✉️ Nuevo mensaje: ${subject}`,
        html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:#111;padding:28px 32px;border-bottom:1px solid #222;">
                <h2 style="margin:0;font-size:1.3rem;">✉️ Nuevo mensaje de contacto</h2>
            </div>
            <div style="padding:28px 32px;">
                <p style="color:#666;font-size:0.85rem;margin:0 0 4px;">De: <strong style="color:#fff;">${name}</strong> · ${email}</p>
                <p style="color:#fff;font-weight:600;margin:16px 0 8px;">${subject}</p>
                <p style="color:#aaa;line-height:1.7;margin:0;">${message}</p>
            </div>
        </div>`
    });
}

module.exports = { notifyNewLead, notifyNewContact };
