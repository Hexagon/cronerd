var 
	qbus = require("qbus"),
	fs = require("fs"),
	job = require("./job.js"),
	bus = new qbus(),

	inventory;

function jobs () {
	
	// Look in /etc/cronerd/jobs.d/ for jobs, default user root, overridable by job configuration
	// Look in every enabled users home directory for .croner.jobs.d/ for user jobs, force user to username

	// Inventory of all jobs
	// inventoruy
	this.reload();
}

jobs.prototype.list = function () {
	return inventory;
};

jobs.prototype.reset = function () {
	inventory && inventory.forEach((job) => {
		job.stop();
	});

	// Total refresh of inventory
	inventory = [];
};

jobs.prototype.reload = function () {

	this.reset();
	
	fs.readdir('./jobs.d/', (err, files) => {
	  files.forEach(file => inventory.push(new job('./jobs.d/' + file)) );
	});

};

module.exports = new jobs();