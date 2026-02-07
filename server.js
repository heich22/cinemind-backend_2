const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

const KP_KEY = process.env.KP_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;
const OMDB_KEY = process.env.OMDB_KEY;

// 1. Поиск Кинопоиск
app.get('/api/search', async (req, res) => {
    const { keyword } = req.query;
    try {
        const response = await axios.get(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(keyword)}`, {
            headers: { 'X-API-KEY': KP_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});

// 2. Рейтинги OMDb (IMDb + Rotten Tomatoes)
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

// 3. ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ GEMINI (v1beta стабильный путь)
app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;
    
    // ВНИМАНИЕ: Используем v1beta/models/gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    
    const payload = {
        contents: [{
            parts: [{
                text: `Ты эксперт CineMind. Проанализируй фильм "${movieTitle}". Контекст: ${context}. Пользователь любит: ${userHistory}. Дай краткий вердикт.`
            }]
        }]
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.candidates && response.data.candidates[0].content) {
            res.json({ analysis: response.data.candidates[0].content.parts[0].text });
        } else {
            res.status(500).json({ error: 'Пустой ответ ИИ' });
        }
    } catch (error) {
        console.error('Gemini Error Details:', error.response?.data || error.message);
        res.status(500).json({ error: 'AI Error', details: error.response?.data || error.message });
    }
});

app.listen(PORT, () => console.log(`CineMind Server live on port ${PORT}`));
