const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors()); // Разрешаем запросы с любого домена (твоего фронтенда)
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --- API КЛЮЧИ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ---
const KP_KEY = process.env.KP_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;

// 1. Поиск фильмов через Кинопоиск
app.get('/api/search', async (req, res) => {
    const { keyword } = req.query;
    try {
        const response = await axios.get(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(keyword)}`, {
            headers: { 'X-API-KEY': KP_KEY }
        });
        res.json(response.data);
    } catch (error) {
        console.error('KP Error:', error.message);
        res.status(500).json({ error: 'Ошибка при поиске в Кинопоиске' });
    }
});

// 2. Анализ через Gemini AI
app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    
    const promptText = `Ты эксперт кино CineMind. Пользователь любит: ${userHistory}. 
    Проанализируй фильм "${movieTitle}". Контекст: ${context}. 
    Напиши 2 коротких абзаца: почему подходит пользователю и вердикт по отзывам.`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: promptText }] }]
        });
        const aiText = response.data.candidates[0].content.parts[0].text;
        res.json({ analysis: aiText });
    } catch (error) {
        console.error('Gemini Error:', error.message);
        res.status(500).json({ error: 'Ошибка нейросети' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});