const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Stock API Running');
});

// 注意：在 Vercel Serverless Function 中，路徑要小心
// 這裡我們直接匹配根路徑，Vercel 會自動把 /api/index 導向這裡
app.get('/api/price/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.chart?.result?.[0]) {
      const meta = data.chart.result[0].meta;
      res.json({
        symbol,
        price: meta.regularMarketPrice,
        currency: meta.currency,
        status: 'success',
        time: new Date().toLocaleString()
      });
    } else {
      res.status(404).json({ symbol, status: 'error', message: 'Not Found' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 為了讓本地端也能跑，我們加上這個判斷
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
