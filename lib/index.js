/**
* @overview AdvTxt-telnet is a telnet interface for testing AdvTxt on a local 
*  network. You know, with friends. Has absolutely no security.
*
* @author Nathan Wittstock <code@fardogllc.com>
* @license MIT License - See file 'LICENSE' in this project.
* @version 0.0.1
*/
'use strict';

var telnet = require('telnet');
var i18n = new (require('i18n-2'))({ locales: ['en']});

var advtxt = {}

/**
 * Constructs a new AdvTxt-telnet server
 *
 * @since 0.0.1
 * @constructor
 * @param {advtxt} advtxt - The advtxt instance to be used.
 * @param {object} opt - An object containing options.
 */
exports = module.exports = advtxt.TelnetClient = function (advtxt, opt) {
	var self = this;

	self.advtxt= advtxt;

	self.telnetserver = telnet.createServer(self.clientConnected.bind(self)).listen(6223);
};

/**
 * Processes text that has come in via the telnet. Generates a {command} object.
 *
 * @since 0.0.1
 * @param {string} commandText - The raw text command that was received.
 */
advtxt.TelnetClient.prototype.processCommand = function (commandText, client) {
	var self = this;

	// build the command object
	var command = {
		command: commandText,
		player: client.username,
    replies: [],
		done: function(command) {
      var message = "";
      command.replies.forEach(function (reply) {
        message += reply + " ";
      });
			var messageLength = message.length + 17;
			if (messageLength > 140) messageLength = "!!!" + messageLength + "!!!";
			client.write(message + '(' + messageLength + ')\n');
		}
	};

	// send it off to advtxt's command processor
	self.advtxt.processCommand(command);
};


/**
 * Receives the client when a new person connects to the telnet server.
 *
 * @since 0.0.1
 * @param {client} client - The telnet client that has connected.
 */
advtxt.TelnetClient.prototype.clientConnected = function(client) {
	var self = this;

	// make unicode chars transmit correctly
	client.do.transmit_binary();

	// listen for the actual data from the client
  client.on('data', function (b) {
		var self = this;

		// make the buffer into a string for consumption by advtxt
		b = b.toString('utf8').replace(/\r?\n/g, '\r\n');

		// if we haven't seen a username yet, we need to set one. the client is 
		// just trusted here.
		if (typeof client.username === 'undefined') {
			client.username = b;
			client.write('Username is now ' + client.username);
		}
		// otherwise, process the command
		else {
			self.processCommand(b, client);
		}
  }.bind(self));

	// give a friendly message on first connection, and ask for username
  client.write('\nConnected to AdvTxt server!\nUsername? ');
};

