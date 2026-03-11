const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const app = express();
app.use(cors());

// --- פונקציה למציאת נתיב הכרום ב-Render ---
function getChromePath() {
    if (fs.existsSync('/usr/bin/google-chrome-stable')) return '/usr/bin/google-chrome-stable';
    const renderChrome = '/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.66/chrome-linux64/chrome';
    if (fs.existsSync(renderChrome)) return renderChrome;
    return null;
}

// --- הגדרות וואטסאפ ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
        executablePath: getChromePath() || undefined
    }
});

client.on('qr', (qr) => {
    console.log('--- סרוק את קוד ה-QR למטה ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('המערכת מחוברת לוואטסאפ וסורקת התרעות!');
});

client.initialize();

// --- הגדרות אישיות ---
const MY_CITY = "בת ים"; 
const MY_NUMBER = "972501234567@c.us"; // <<< וודא שהמספר שלך כאן תקין (972...)
let lastAlertId = "";

async function sendWhatsappAlert(title, city) {
    let message = (title.includes("טילים") || title.includes("רקטות")) 
        ? `🚨 *אזעקת טילים ב${city}!* \nחובה להיכנס למקלט מיד.`
        : `⚠️ *התרעת שברי טילים ב${city}* \nניתן להישאר בבית, להתרחק מחלונות.`;

    try {
        await client.sendMessage(MY_NUMBER, message);
        console.log(`הודעה נשלחה בהצלחה ל-${MY_NUMBER}`);
    } catch (err) {
        console.error("שגיאה בשליחת וואטסאפ:", err);
    }
}

async function backgroundScanner() {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json', {
            headers: {
                'Referer': 'https://www.oref.org.il/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const data = response.data;
        if (data && data.length > 0) {
            const latest = data[0];
            if (latest.id !== lastAlertId && latest.data.includes(MY_CITY)) {
                lastAlertId = latest.id;
                await sendWhatsappAlert(latest.title, MY_CITY);
            }
        }
    } catch (error) {}
}

// סריקה כל 3 שניות
setInterval(backgroundScanner, 3000);

// --- נתיבים (Routes) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/cities', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/Shared/Ajax/GetCities.aspx', { headers: { 'Referer': 'https://www.oref.org.il/' } });
        res.json(response.data);
    } catch (error) { res.status(500).send(error); }
});

app.get('/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json', { headers: { 'Referer': 'https://www.oref.org.il/' } });
        res.json(response.data);
    } catch (error) { res.status(500).send(error); }
});

// שימוש בפורט 10000 עבור Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
