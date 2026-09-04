
const path = require('path');

module.exports = {
	dropDir: path.join(__dirname, '../../static/games'),
	uploadFields: [
		{ name: 'html', maxCount: 1 },
		{ name: 'png', maxCount: 1 },
		{ name: 'sb3', maxCount: 1 },
	],
};