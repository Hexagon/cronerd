var template = `
Usage

  cronerctl list		List jobs
  cronerctl reload		Reload all jobs
	
  cronerctl tail		Tail cronerd log

  cronerctl start <jobname>	Start a single job
  cronerctl reload <jobname> 	Reload and reset
  cronerctl force <jobname> 	Forcefully start a disabled/expired job
  cronerctl status <jobname> 	Yes
`;

module.exports = function () {
	console.log(template);
};