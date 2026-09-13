
const express = require('express');
const path = require('path');
const fs = require('fs');

const multerUpload = require('./utils/multer');
const upload = require('./upload-controller/upload');
const ipAdress = require('./config/ip')

const PORT = 8000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../static')))

app.get('/', (req, res) => {
	return res.redirect('/upload');
});

app.get('/index.html', (req, res) => {
	return res.redirect('/arcade');
});

app.get('/api/ip', (req, res) => {

	let ip = '[failure to find IP adress]';
	if (ipAdress["en0"]) ip = ipAdress["en0"][0];
	if (ipAdress["wlan0"]) ip = ipAdress["wlan0"][0];

	res.json({ ip });
})

app.post('/api/upload', multerUpload.single('img'), (req, res) => {
	upload(req.body.name, req.body.link, (req.file ? req.file : req.body.img)).then(result => res.send(result));
})

app.get('/api/get-game-data/:id', (req, res) => {
	if (!req.params.id || typeof req.params.id !== 'string') return res.send({ code:'invalid id' });
	
	fetch(`https://api.scratch.mit.edu/projects/${req.params.id}`).then(response => response.json()).then(dat => res.send(dat));
})

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));