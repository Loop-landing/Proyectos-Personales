const cron = require('node-cron');
const fs   = require('fs');
const path = require('path');
const { notifyNewLead } = require('./mailer');

const LEADS_PATH = path.join(__dirname, 'views', 'leads.json');

function getLeads() {
  try {
    const data = fs.readFileSync(LEADS_PATH, 'utf-8');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

// Cada mañana a las 9am revisa leads sin atender por más de 48h
cron.schedule('0 9 * * *', async () => {
  const leads = getLeads();
  const now   = Date.now();
  const MS48H = 48 * 60 * 60 * 1000;

  const pendientes = leads.filter(l => {
    if (l.status !== 'Nuevo') return false;
    const created = new Date(l.date).getTime();
    return (now - created) > MS48H;
  });

  for (const lead of pendientes) {
    try {
      await notifyNewLead({
        name: `⚠️ RECORDATORIO — ${lead.name}`,
        email: lead.email,
        whatsapp: lead.whatsapp || '',
        service: lead.service,
        budget: lead.budget,
        description: `Este lead lleva más de 48h sin ser contactado.\n\n${lead.description}`
      });
      console.log(`Recordatorio enviado para lead: ${lead.name}`);
    } catch (e) {
      console.error('Cron mailer error:', e);
    }
  }
});

console.log('Cron de recordatorios activo (9am diario)');
