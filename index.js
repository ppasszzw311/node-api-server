require('dotenv').config();
const express = require('express');
const { Pool } = require('pg')
const app = express();
const PORT = process.env.PORT || 3000;
const line = require('@line/bot-sdk');

// 检查必要的环境变量
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
  console.error('请确保设置了 LINE_CHANNEL_ACCESS_TOKEN 和 LINE_CHANNEL_SECRET 环境变量');
  process.exit(1);
}

// Line Messaging API 配置
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(lineConfig);

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

let connectres = ''

// 建立會員表
const createTable = async () => {
  const query = `
  CREATE TABLE IF NOT EXISTS members (
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
    connectres = 'Connected to PostgreSQL';
    await initDatabase();
  })
  .catch(err => connectres = `Connection error, ${err.stack}`);

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

// Line Webhook 路由
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    console.log('收到 Line Webhook 请求:', JSON.stringify(req.body, null, 2));
    
    const events = req.body.events;
    const results = await Promise.all(
      events.map(async (event) => {
        try {
          console.log('处理事件:', JSON.stringify(event, null, 2));
          
          if (event.type === 'message' && event.message.type === 'text') {
            // 处理文本消息
            const echo = { type: 'text', text: event.message.text };
            console.log('发送回复:', JSON.stringify(echo, null, 2));
            return client.replyMessage(event.replyToken, echo);
          }
        } catch (err) {
          console.error('处理事件时出错:', err);
          return null;
        }
      })
    );
    res.json(results);
  } catch (err) {
    console.error('Webhook 处理出错:', err);
    res.status(500).end();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} and db con is ${connectres}`);
});