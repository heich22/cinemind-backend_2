const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Ключи
const KP_KEY = process.env.KP_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;
const OMDB_KEY = process.env.OMDB_KEY;

// 1. Поиск через Кинопоиск
app.get('/api/search', async (req, res) => {
    const { keyword } = req.query;
    try {
        const response = await axios.get(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(keyword)}`, {
            headers: { 'X-API-KEY': KP_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'KP Error' });
    }
});

// 2. Рейтинги IMDb и Tomatoes (OMDb)
app.get('/api/ratings', async (req, res) => {
    const { title } = req.query;
    if (!OMDB_KEY) return res.json({ imdb: 'N/A', rt: 'N/A' });
    try {
        const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_KEY}`);
        const rt = (response.data.Ratings || []).find(r => r.Source === "Rotten Tomatoes");
        res.json({
            imdb: response.data.imdbRating || 'N/A',
            rt: rt ? rt.Value : 'N/A'
        });
    } catch (e) { res.json({ imdb: 'N/A', rt: 'N/A' }); }
});

// 3. Исправленный Gemini (v1 stable)
app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;
    // URL изменен на v1 для стабильности
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: `Ты эксперт CineMind. Проанализируй фильм "${movieTitle}" для пользователя, который любит: ${userHistory}. Дай вердикт.` }] }]
        });
        res.json({ analysis: response.data.candidates[0].content.parts[0].text });
    } catch (error) {
        console.error('Gemini Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'AI Error' });
    }
});

app.listen(PORT, () => console.log(`Server live on ${PORT}`));
