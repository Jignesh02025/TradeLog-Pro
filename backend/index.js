const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
const { Pool } = require('pg');
const helmet = require('helmet');
const path = require('path');

dotenv.config(); // loads backend/.env

// Extremely robust key loading: trim whitespace and strip quotes
const apiKey = process.env.GROQ_API_KEY 
  ? process.env.GROQ_API_KEY.trim().replace(/^["']|["']$/g, '').trim() 
  : undefined;

console.log('--- Backend Server Starting ---');
console.log('Groq API Key detected:', !!apiKey);
console.log('------------------------------');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins to connect (helpful when testing deployed frontend)
    callback(null, true);
  },
  credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const groq = new Groq({
  apiKey: apiKey,
});

// Robust database connection using connection string (best for Vercel + Supabase Pooler)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('Using DATABASE_URL connection:', !!process.env.DATABASE_URL);

const GROQ_SYSTEM_PROMPT = `
You are a SQL expert for a Trading Journal application.
The database has the following schema:
- trades (id, user_id, date, pair, type, lot_size, entry_price, exit_price, stop_loss, take_profit, pips, pip_value, profit_loss, trade_result, notes)
- profiles (id, name, account_currency)
- settings (user_id, default_currency, risk_percentage)

Your task is to convert a natural language question into a PostgreSQL SELECT query.
ONLY return the SQL query. Do not include any explanation or markdown formatting.
IMPORTANT: 
- Always filter by user_id = $1.
- Only allow SELECT queries.
- Do NOT include any semicolons.
- Use PostgreSQL syntax.
- If the question is not related to the schema, respond with "REJECTED".
`;

app.post('/api/query', async (req, res) => {
  const { question, userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Processing: "${question}" for user ${userId}`);

    // 1. Generate SQL
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: GROQ_SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0,
    });

    const sql = chatCompletion.choices[0]?.message?.content?.trim();
    console.log('Generated SQL:', sql);

    if (!sql || sql === 'REJECTED') {
      return res.status(400).json({ error: "I'm sorry, I can only answer questions related to your trading data." });
    }

    if (!sql.toUpperCase().startsWith('SELECT')) {
      return res.status(403).json({ error: 'Security violation: Only SELECT queries are allowed.' });
    }

    // 2. Execute SQL
    const result = await pool.query(sql, [userId]);
    console.log('Query results:', result.rows.length, 'rows');

    // 3. Explain Results
    const explanationCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional trading analyst. Explain the following data results in a concise, human-readable way. If no data is found, say so.' 
        },
        { 
          role: 'user', 
          content: `Question: ${question}\nData: ${JSON.stringify(result.rows)}` 
        },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.5,
    });

    const explanation = explanationCompletion.choices[0]?.message?.content;

    res.json({ sql, data: result.rows, explanation });

  } catch (error) {
    console.error('SERVER ERROR:', error);
    res.status(error.status || 500).json({ 
      error: 'AI Assistant Error', 
      details: error.message,
      type: error.type 
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const { question, userId, history } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Chat Request: "${question}" for user ${userId}`);

    // 1. Check Cache (Only for single questions, not history-based)
    if (!history || history.length === 0) {
      const cacheResult = await pool.query(
        'SELECT answer FROM ai_chat_cache WHERE user_id = $1 AND question = $2 LIMIT 1',
        [userId, question.trim()]
      );

      if (cacheResult.rows.length > 0) {
        console.log('Cache Hit!');
        return res.json({ explanation: cacheResult.rows[0].answer, cached: true });
      }
    }

    // 2. Fetch Recent Trades (Last 20) with Notes
    const tradeResult = await pool.query(
      'SELECT date, pair, type, profit_loss, trade_result, notes FROM trades WHERE user_id = $1 ORDER BY date DESC LIMIT 20',
      [userId]
    );
    const trades = tradeResult.rows;

    // 2b. Fetch All-Time Stats
    const allTimeResult = await pool.query(`
      WITH all_stats AS (
        SELECT 
          COUNT(*) as total_count,
          SUM(profit_loss) as total_profit,
          COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as win_count
        FROM trades 
        WHERE user_id = $1
      ),
      best_pair_stat AS (
        SELECT pair, SUM(profit_loss) as pair_profit
        FROM trades 
        WHERE user_id = $1
        GROUP BY pair
        ORDER BY pair_profit DESC
        LIMIT 1
      ),
      best_day_stat AS (
        SELECT TRIM(TO_CHAR(date, 'Day')) as day_name, SUM(profit_loss) as day_profit
        FROM trades 
        WHERE user_id = $1
        GROUP BY day_name
        ORDER BY day_profit DESC
        LIMIT 1
      ),
      most_winning_day_stat AS (
        SELECT TRIM(TO_CHAR(date, 'Day')) as day_name, COUNT(*) as win_freq
        FROM trades 
        WHERE user_id = $1 AND profit_loss > 0
        GROUP BY day_name
        ORDER BY win_freq DESC
        LIMIT 1
      )
      SELECT 
        (SELECT total_count FROM all_stats) as all_time_total,
        (SELECT total_profit FROM all_stats) as all_time_profit,
        (SELECT win_count FROM all_stats) as all_time_wins,
        (SELECT pair FROM best_pair_stat) as all_time_best_pair,
        (SELECT pair_profit FROM best_pair_stat) as all_time_best_pair_profit,
        (SELECT day_name FROM best_day_stat) as all_time_best_day,
        (SELECT day_profit FROM best_day_stat) as all_time_best_day_profit,
        (SELECT day_name FROM most_winning_day_stat) as all_time_most_winning_day,
        (SELECT win_freq FROM most_winning_day_stat) as all_time_most_winning_day_freq
    `, [userId]);
    
    const allTimeStats = allTimeResult.rows[0] || {};

    // 3. Detailed Analytics
    const total = trades.length;
    const winningTrades = trades.filter(t => Number(t.profit_loss) > 0);
    const losingTrades = trades.filter(t => Number(t.profit_loss) < 0);
    
    const wins = winningTrades.length;
    const losses = losingTrades.length;
    const winRate = total ? ((wins / total) * 100).toFixed(1) : 0;
    const totalProfit = trades.reduce((acc, t) => acc + Number(t.profit_loss), 0).toFixed(2);
    
    // Pair Analysis (Most and Least Traded)
    const pairAnalysis = trades.reduce((acc, t) => {
      const p = t.pair.trim().toUpperCase();
      if (!acc[p]) acc[p] = { count: 0, profit: 0 };
      acc[p].count += 1;
      acc[p].profit += Number(t.profit_loss);
      return acc;
    }, {});

    const sortedByCount = Object.entries(pairAnalysis).sort((a,b) => b[1].count - a[1].count);
    const mostTradedPair = sortedByCount[0];
    const leastTradedPair = sortedByCount[sortedByCount.length - 1];

    const mostTradedPairName = mostTradedPair?.[0] || "N/A";
    const mostTradedPairCount = mostTradedPair?.[1]?.count || 0;
    const leastTradedPairName = leastTradedPair?.[0] || "N/A";
    const leastTradedPairCount = leastTradedPair?.[1]?.count || 0;

    const sortedByProfit = Object.entries(pairAnalysis).sort((a,b) => b[1].profit - a[1].profit);
    const bestPair = sortedByProfit[0];
    const bestPairName = bestPair?.[0] || "N/A";
    const bestPairProfit = bestPair?.[1]?.profit.toFixed(2) || "0.00";

    // Date Analysis (Most Profitable Date)
    const dateProfits = trades.reduce((acc, t) => {
      const dateKey = new Date(t.date).toLocaleDateString();
      acc[dateKey] = (acc[dateKey] || 0) + Number(t.profit_loss);
      return acc;
    }, {});
    const sortedDates = Object.entries(dateProfits).sort((a,b) => b[1] - a[1]);
    const bestDate = sortedDates[0];
    const bestDateStr = bestDate?.[0] || "N/A";
    const bestDateProfit = bestDate?.[1]?.toFixed(2) || "0.00";

    // Day of Week Analysis (Best Day for Profit)
    const dayProfits = trades.reduce((acc, t) => {
      const day = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
      acc[day] = (acc[day] || 0) + Number(t.profit_loss);
      return acc;
    }, {});
    const sortedDaysByProfit = Object.entries(dayProfits).sort((a,b) => b[1] - a[1]);
    const bestDayProfit = sortedDaysByProfit[0];
    const bestDayName = bestDayProfit?.[0] || "N/A";
    const bestDayProfitVal = bestDayProfit?.[1]?.toFixed(2) || "0.00";

    // Day of Week Analysis (Most Frequent Winning Day)
    const dayWins = trades.reduce((acc, t) => {
      if (Number(t.profit_loss) > 0) {
        const day = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {});
    const sortedDaysByWins = Object.entries(dayWins).sort((a,b) => b[1] - a[1]);
    const mostWinningDay = sortedDaysByWins[0];
    const mostWinningDayName = mostWinningDay?.[0] || "N/A";
    const mostWinningDayCount = mostWinningDay?.[1] || 0;

    // 4. Build Prompt
    const systemPrompt = `
You are a professional trading coach.
You MUST provide accurate answers based ONLY on the summary stats and trade list provided.

Rules:
1. If the user says "raire" or "reire", they mean "rarely" (least traded).
2. If asked for a "rare" or "least traded" pair, use the "Least Traded Pair" stat.
3. If asked for a "reason", check the Notes.
4. ALWAYS include numbers.
5. Plain text only.
6. When asked for "best day", prioritize giving the Day of the Week (e.g. Monday) for "all time" questions, but you can also mention the specific best date if relevant.
`;

    const tradeListStr = trades.map(t => 
      `${new Date(t.date).toLocaleDateString()}: ${t.pair} (${t.type}) ${Number(t.profit_loss) > 0 ? '+' : ''}${Number(t.profit_loss).toFixed(2)} | Notes: ${t.notes || 'None'}`
    ).join('\n');

    const userPrompt = `
USER DATA (LAST 20 TRADES):
${tradeListStr}

SUMMARY STATS (LAST 20 TRADES):
- Total Trades: ${total}
- Total Profit: ${totalProfit}
- Win Rate: ${winRate}%
- Most Traded Pair: ${mostTradedPairName} (${mostTradedPairCount} trades)
- Least Traded Pair: ${leastTradedPairName} (${leastTradedPairCount} trades)
- Best Pair (Profit): ${bestPairName} (Profit: ${bestPairProfit})
- Best Trading Date: ${bestDateStr} (Profit: ${bestDateProfit})

ALL-TIME PERFORMANCE:
- Total Trades: ${allTimeStats.all_time_total || 0}
- Total Profit: ${Number(allTimeStats.all_time_profit || 0).toFixed(2)}
- Win Rate: ${allTimeStats.all_time_total ? ((allTimeStats.all_time_wins / allTimeStats.all_time_total) * 100).toFixed(1) : 0}%
- Best Pair: ${allTimeStats.all_time_best_pair || 'N/A'} (Profit: ${Number(allTimeStats.all_time_best_pair_profit || 0).toFixed(2)})
- Most Profitable Day of Week: ${allTimeStats.all_time_best_day || 'N/A'} (Profit: ${Number(allTimeStats.all_time_best_day_profit || 0).toFixed(2)})
- Most Frequent Winning Day: ${allTimeStats.all_time_most_winning_day || 'N/A'} (${allTimeStats.all_time_most_winning_day_freq || 0} winning trades)

User Question: "${question}"

Provide a direct answer.
`;

    // 5. Call AI (Groq) with History
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userPrompt }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'openai/gpt-oss-120b',
      max_tokens: 200,
      temperature: 0.4,
    });

    const reply = chatCompletion.choices[0]?.message?.content;

    // 6. Handle Image Extraction (Feature) - REMOVED
    let tradesFound = null;

    // 7. Save to Cache (Only for single questions)
    if (reply && (!history || history.length === 0)) {
      await pool.query(
        'INSERT INTO ai_chat_cache (user_id, question, answer) VALUES ($1, $2, $3)',
        [userId, question?.trim() || 'Image Analysis', reply]
      );
    }

    res.json({ explanation: reply, tradesFound });

  } catch (error) {
    console.error('CHAT ERROR:', error);
    res.status(500).json({ error: 'Failed to process chat request: ' + (error.message || 'Unknown error') });
  }
});

app.post('/api/trades/bulk', async (req, res) => {
  const { userId, trades } = req.body;

  if (!userId || !trades || !Array.isArray(trades)) {
    return res.status(400).json({ error: 'Missing userId or trades array' });
  }

  console.log(`[MT5 SYNC] Received ${trades.length} trades for user ${userId}`);
  // Log the first few trades as a sample
  console.log('Sample data:', JSON.stringify(trades.slice(0, 3), null, 2));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const trade of trades) {
      const { date, pair, type, lot_size, profit_loss, entry_price, exit_price, pips, pip_value, external_id, risk_reward } = trade;
      
      await client.query(
        `INSERT INTO trades (
          user_id, date, pair, type, lot_size, entry_price, exit_price, stop_loss, take_profit, pips, pip_value, profit_loss, risk_reward, trade_result, notes, external_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (external_id) DO UPDATE SET
          profit_loss = EXCLUDED.profit_loss,
          exit_price = EXCLUDED.exit_price,
          entry_price = EXCLUDED.entry_price,
          stop_loss = EXCLUDED.stop_loss,
          take_profit = EXCLUDED.take_profit,
          risk_reward = EXCLUDED.risk_reward,
          trade_result = EXCLUDED.trade_result`,
        [
          userId, 
          date, 
          pair, 
          type, 
          lot_size || 0, 
          entry_price || 0, 
          exit_price || 0, 
          trade.stop_loss || 0, 
          trade.take_profit || 0, 
          pips || 0, 
          pip_value || 0, 
          profit_loss,
          risk_reward || 0,
          Number(profit_loss) >= 0 ? 'Win' : 'Loss',
          trade.notes || 'Added via MT5 Sync',
          external_id || null
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, count: trades.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('BULK ADD ERROR:', error);
    res.status(500).json({ error: 'Failed to bulk add trades', details: error.message });
  } finally {
    client.release();
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
