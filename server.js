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

// Поиск фильмов (Кинопоиск)
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

// Рейтинги (OMDb: IMDb + Rotten Tomatoes)
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

// АНАЛИЗ AI (Исправленный путь)
app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;
    
    // САМЫЙ СТАБИЛЬНЫЙ URL: v1beta + models + суффикс
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: `Ты эксперт CineMind. Проанализируй фильм "${movieTitle}". Контекст: ${context}. Пользователь любит: ${userHistory}. Дай краткий вердикт.` }] }]
        });
        res.json({ analysis: response.data.candidates[0].content.parts[0].text });
    } catch (error) {
        console.error('Gemini Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'AI Error', details: error.response?.data || error.message });
    }
});

app.listen(PORT, () => console.log(`CineMind Server Live` flocking on ${PORT}`));
