const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());

// --- הגדרות וואטסאפ ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/google-chrome-stable' // מוסיף את הנתיב לדפדפן בשרת
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

// --- הגדרות אישיות (שנה כאן) ---
const MY_CITY = "בת ים"; 
const MY_NUMBER = "972501234567@c.us"; // <<< שים את המספר שלך כאן (מדינה + מספר בלי 0)
let lastAlertId = "";

// פונקציה לשליחת וואטסאפ
async function sendWhatsappAlert(title, city) {
    let message = "";
    if (title.includes("טילים") || title.includes("רקטות")) {
        message = `🚨 *אזעקת טילים ב${city}!* \nחובה להיכנס למקלט מיד.`;
    } else {
        message = `⚠️ *התרעת שברי טילים ב${city}* \nניתן להישאר בבית, להתרחק מחלונות.`;
    }

    try {
        await client.sendMessage(MY_NUMBER, message);
        console.log(`הודעה נשלחה בהצלחה ל-${MY_NUMBER}`);
    } catch (err) {
        console.error("שגיאה בשליחת וואטסאפ:", err);
    }
}

// --- מנוע סריקה אוטומטי (כל 3 שניות) ---
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
    } catch (error) {
        // התעלמות משגיאות רשת זמניות
    }
}

setInterval(backgroundScanner, 3000);

// --- נתיבים (Routes) ---

// מציג את דף הבית (index.html) כשנכנסים לכתובת של Render
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// מספק את רשימת הערים ל-HTML
app.get('/cities', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/Shared/Ajax/GetCities.aspx', {
            headers: { 'Referer': 'https://www.oref.org.il/' }
        });
        res.json(response.data);
    } catch (error) { res.status(500).send(error); }
});

// מספק את ההתרעות ל-HTML
app.get('/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json', {
            headers: { 'Referer': 'https://www.oref.org.il/' }
        });
        res.json(response.data);
    } catch (error) { res.status(500).send(error); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
