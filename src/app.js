
const ejs = require('ejs');
const express = require('express');
const path = require('path');
const fs = require('fs');

const PORT = 8000;
const DROP_DIR = path.join(__dirname, '../public/games');

const app = express();

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public'))

app.get('/', (req, res) => {
	res.render('views/upload');
});

app.get('/arcade', (req, res) => {
	res.render('views/arcade');
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));