
const fs = require('fs');
const path = require('path');

const Packager = require('@turbowarp/packager');

module.exports = async function getPackaged (link) {
	try {

		const url = new URL(link);
		const id = url.pathname.split('/')[2];

		// get project token from scratch api
		const response = await fetch(`https://api.scratch.mit.edu/projects/${id}`);
		const data = await response.json();
		const token = data.project_token;

		const projectData = await (await fetch(`https://projects.scratch.mit.edu/${id}?token=${token}`)).arrayBuffer();

		const loadedProject = await Packager.loadProject(projectData);

		const packager = new Packager.Packager();
		packager.project = loadedProject;

		packager.options.autoplay = true;

		const result = await packager.package();

		return result.data;

	} catch (e) {
		console.log(e);
		return { errors: 'error packaging project. Try again.'}
	}
}