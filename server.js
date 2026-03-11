const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// נתיב לקבלת התרעות בזמן אמת
app.get('/alerts', async (req, res) => {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json', {
            headers: {
                'Referer': 'https://www.oref.org.il/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "שגיאה במשיכת התרעות" });
    }
});

// נתיב לקבלת רשימת כל ערי ישראל
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
