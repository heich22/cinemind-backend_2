const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ИСПОЛЬЗУЕМ ЕДИНЫЙ СТАНДАРТ ИМЕН (Проверьте эти имена на Render!)
const KP_KEY = process.env.KP_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY; 
const OMDB_KEY = process.env.OMDB_KEY;

app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;

    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "Ты — экспертный кинокритик CineMind. Проанализируй фильм кратко и стильно на русском языке. В самом конце ответа обязательно напиши оценку фильма по 100-балльной системе строго в формате [SCORE: XX], где XX — число." },
                { role: "user", content: `Фильм: "${movieTitle}". Контекст: ${context}. Пользователь любит: ${userHistory}. Дай вердикт и оценку.` }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_KEY}`, // Имя должно совпадать с переменной выше!
                'Content-Type': 'application/json'
            }
        });

        res.json({ analysis: response.data.choices[0].message.content });
    } catch (error) {
        // Выводим детальную ошибку в логи Render
        console.error('DeepSeek API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'AI Offline', details: error.message });
    }
});

// Эндпоинты для поиска и рейтингов оставляем без изменений
app.get('/api/search', async (req, res) => {
    const { keyword } = req.query;
    try {
        const response = await axios.get(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(keyword)}`, {
            headers: { 'X-API-KEY': KP_KEY }
        });
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: 'KP Error' }); }
});

app.get('/api/ratings', async (req, res) => {
    const { title } = req.query;
    if (!OMDB_KEY) return res.json({ imdb: 'N/A', rt: 'N/A' });
    try {
        const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_KEY}`);
        const rt = (response.data.Ratings || []).find(r => r.Source === "Rotten Tomatoes");
        res.json({ imdb: response.data.imdbRating || 'N/A', rt: rt ? rt.Value : 'N/A' });
    } catch (e) { res.json({ imdb: 'N/A', rt: 'N/A' }); }
});

app.listen(PORT, () => console.log(`CineMind Server Live`));
