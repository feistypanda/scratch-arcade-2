
const fs = require('fs');
const path = require('path');

const Packager = require('@turbowarp/packager');

function getToken (id) {
	return fetch(`https://api.scratch.mit.edu/projects/${id}`)
		.then(response => response.json())
		.then(data => data.project_token);
}

function checkToken (token) {
	if (!token) return Promise.reject({ code: 'INVALIDSCRATCHID' });
	else return Promise.resolve(token);
}

function getProjectData (id, token) {
	return fetch(`https://projects.scratch.mit.edu/${id}?token=${token}`)
		.then(response => response.arrayBuffer())
}

function packageProject (loadedProject, title) {
	const packager = new Packager.Packager();
	packager.project = loadedProject;

	packager.options.autoplay = true;
	packager.options.app.windowTitle = title;

	return packager.package();
}

module.exports = function getPackaged (link, name) {

	const url = new URL(link);
	const id = url.pathname.split('/')[2];

	return getToken(id)
		.then(token => checkToken(token))
		.then(token => getProjectData(id, token))
		.then(projectData => Packager.loadProject(projectData))
		.then(loadedProject => packageProject(loadedProject, name))
		.then(result => result.data);
}