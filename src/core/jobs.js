var 
	qbus = require("qbus"),
	fs = require("fs"),
	job = require("./job.js"),
	bus = new qbus(),

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
		retVal.push({ config: job.getConfig(), state: job.getState() })
	});
	return retVal;
};

jobs.prototype.reload = function () {

	var directory = process.cwd().replace(/\\/g,'/').replace(/\/$/,'') + '/jobs.d/';

	// ToDo: Remove disappeared jobs?

	fs.readdir(directory, (err, files) => {
	  if (err) return;
	  files.forEach( file => {
	  	var path = directory+file;
	  	if (inventory[path]) {
	  		inventory[path].reload();
	  	} else {
	  		inventory[path] = new job(directory + file); 
	  	}
	  } );
	});

	return inventory;

};

module.exports = new jobs();