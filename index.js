const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>股票API運行正常！</h1>');
});

app.get('/api/price/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    // 直接呼叫 Yahoo 官方公開 API
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
      res.status(404).json({ symbol, status: 'error', message: '查無資料' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API運行：http://localhost:${PORT}`);
});
module.exports = app;
