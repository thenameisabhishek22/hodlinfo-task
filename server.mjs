import pkg from 'pg';
const { Pool } = pkg;

import fetch from 'node-fetch';
import express from 'express';

const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'hodlinfo',
    password: 'Mohini@2205',
    port: 5432,
});

// Fetch data from WazirX API and store in PostgreSQL
async function fetchData() {
    const response = await fetch('https://api.wazirx.com/api/v2/tickers');
    const data = await response.json();
    const top10 = Object.values(data).slice(0, 10);

    top10.forEach(async (item) => {
        const query = `
            INSERT INTO ticker_data (name, last, buy, sell, volume, base_unit)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) 
            DO UPDATE SET 
                last = EXCLUDED.last,
                buy = EXCLUDED.buy,
                sell = EXCLUDED.sell,
                volume = EXCLUDED.volume,
                base_unit = EXCLUDED.base_unit;
        `;
        await pool.query(query, [item.name, item.last, item.buy, item.sell, item.volume, item.base_unit]);
    });
}

// Fetch data immediately on startup
fetchData();

// Serve static files from the public directory
app.use(express.static('public'));

// Create a route to get data from the database
app.get('/api/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ticker_data');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
