const path = require('path');

function checkFiles (files) {

	const errors = [];

	if (files instanceof Array) {
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
	} else {

		if (!files) {
			errors.push('no png file found, make sure you upload one');
		} else {
			const extName = path.extname(files.originalname);
			if (extName !== '.png') errors.push(`expected a file with extension '.png' and got file '${files.originalname}' with extension '${extName}'`);
		}
	}
	
	if (errors.length > 0) return { errors };
	else return {success: true};
}

function checkName (name) {

	if (!name || (typeof name) !== 'string') return { errors: ['game name is required'] };
	if (name.match(/^[' ]|[^\w ']| (?= )|'(?=')|[' ]$/g)) return { errors: [`invalid game name: ${name}`] };
	if (name.length < 3 || name.length > 25) return { errors: ['game name must be between 3 and 25 characters in length'] };

	return { success: true };
}

function checkLink (link) {

	if (!link || (typeof link) !== 'string') return { errors: ["link is required"] };

	const url = new URL(link);

	const errors = [];

	const pathName = url.pathname.split('/');
	if (url.hostname !== 'scratch.mit.edu') errors.push(`expected 'scratch.mit.edu' link and found ${url.hostname}`);
	else if (pathName[1] !== 'projects' || !pathName[2].match(/^[0-9]+$/)) errors.push(`scratch link ${url.toString()} is not a link to a project`);

	if (errors.length > 0) return { errors };
	else return {success: true};
}

module.exports = { checkFiles, checkName, checkLink };