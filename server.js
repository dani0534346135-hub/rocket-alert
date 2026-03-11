const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors()); // מאפשר לכל דף HTML לגשת לנתונים

app.get('/alerts', async (req, res) => {
    try {
        // פנייה ישירה לשרת פיקוד העורף
        const response = await axios.get('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json', {
            headers: {
                'Referer': 'https://www.oref.org.il/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send("שגיאה במשיכת נתונים");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
