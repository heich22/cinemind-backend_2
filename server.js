const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// На Render назови переменные именно так: KP_KEY, DEEPSEEK_KEY, OMDB_KEY
const KP_KEY = process.env.KP_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const OMDB_KEY = process.env.OMDB_KEY;

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

app.get('/api/ratings', async (req, res) => {
    const { title } = req.query;
    if (!OMDB_KEY) return res.json({ imdb: 'N/A', rt: 'N/A' });
    try {
        // Ищем по точному названию для IMDb и RT
        const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_KEY}`);
        const data = response.data;
        
        let rtValue = 'N/A';
        if (data.Ratings) {
            const rt = data.Ratings.find(r => r.Source === "Rotten Tomatoes");
            rtValue = rt ? rt.Value : 'N/A';
        }

        res.json({
            imdb: data.imdbRating || 'N/A',
            rt: rtValue
        });
    } catch (e) { res.json({ imdb: 'N/A', rt: 'N/A' }); }
});

app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;

    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "Ты — экспертный кинокритик CineMind. Твоя задача: дать краткий, стильный анализ фильма и в самом конце обязательно добавить оценку фильма по 100-балльной системе в формате [SCORE: XX], где XX - число." },
                { role: "user", content: `Проанализируй фильм "${movieTitle}". Контекст: ${context}. Пользователь предпочитает: ${userHistory}. Дай вердикт и оценку.` }
            ],
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_KEY}`, // Проверь имя переменной на Render!
                'Content-Type': 'application/json'
            }
        });

        res.json({ analysis: response.data.choices[0].message.content });
    } catch (error) {
        console.error('DeepSeek Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'DeepSeek Offline', details: error.message });
    }
});

app.listen(PORT, () => console.log(`CineMind Server Live`));
