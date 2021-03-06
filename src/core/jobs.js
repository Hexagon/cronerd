var 
	fs = require("fs"),
	job = require("./job.js"),
	events = require('events'),
	bus = new events(),
	inventory = {};

function jobs () {
	
	// Look in /etc/cronerd/jobs.d/ for jobs, default user root, overridable by job configuration
	// Look in every enabled users home directory for .croner.jobs.d/ for user jobs, force user to username

	// Inventory of all jobs
	// inventoruy
	this.reload();
	
	return this;
}

jobs.prototype.list = function () {
	var retVal = [],
		job;
	inventory && Object.keys(inventory).forEach((path) => {
		job = inventory[path];
		retVal.push({ config: job.config, state: job.state })
	});
	return retVal;
};

jobs.prototype.reload = function () {

	var directory = process.cwd().replace(/\\/g,'/').replace(/\/$/,'') + '/jobs.d/';

	// Reload all jobs found in directory
	fs.readdir(directory, (err, files) => {
	  if (err) return;
	  files.forEach( file => {
	  	var path = directory+file;
	  	if (inventory[path]) {
	  		inventory[path].reload();
	  	} else {
	  		inventory[path] = new job(directory + file, bus); 
	  	}
	  } );
	});

	// Remove orphaned jobs
	

	return inventory;

};

jobs.prototype.get = function (name) {
	inventory && Object.keys(inventory).forEach((path) => {
		jobConfig = inventory[path].config;
		if (jobConfig.name == name) {
			return inventory[path];
		}
	});
	return false;
}

module.exports = new jobs();