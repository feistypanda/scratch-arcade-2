
const path = require('path');
const fs = require('node:fs/promises');

const config = require('../config/config');
const uploadFields = config.uploadFields;
const DROP_DIR = config.dropDir;

function unEscapeName (name) {
	return name.replaceAll('_', '\'').replaceAll('-', ' ');
}

function clearDir (dir) {
	return fs.rm(dir, { recursive: true, force: true })
		.then(_ => fs.mkdir(dir))
		.catch(e => console.log(e));
}

function updateGameData (dir) {
	const gamesData = [];

	return fs.readdir(dir, { withFileTypes: true }).then(entries => {
		const folderNames = entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

		const promises = [];
		
		for (const i of folderNames) {
			promises.push(fs.readdir(path.join(dir, i)).then(entries => {
				for (const j of entries) {
					if (j.split('.')[0] === 'img') {
						gamesData.push({
							title: unEscapeName(i),
							link: path.join('/games', i),
							img: path.join('/games', i, j),
						});
						return Promise.resolve();
					}
				}

				gamesData.push({
					title: unEscapeName(i),
					link: path.join('/games', i),
					img: path.join('/games', i, 'img.png'),
				})
			}));
		}

		return Promise.all(promises).then(_ => fs.writeFile(path.join(dir, 'games.json'), JSON.stringify(gamesData), 'utf8'));
	})
}

function insertScript (file) {
	return fs.readFile(file, 'utf8').then(data => fs.writeFile(file, data.replace('<head>', '<head><script>document.addEventListener(\'keydown\',function(e){if(e.code===\'KeyQ\'){window.open(\'/arcade\', \'_self\');}});</script>')))
}

module.exports = { clearDir, updateGameData, insertScript };