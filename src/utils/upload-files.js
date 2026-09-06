
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

			const promise = fs.rename(file.path, path.join(dirname, extMap[expected])).then(_ => fileNames.push(file.originalname));

			promises.push(promise);
		}

		return Promise.all(promises).then(_ => { return { success: true, fileNames }});
	}
})();

function checkFiles (files) {

	const errors = [];

	let found = [];
	for (const i of files) found.push(i.expected);

	if (!found.includes('html')) errors.push('found no html file - make sure you include the html file you got from the packager')
	if (!found.includes('png')) errors.push('found no png file - make sure you take a screenshot of your game to be the thumbnail')
	if (!found.includes('png')) errors.push('found no sb3 file - make sure you include the sb3 file you got from scratch')

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
	if (name.match(/^[_-]|[^\w-]|[_-](?=[_-])|[_-]$/g)) return { errors: [`invalid game name: ${name}`] };

	return { success: true };
}

function doError (res, files, errors) {
	deleteFiles(files);
	res.send({ errors });
}

function updateGameData (dir) {
	const gamesData = {};

	fs.readdir(dir, { withFileTypes: true }).then(entries => {
		const folderNames = entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
		console.log(folderNames);
	})
}

module.exports = function (req, res) {

	const files = getFiles(req);
	const checkedFiles = checkFiles(files);

	const name = req.body.name;
	const checkedName = checkName(name);

	let errors = [];
	if (checkedName.errors) errors = errors.concat(checkedName.errors);
	if (checkedFiles.errors) errors = errors.concat(checkedFiles.errors);

	if (errors.length > 0) return doError(res, files, errors);
	
	const gameName = path.join(DROP_DIR, name);

	fs.mkdir(gameName).then(_ => {
		return addFilesToDir(files, gameName);
	}).then(msg => {
		updateGameData(DROP_DIR);
		res.send(msg);
	}).catch(e => {
		if (e.code === 'EEXIST') return doError(res, files, [`game name '${name}' has already been taken`]);
		else {
			console.log(e);
			return doError(res, files, [e]);
		}
	})
}