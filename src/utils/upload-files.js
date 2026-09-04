
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

		let fileNames = '';

		const errors = [];
		const promises = [];

		for (const i of files) {

			const { file, expected } = i;

			const extName = path.extname(file.originalname);
			if (('.' + expected) !== extName) {
				errors.push(`expected file extension .${expected} and got ${file.originalname} with extension ${extName}`);
				continue;
			}

			fileNames += file.originalname + ' ';

			const promise = fs.rename(file.path, path.join(dirname, extMap[expected])).catch(e => console.log(e));

			promises.push(promise);
		}

		Promise.all(promises).then(_ => {
			deleteFiles(files);
		})

		return Promise.resolve(fileNames);
	}
})();

function checkFiles (files) {

	const errors = [];

	for (const i of files) {
		const { file, expected } = i;

		const extName = path.extname(file.originalname);
		if (('.' + expected) !== extName) errors.push(`expected a file with file extension '.${expected}' and got file '${file.originalname}' with extension '${extName}'`);
	}

	if (errors.length > 0) return {error: errors.join('\n')};
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

module.exports = function (req, res) {

	const gameName = path.join(DROP_DIR, 'testing') + Math.round(Math.random() * 1000);

	const files = getFiles(req);
	const checked = checkFiles(files);

	if (checked.success) {

		fs.mkdir(gameName).then(_ => {
			addFilesToDir(files, gameName).then(msg => res.send(msg));		
		}).catch(e => {
			console.log(e)

			if (e.code === 'EEXIST') {
				return res.send(`game name ${gameName} has already been taken`);
			} else {
				return res.send(e);
			}
		})

	} else {
		deleteFiles(files);
		return res.send(checked.error);	
	}
}