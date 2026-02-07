app.post('/api/analyze', async (req, res) => {
    const { movieTitle, context, userHistory } = req.body;
    const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;

    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat", // Или "deepseek-reasoner" для более глубокого анализа
            messages: [
                { role: "system", content: "Ты — кинокритик CineMind. Пиши кратко и стильно." },
                { role: "user", content: `Проанализируй фильм "${movieTitle}". Контекст: ${context}. Пользователь любит: ${userHistory}. Дай вердикт: смотреть или нет?` }
            ],
            stream: false
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_KEY}`
            }
        });

        const aiText = response.data.choices[0].message.content;
        res.json({ analysis: aiText });
    } catch (error) {
        console.error('DeepSeek Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Ошибка нейросети DeepSeek' });
    }
});
