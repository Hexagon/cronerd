function jobs () {
	// Look in /etc/cronerd/jobs.d/ for jobs, default user root, overridable by job configuration
	// Look in every enabled users home directory for .croner-jobs/ for user jobs, force user to username

	// Inventory of all jobs
	var inventory = [];
}

jobs.prototype.list = function () {
	
};

jobs.prototype.reload = function () {

};

module.exports = new jobs();