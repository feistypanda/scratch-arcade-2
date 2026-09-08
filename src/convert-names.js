
const path = require('path');
const fs = require('node:fs/promises');

const dir = '/Users/leo/Downloads/games';

function convert (name) {
	return String(name).charAt(0).toUpperCase() + String(name).slice(1).replace('-', '_s-');
}

fs.readdir(dir, { withFileTypes: true }).then(entries => {
	const folderNames = entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
	
	const promises = [];
	for (const i of folderNames) {
		promises.push(fs.rename(path.join(dir, i), path.join(dir, convert(i))));
	}

	Promise.all(promises).then(_ => console.log('success')).catch(e => console.log(e))
})