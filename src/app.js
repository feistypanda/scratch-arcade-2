
const express = require('express');
const path = require('path');
const fs = require('fs');

const upload = require('./utils/multer');
const { uploadFiles, getFiles } = require('./utils/upload-files');
const { uploadFields } = require('./config/config');

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

app.post('/api/upload', upload.fields(uploadFields), (req, res) => {
	uploadFiles(req.body.name, getFiles(req)).then(result => res.send(result));
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));