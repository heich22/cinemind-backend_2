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
const GEMINI_KEY = process.env.GEMINI_KEY;

// 1. Поиск фильмов
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

// 2. Исправленный запрос к Gemini (v1beta)
app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;
    
    // ПРОВЕРКА: Правильный URL для Gemini 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    
    const promptData = {
        contents: [{
            parts: [{
                text: `Ты эксперт кино CineMind. Пользователь любит: ${userHistory}. 
                Проанализируй фильм "${movieTitle}". Контекст: ${context}. 
                Напиши 2 коротких абзаца: почему подходит пользователю и краткий вердикт по отзывам зрителей.`
            }]
        }]
    };

    try {
        const response = await axios.post(url, promptData, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.candidates && response.data.candidates[0].content) {
            const aiText = response.data.candidates[0].content.parts[0].text;
            res.json({ analysis: aiText });
        } else {
            throw new Error('Empty AI response');
        }
    } catch (error) {
        // Выводим ошибку в логи Render для диагностики
        console.error('Gemini Error Details:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({ 
            error: 'Ошибка нейросети', 
            details: error.response ? error.response.data : error.message 
        });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
