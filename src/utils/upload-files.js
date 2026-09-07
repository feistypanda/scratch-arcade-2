
const path = require('path');
const fs = require('node:fs/promises');

const config = require('../config/config');
const uploadFields = config.uploadFields;
const DROP_DIR = config.dropDir;

const addFilesToDir = (() => {

	const extMap = {
		'html': 'index.html',
		'png': 'img.png',
		'sb3': 'project.sb3',
	}

	return function (files, dirname) {

		let fileNames = [];

		const errors = [];
		const promises = [];

		for (const i of files) {

			const { file, expected } = i;

			const destination = path.join(dirname, extMap[expected])
			const promise = fs.rename(file.path, destination).then(_ => fileNames.push(file.originalname));

			if (expected === 'html') promise.then(_ => insertScript(destination))

			promises.push(promise);
		}

		return Promise.all(promises).then(_ => { return { success: true, fileNames }}).catch(e => console.log(e));
	}
})();

function checkFiles (files) {

	const errors = [];

	let found = [];
	for (const i of files) found.push(i.expected);

	if (!found.includes('html')) errors.push('found no html file - make sure you include the html file you got from the packager')
	if (!found.includes('png')) errors.push('found no png file - make sure you take a screenshot of your game to be the thumbnail')
	if (!found.includes('sb3')) errors.push('found no sb3 file - make sure you include the sb3 file you got from scratch')

	for (const i of files) {
		const { file, expected } = i;

		const extName = path.extname(file.originalname);
		if (('.' + expected) !== extName) errors.push(`expected a file with file extension '.${expected}' and got file '${file.originalname}' with extension '${extName}'`);
	}
	
	if (errors.length > 0) return { errors };
	else return {success: true};
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
	for (const i of files) fs.unlink(i.file.path).catch(e => console.log(e));
}

function checkName (name) {

	if (!name || (typeof name) !== 'string') return { errors: ['game name is required'] };
	if (name.match(/^[' ]|[^\w ']| (?= )|'(?=')|[' ]$/g)) return { errors: [`invalid game name: ${name}`] };
	if (name.length < 3 || name.length > 25) return { errors: ['game name must be between 3 and 25 characters in length'] };

	return { success: true };
}

function doError (files, errors) {
	deleteFiles(files);
	return Promise.resolve({ errors });
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

function escapeName (name) {
	return name.replaceAll('\'', '_').replaceAll(' ', '-');
}

function unEscapeName (name) {
	return name.replaceAll('_', '\'').replaceAll('-', ' ');
}

function uploadFiles (name, files) {

	const checkedFiles = checkFiles(files);
	const checkedName = checkName(name);

	let errors = [];
	if (checkedName.errors) errors = errors.concat(checkedName.errors);
	if (checkedFiles.errors) errors = errors.concat(checkedFiles.errors);

	if (errors.length > 0) return doError(files, errors);
	
	const gameName = path.join(DROP_DIR, escapeName(name));

	return fs.mkdir(gameName).then(_ => {
		return addFilesToDir(files, gameName);
	}).then(msg => {
		updateGameData(DROP_DIR);
		return { msg };
	}).catch(e => {
		if (e.code === 'EEXIST') return doError(files, [`game name '${name}' has already been taken`]);
		else {
			console.log(e);
			return doError(files, [e]);
		}
	})
}

function insertScript (file) {
	return fs.readFile(file, 'utf8').then(data => fs.writeFile(file, data.replace('<head>', '<head><script>document.addEventListener(\'keydown\',function(e){if(e.code===\'KeyQ\'){window.open(\'/arcade\', \'_self\');}});</script>')))
}

module.exports = { uploadFiles, getFiles };