
const path = require('path');
const fs = require('node:fs/promises');

const config = require('../config/config');
const uploadFields = config.uploadFields;
const DROP_DIR = config.dropDir;

function unEscapeName (name) {
	return name.replaceAll('_', '\'').replaceAll('-', ' ');
}

function getFiles (req) {
	let files = [];
	for (const i of uploadFields) {
		if (req.files[i.name]) {
			files.push({
				expected: i.name,
				file: req.files[i.name][0],
			});
		}
	}
	return files;
}

function deleteFiles (files) {
	if (files instanceof Array) {
		for (const i of files) fs.unlink(i.file.path).catch(e => console.log(e));
	} else if (files) {
		fs.unlink(files.path).catch(e => console.log(e));
	}
}

function updateGameData (dir) {
	const gamesData = [];

	return fs.readdir(dir, { withFileTypes: true }).then(entries => {
		const folderNames = entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
		
		for (const i of folderNames) {
			gamesData.push({
				title: unEscapeName(i),
				link: path.join('/games', i),
				img: path.join('/games', i, 'img.png'),
			})
		}

		return fs.writeFile(path.join(dir, 'games.json'), JSON.stringify(gamesData), 'utf8');
	})
}

function insertScript (file) {
	return fs.readFile(file, 'utf8').then(data => fs.writeFile(file, data.replace('<head>', '<head><script>document.addEventListener(\'keydown\',function(e){if(e.code===\'KeyQ\'){window.open(\'/arcade\', \'_self\');}});</script>')))
}

module.exports = { getFiles, deleteFiles, updateGameData, insertScript };