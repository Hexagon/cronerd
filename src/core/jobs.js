var 
	qbus = require("qbus"),
	fs = require("fs"),
	job = require("./job.js"),
	bus = new qbus(),

	inventory;

function jobs (log) {
	
	this.log = log;
	// Look in /etc/cronerd/jobs.d/ for jobs, default user root, overridable by job configuration
	// Look in every enabled users home directory for .croner.jobs.d/ for user jobs, force user to username

	// Inventory of all jobs
	// inventoruy
	this.reload();

	return this;
}

jobs.prototype.list = function () {
	var retVal = [];
	inventory && inventory.forEach((job) => {
		retVal.push({ config: job.getConfig(), state: job.getState() })
	});
	return retVal;
};

jobs.prototype.reset = function () {
	inventory && inventory.forEach((job) => {
		job.stop();
	});

	// Total refresh of inventory
	inventory = [];
};

jobs.prototype.reload = function () {

	var directory = process.cwd().replace(/\\/g,'/').replace(/\/$/,'') + '/jobs.d/';
	
	this.reset();

	fs.readdir(directory, (err, files) => {
	  if (err) return;
	  files.forEach(file => { inventory.push(new job(directory + file, this.log)) } );
	});

	return true;

};

module.exports = jobs;