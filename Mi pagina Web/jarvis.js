const https = require('https');

const TOKEN   = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function send(text) {
    if (!TOKEN || !CHAT_ID) return;
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    const req = https.request({
        hostname: 'api.telegram.org',
        path: `/bot${TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    });
    req.on('error', e => console.error('[Jarvis] Error Telegram:', e.message));
    req.write(body);
    req.end();
}

function notifyLead(lead) {
    send(
        `🔔 <b>NUEVO LEAD — Loop-Landing</b>\n\n` +
        `👤 <b>${lead.name}</b>\n` +
        `📱 ${lead.whatsapp}\n` +
        `✉️ ${lead.email}\n` +
        `🛠 ${lead.service}\n` +
        `💰 ${lead.budget}\n` +
        (lead.deadline && lead.deadline !== '—' ? `📅 ${lead.deadline}\n` : '') +
        `\n📝 ${lead.description}`
    );
}

function notifyTicket(ticket) {
    send(
        `🎫 <b>NUEVO TICKET — Loop-Landing</b>\n\n` +
        `👤 <b>${ticket.user}</b>\n` +
        `✉️ ${ticket.email}\n` +
        `📌 <b>${ticket.subject}</b>\n\n` +
        `${ticket.message}`
    );
}

module.exports = { notifyLead, notifyTicket };
