var $ = require("jquery");
var stripAnsi = require('strip-ansi');
var socket = require('./socket');
require("./style.css");

var hot = false;
var currentHash = "";

$(function() {
	$("body").html(require("./page.jade")());
	var iframe = $("#iframe");

	var contentPage = window.location.pathname.substr("/webpack-dev-server".length) + window.location.search;

	console.debug("Connecting to sockjs server...");
	iframe.hide();

	var onSocketMsg = {
		hot: function() {
			hot = true;
			iframe.attr("src", contentPage + window.location.hash);
		},
		invalid: function() {
			console.info("App updated. Recompiling...");
			if(!hot) iframe.hide();
		},
		hash: function(hash) {
			currentHash = hash;
		},
		"still-ok": function() {
			console.debug("App ready.");
			if(!hot) iframe.show();
		},
		ok: function() {
			reloadApp();
		},
		warnings: function() {
			console.warn("Warnings while compiling.");
			reloadApp();
		},
		errors: function(errors) {
			console.debug("App updated with errors. No reload!");
			console.log("Errors while compiling.");
			console.error(errors);
			iframe.hide();
		},
		"proxy-error": function(errors) {
			console.debug("Could not proxy to content base target!");
			console.error("Proxy error.", errors);
			iframe.hide();
		},
		close: function() {
			console.info("Disconnected.");
			console.debug("\n\n\n  Lost connection to webpack-dev-server.\n  Please restart the server to reestablish connection...\n\n\n\n");
			iframe.hide();
		}
	};

	socket("/sockjs-node", onSocketMsg);

	iframe.load(function() {
		console.debug("App ready.");
		iframe.show();
	});

	function reloadApp() {
		if(hot) {
			console.debug("App hot update.");
			try {
				iframe[0].contentWindow.postMessage("webpackHotUpdate" + currentHash, "*");
			} catch(e) {
				console.warn(e);
			}
			iframe.show();
		} else {
			console.debug("App updated. Reloading app...");
			try {
				var old = iframe[0].contentWindow.location + "";
				if(old.indexOf("about") == 0) old = null;
				iframe.attr("src", old || (contentPage + window.location.hash));
				old && iframe[0].contentWindow.location.reload();
			} catch(e) {
				iframe.attr("src", contentPage + window.location.hash);
			}
		}
	}

});
