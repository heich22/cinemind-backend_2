const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Порт для Render
const PORT = process.env.PORT || 10000;

// Ключи из переменных окружения
const KP_KEY = process.env.KP_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;
const OMDB_KEY = process.env.OMDB_KEY;

// 1. Поиск фильмов через Кинопоиск
app.get('/api/search', async (req, res) => {
    const { keyword } = req.query;
    try {
        const response = await axios.get(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(keyword)}`, {
            headers: { 'X-API-KEY': KP_KEY }
        });
        // Возвращаем данные как есть, фронтенд сам разберется с массивом films
        res.json(response.data);
    } catch (error) {
        console.error('Ошибка Кинопоиска:', error.message);
        res.status(500).json({ error: 'Ошибка при поиске' });
    }
});

// 2. Получение рейтингов IMDb и Rotten Tomatoes (через OMDb)
app.get('/api/ratings', async (req, res) => {
    const { title } = req.query;
    if (!OMDB_KEY) return res.json({ imdb: 'N/A', tomatoes: 'N/A' });

    try {
        const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_KEY}`);
        
        const ratings = {
            imdb: response.data.imdbRating || 'N/A',
            tomatoes: 'N/A'
        };

        if (response.data.Ratings) {
            const rt = response.data.Ratings.find(r => r.Source === "Rotten Tomatoes");
            if (rt) ratings.tomatoes = rt.Value;
        }

        res.json(ratings);
    } catch (error) {
        console.error('Ошибка OMDb:', error.message);
        res.json({ imdb: 'N/A', tomatoes: 'N/A' });
    }
});

// 3. Исправленный анализ Gemini (v1 stable эндпоинт)
app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;

    // Используем эндпоинт v1, он стабильнее для generateContent
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const promptText = `Ты — кинокритик CineMind. Проанализируй фильм "${movieTitle}". 
    Контекст фильма: ${context}. 
    Предпочтения пользователя: ${userHistory}.
    Напиши кратко в 2 абзаца: почему стоит посмотреть и вердикт по отзывам.`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: promptText }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.candidates && response.data.candidates[0].content) {
            const aiResult = response.data.candidates[0].content.parts[0].text;
            res.json({ analysis: aiResult });
        } else {
            throw new Error('Empty Gemini response');
        }
    } catch (error) {
        console.error('Gemini Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Ошибка нейросети', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`CineMind Server running on port ${PORT}`);
});
