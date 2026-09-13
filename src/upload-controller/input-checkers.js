const path = require('path');

function checkName (name) {

	if (!name || (typeof name) !== 'string') return { errors: ['game name is required'] };
	if (name.match(/^[' ]|[^\w ']| (?= )|'(?=')|[' ]$/g)) return { errors: [`invalid game name: ${name}`] };
	if (name.length < 3 || name.length > 18) return { errors: ['game name must be between 3 and 25 characters in length'] };

	return { success: true };
}

function checkLink (link) {

	if (!link || (typeof link) !== 'string') return { errors: ["link is required"] };

	let url;

	try {
		url = new URL(link);
	} catch (e) {
		return { errors: [`Invalid url '${link}'`] };
	}

	const pathName = url.pathname.split('/');

	if (url.hostname !== 'scratch.mit.edu') return { errors: [`link must be from 'scratch.mit.edu' and link '${url}' is not`] };
	if (pathName[1] !== 'projects' || !pathName[2].match(/^[0-9]+$/)) return { errors: [`scratch link ${url.toString()} is not a link to a project`] };

	return { success: true };
}

function checkImg (img) {
	if (!img) return { errors: ['image is required'] };
	if (img.mimetype.split('/')[0] !== 'image') return { errors: ['image must be an image'] };

	return { success: true };
}

function checkImgLink (link) {

	let url;
	try {
		url = new URL(link);

		if (url.hostname !== 'cdn2.scratch.mit.edu') throw('invalid');
		if (url.pathname.split('/')[1] !== 'get_image') throw('invalid');
	} catch (e) {
		return { errors: ['Image failure - try uploading thumbnail manually'] };	
	}

	return { success: true };
}

module.exports = { checkImg, checkName, checkLink, checkImgLink };