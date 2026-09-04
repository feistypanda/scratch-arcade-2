
const ejs = require('ejs');
const express = require('express');
const path = require('path');
const fs = require('fs');

const PORT = 8000;
const DROP_DIR = path.join(__dirname, '../static/games');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../static')))



// app.get('/', (req, res) => {
// 	res.render('views/upload', { title: 'Upload - Scratch Arcade' });
// });

// app.get('/arcade', (req, res) => {
// 	res.render('views/arcade', { title: 'Scratch Arcade' });
// });

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));