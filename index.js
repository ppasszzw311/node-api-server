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

pool.connect()
  .then(() => connectres = 'success')
  .catch(err => connectres = err.stack);


app.get('/', (req, res) => {
  res.send('Hello, Zeabur!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} and db con is ${connectres}`);
});