"use strict";

const xpipe = require('xpipe'),
	  bus = require('qbus')(),
	  net = require('net'),

	  extend = require('util')._extend,

	  serverDefaults = {
	  	path: '/tmp/node-ipc.sock',
	  	reconnect: 2000,
	  	encoding: 'utf8'
	  },

	  clientDefaults = {
	  	path: '/tmp/node-ipc.sock',
	  	reconnect: -1,
	  	encoding: 'utf8'
	  };

function IPC () { return this; }

IPC.prototype.listen = function (options) {

	var server 	= net.createServer(function(c) {}),
		opts 	= extend(extend({}, serverDefaults), options),
		sockets = [],
		reconnectTimer;

	server.listen(xpipe.eq(opts.path));

	server.on('connection', function (socket) { 
		sockets.push(socket);
		socket.setEncoding(opts.encoding);
		socket.on('data', (data) => {
			try {
				bus.emit('data', JSON.parse(data), socket) 
			} catch (e) {
				bus.emit('error', e);
			}
		});
		socket.on('close', (socket) => { 
			bus.emit('disconnect', socket);
			sockets.splice(sockets.indexOf(socket), 1)
		});
		bus.emit('connection', socket);
	});
	server.on('error', (e) => bus.emit('error', e) );
	server.on('listening', () => bus.emit('listening', { path: opts.path} ) );
	server.on('close', function () { 
		bus.emit('close');
		if (opts.reconnect > 0) {
			reconnectTimer = setTimeout(function () {
				server.listen(options);
			}, opts.reconnect);
		}
	});
	bus.on('write', function (socket, data, callback) {
		try {
			socket.write(JSON.stringify(data));
			callback && callback();
		} catch (e) {
			if (callback) {
				callback(e);
			} else {
				bus.emit('error', e);
			}
		}		
	});
	bus.on('broadcast', function (data, callback) {
		try {
			let json = JSON.stringify(data);
			sockets.forEach(function(socket) {
				socket.write(json);
			});
			callback && callback();
		} catch (e) {
			if (callback) {
				callback(e);
			} else {
				bus.emit('error', e);
			}
		}
	});
	bus.on('closing', () => {
		opts.reconnect = -1;
		if (reconnectTimer) clearTimeout(reconnectTimer);
		server.close(); 
	});

	return this; 
};

IPC.prototype.connect = function (options) {

	var socket 	= new net.Socket(),
		opts 	= extend(extend({}, clientDefaults), options);

	socket.setEncoding(opts.encoding);

	socket.connect(xpipe.eq(opts.path));

	socket.on('connect', (data) => bus.emit('connect', data) );
	socket.on('data', (data) => {
		try {
			bus.emit('data', JSON.parse(data));
		} catch (e) {
			bus.emit('error', e);
		}
	});
	socket.on('error', (e) => bus.emit('error', e) );

	socket.on('close', function () { 
		bus.emit('close');
		if(opts.reconnect > 0) {
			setTimeout(function () {
				socket.connect(opts.path);
			}, opts.reconnect);
		}
	});

	bus.on('write', function (data, callback) {
		try {
			socket.write(JSON.stringify(data));
			callback && callback();
		} catch (e) {
			if (callback) {
				callback(e);
			} else {
				bus.emit('error', e);
			}
		}
	});

	bus.on('closing', () => socket.destroy() );

	return this; 
};

IPC.prototype.on = function (event, callback) { bus.on(event, callback); return this; };

IPC.prototype.write = function (socket, data, callback) { bus.emit('write', socket, data, callback); return this; };
IPC.prototype.broadcast = function (data, callback) { bus.emit('broadcast', data, callback); return this; };

IPC.prototype.close = function () { bus.emit('closing'); return this; };

module.exports = IPC;