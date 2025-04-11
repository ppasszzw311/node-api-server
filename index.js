const express = require('express');
const { Pool } = require('pg')
const app = express();
const PORT = process.env.PORT || 3000;


const pool = new Pool({
  user: 'root',
  host: 'hnd1.clusters.zeabur.com',
  database: 'zeabur',
  password: 'mU5JxO68Cf3p7wLhen49ka10zG2oHvsc',
  port: 32517,
})

let connectres = ''

// 建立會員表
const createTable = async () => {
  const query = `
  REATE TABLE IF NOT EXISTS members (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
  `;
  await pool.query(query);
}

//加入假資料
const insertDummyData = async () => {
  const query = `
        INSERT INTO members (name, email, password)
        VALUES
        ('Alice', 'alice@example.com', 'password123'),
        ('Bob', 'bob@example.com', 'password456')
        ON CONFLICT (email) DO NOTHING; -- 避免重复插入
    `;
  await pool.query(query);
};

// 初始化数据库
const initDatabase = async () => {
  await createTable();
  await insertDummyData();
};

// 连接数据库并初始化
pool.connect()
  .then(async () => {
    console.log('Connected to PostgreSQL');
    await initDatabase();
  })
  .catch(err => console.error('Connection error', err.stack));

app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members');
    res.json(result.rows); // 返回会员数据
  } catch (err) {
    console.error('Error fetching members', err);
    res.status(500).send('Server error');
  }
});

app.get('/', (req, res) => {
  res.send(`Hello, Zeabur! ${connectres}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} and db con is ${connectres}`);
});