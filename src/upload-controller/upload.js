
const path = require('path');
const fs = require('node:fs/promises');
const normalFs = require('fs');
const check = require('./input-checkers');
const fileUtil = require('../utils/file-utils');
const getPackaged = require('./packager')
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const config = require('../config/config');
const uploadFields = config.uploadFields;
const DROP_DIR = config.dropDir;

const uploadToDir = (() => {
	return function (data, dir) {
		const errors = [];
		const promises = [];

		// HTMl file
		const indexDest = path.join(dir, 'index.html');
		promises.push(
			fs.writeFile(indexDest, data.packaged)
			.then(_ => fileUtil.insertScript(indexDest))
			.catch(e => { return { code: 'HTMLERROR' } })
		);

		// image file
		if (data.img) {

			// Image is in the form of  a file
			const imgName = data.img.originalname;
			const imgNewName = path.join(dir, 'img.' + imgName.split('.')[1])
			promises.push(
				fs.rename(data.img.path, imgNewName)
				.catch(e => { return { code: 'IMGERROR' } })
			);
		} else {

			// Image is in the form of a link
			promises.push(
				fetch(data.imgLink)
				.then(response => {

					const splitName = data.imgLink.split('.');
					const destination = path.join(dir, 'img.' + splitName[splitName.length - 1]);
					const fileStream = normalFs.createWriteStream(destination, { flags: 'wx' });

					finished(Readable.fromWeb(response.body).pipe(fileStream));
				})
				.catch(e => { return { code: 'IMGLINKERROR' } })
			);
		}

		// link
		promises.push(
			fs.writeFile(path.join(dir, 'link.txt'), data.link)
			.catch(e => { return { code: 'LINKERROR' } })
		);

		return Promise.all(promises).then(_ => { return { success: true }});
	}
})();

function escapeName (name) {
	return name.replaceAll('\'', '_').replaceAll(' ', '-');
}

function success (msg) {
	if (msg) return { success: true, msg };
	else return { success: true };
}

function error (msg) {
	return fileUtil.clearDir('./.tmp-uploads').then(_ => {

		if (msg && (msg instanceof Array)) return { errors: msg };
		else if (msg) return { errors: [msg] };
		else return { errors: ['error'] };

	});
}

function upload (name, link, img) {

	const imageType = (typeof img === 'string') ? 'link' : 'file';

	const checkedName = check.checkName(name);
	const checkedLink = check.checkLink(link);

	let checkedImg;
	if (imageType === 'link') checkedImg = check.checkImgLink(img);
	else checkedImg = check.checkImg(img);

	let errors = [];
	if (checkedName.errors) errors = errors.concat(checkedName.errors);
	if (checkedLink.errors) errors = errors.concat(checkedLink.errors);
	if (checkedImg.errors) errors = errors.concat(checkedImg.errors);

	if (errors.length > 0) return Promise.resolve(error(errors));

	const gameDir = path.join(DROP_DIR, escapeName(name));

	return fs.mkdir(gameDir)
		.then(_ => getPackaged(link, name))
		.then(packaged => {
			const data = { packaged, link };
			if (imageType === 'file') data.img = img;
			else data.imgLink = img

			return uploadToDir(data, gameDir)
		})
		.then(error => { if (error.code) return Promise.reject(error)})
		.then(_ => fileUtil.updateGameData(DROP_DIR))
		.then(_ => success())
		.catch(e => {

			if (e.code === 'EEXIST') return error(`game name '${name}' is already taken`);

			fs.rm(gameDir, { recursive: true, force: true }).catch(e => console.log(e));
			fs.unlink(png.path).catch(e => console.log(e));
			fileUtil.updateGameData(DROP_DIR);
			
			if (e.code === 'INVALIDSCRATCHID') return error(`invalid scrach link '${link}'. make sure you shared your project`);
			if (e.code === 'IMGLINKERROR') return error('Error uploading your image. Try manually choosing thumbnail');
			if (e.code === 'IMGERROR') return error('Error uploading your image. This probably isnt your fault');
			if (e.code === 'HTMLERROR') return error('Error uploading your game. This probably isnt your fault');
			if (e.code === 'LINKERROR') return error('Error saving your game link. This probably isnt your fault');
			
			console.log(e);
			return { errors: [e] };
		})

}

module.exports = upload;