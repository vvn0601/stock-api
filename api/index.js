const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Stock API Running (Auto TW/TWO Mode)');
});

// --- 抽取出 Fetch Yahoo 的功能，方便重複呼叫 ---
const fetchYahooData = async (symbol) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url);
    if (!response.ok) return null; // 如果網路錯誤或 Yahoo 報錯，回傳 null
    const data = await response.json();
    return data;
};

app.get('/api/price/:symbol', async (req, res) => {
  try {
    let symbol = req.params.symbol;
    
    // 1. 第一次嘗試：直接用前端傳來的代碼 (例如 8299.TW)
    let data = await fetchYahooData(symbol);
    
    // 檢查是否有有效資料 (Yahoo 有時沒報錯但回傳空 result)
    let isValid = data && data.chart && data.chart.result && data.chart.result[0];

    // --- ★ 關鍵修改：自動切換上市櫃邏輯 ---
    // 如果第一次失敗 (isValid 為 false)，且代碼結尾是 .TW
    // 代表可能是「上櫃股票」被誤判為上市，我們自動換成 .TWO 再試一次
    if (!isValid && symbol.endsWith('.TW')) {
        const retrySymbol = symbol.replace('.TW', '.TWO');
        console.log(`[Retry] ${symbol} failed, trying ${retrySymbol}...`);
        
        const retryData = await fetchYahooData(retrySymbol);
        
        // 如果換成 .TWO 成功了，就採用新資料
        if (retryData && retryData.chart && retryData.chart.result && retryData.chart.result[0]) {
            data = retryData;
            symbol = retrySymbol; // 更新 symbol 以便回傳正確資訊
            isValid = true;
        }
    }
    // ------------------------------------

    if (isValid) {
      const meta = data.chart.result[0].meta;
      res.json({
        symbol, // 這裡會回傳最終成功的代碼 (可能是 .TWO)
        price: meta.regularMarketPrice,
        previousClose: meta.chartPreviousClose, // 補上這個，以防沒有 price
        currency: meta.currency,
        status: 'success',
        time: new Date().toLocaleString()
      });
    } else {
      // 真的找不到 (試過 TW 也試過 TWO 都沒救)
      res.status(404).json({ symbol, status: 'error', message: 'Not Found' });
    }

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 本地端測試用
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
