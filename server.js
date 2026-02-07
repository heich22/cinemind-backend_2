const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// API Ключи
const KP_KEY = process.env.KP_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const OMDB_KEY = process.env.OMDB_KEY;

// 1. Поиск фильмов (Кинопоиск)
app.get('/api/search', async (req, res) => {
    const { keyword } = req.query;
    try {
        const response = await axios.get(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(keyword)}`, {
            headers: { 'X-API-KEY': KP_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка Кинопоиска' });
    }
});

// 2. Рейтинги IMDb и Rotten Tomatoes (OMDb)
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

// 3. Анализ DeepSeek (Вместо Gemini)
app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;

    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "Ты — кинокритик CineMind. Пиши кратко, честно и только на русском языке. Используй 2 небольших абзаца." },
                { role: "user", content: `Проанализируй фильм "${movieTitle}". Контекст: ${context}. Пользователь любит: ${userHistory}. Стоит ли смотреть?` }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ analysis: response.data.choices[0].message.content });
    } catch (error) {
        console.error('DeepSeek Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'DeepSeek Offline' });
    }
});

app.listen(PORT, () => console.log(`CineMind Server Live on ${PORT}`));
