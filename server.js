const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());

// --- הגדרות וואטסאפ ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('סרוק את הקוד ב-Logs כדי לחבר את הוואטסאפ!');
});

client.on('ready', () => {
    console.log('הוואטסאפ מחובר! המערכת סורקת התרעות ברקע...');
});

client.initialize();

// --- הגדרות מעקב ---
const MY_CITY = "בת ים"; // שנה לעיר שאתה רוצה לעקוב אחריה
const MY_NUMBER = "972501234567@c.us"; // שנה למספר שלך (מדינה + מספר בלי 0)
let lastAlertId = ""; // מונע שליחת הודעות כפולות על אותה אזעקה

// פונקציה לשליחת וואטסאפ
async function sendWhatsappAlert(title, city) {
    let message = "";
    if (title.includes("טילים") || title.includes("רקטות")) {
        message = `🚨 *אזעקת טילים ב${city}!* \nחובה להיכנס למקלט מיד. 🏃💨`;
    } else {
        message = `⚠️ *התרעת שברי טילים ב${city}* \nניתן להישאר בבית, להתרחק מחלונות. 🏠🛡️`;
    }

    try {
        await client.sendMessage(MY_NUMBER, message);
        console.log(`הודעה נשלחה בהצלחה ל-${MY_NUMBER}`);
    } catch (err) {
        console.error("שגיאה בשליחת הודעה:", err);
    }
}

// --- מנוע הסריקה האוטומטי (רץ כל 3 שניות) ---
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
            
            // בודק אם זו התרעה חדשה (לפי ה-ID) ואם היא בעיר שלי
            if (latest.id !== lastAlertId && latest.data.includes(MY_CITY)) {
                lastAlertId = latest.id; // מעדכן שטיפלנו בהתרעה הזו
                await sendWhatsappAlert(latest.title, MY_CITY);
            }
        }
    } catch (error) {
        // בדרך כלל שגיאות התחברות זמניות, אין צורך להפסיק את השרת
        console.log("סורק נתונים...");
    }
}

// הפעלת הסורק כל 3 שניות
setInterval(backgroundScanner, 3000);

// --- נתיבי API (בשביל אתר ה-HTML שלך) ---
app.get('/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json', {
            headers: { 'Referer': 'https://www.oref.org.il/' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "שגיאה במשיכת התרעות" });
    }
});

app.get('/cities', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/Shared/Ajax/GetCities.aspx', {
            headers: { 'Referer': 'https://www.oref.org.il/' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "שגיאה בטעינת ערים" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is live on port ${PORT}`));
