
const path = require('path');
const fs = require('node:fs/promises');
const check = require('./input-checkers');
const fileUtil = require('./file-utils');
const getPackaged = require('./packager')

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

			if (expected === 'html') promise.then(_ => fileUtil.insertScript(destination))

			promises.push(promise);
		}

		return Promise.all(promises).then(_ => { return { success: true, fileNames }}).catch(e => console.log(e));
	}
})();

const addLinkUploadToDir = (() => {
	return function (data, name) {
		const errors = [];
		const promises = [];

		const indexDest = path.join(name, 'index.html');
		promises.push(
			fs.writeFile(indexDest, data.packaged)
			.then(_ => fileUtil.insertScript(indexDest))
		);
		promises.push(fs.rename(data.png.path, path.join(name, 'img.png')));
		promises.push(fs.writeFile(path.join(name, 'link.txt'), data.link));

		return Promise.all(promises).then(_ => { return { success: true }}).catch(e => console.log(e));
	}
})();

function doError (files, errors) {
	fileUtil.deleteFiles(files);
	return Promise.resolve({ errors });
}

function escapeName (name) {
	return name.replaceAll('\'', '_').replaceAll(' ', '-');
}

function uploadFiles (name, files) {

	const checkedFiles = check.checkFiles(files);
	const checkedName = check.checkName(name);

	let errors = [];
	if (checkedName.errors) errors = errors.concat(checkedName.errors);
	if (checkedFiles.errors) errors = errors.concat(checkedFiles.errors);

	if (errors.length > 0) return doError(files, errors);
	
	const gameName = path.join(DROP_DIR, escapeName(name));

	return fs.mkdir(gameName).then(_ => {
		return addFilesToDir(files, gameName);
	}).then(msg => {
		return fileUtil.updateGameData(DROP_DIR).then(_ => msg);
	}).catch(e => {
		if (e.code === 'EEXIST') return doError(files, [`game name '${name}' has already been taken`]);
		else {
			console.log(e);
			return doError(files, [e]);
		}
	})
}

function uploadLink (name, link, png) {
	const checkedName = check.checkName(name);
	const checkedLink = check.checkLink(link);
	const checkedPng = check.checkFiles(png);

	let errors = [];
	if (checkedName.errors) errors = errors.concat(checkedName.errors);
	if (checkedLink.errors) errors = errors.concat(checkedLink.errors);
	if (checkedPng.errors) errors = errors.concat(checkedPng.errors);

	if (errors.length > 0) return doError(png, errors);

	const gameName = path.join(DROP_DIR, escapeName(name));

	return fs.mkdir(gameName)
		.then(_ => getPackaged(link))
		.then(packaged => addLinkUploadToDir({ packaged, png, link }, gameName))
		.then(msg => fileUtil.updateGameData(DROP_DIR).then(_ => msg))
		.catch(e => {

			if (e.code === 'EEXIST') return doError(png, [`game name '${name}' has already been taken`]);
			else {
				console.log(e);
				return doError(png, [e]);
			}
		})
}

module.exports = { uploadFiles, uploadLink, getFiles: fileUtil.getFiles };