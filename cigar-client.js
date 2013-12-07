#!/usr/bin/env node
// ----------------------------------------------------------------------------
//
// cigar-client.js
//
// Copyright 2013 Andrew Chilton. All Rights Reserved.
//
// License: MIT
//
// ----------------------------------------------------------------------------

// core
var http = require('http');

// ----------------------------------------------------------------------------
// plugins

var plugin = {};

// loop through which plugins we want loaded
var plugins = process.env.CIGAR_PLUGINS || ['os', 'mem'];
plugins.forEach(function(pluginName) {
    plugin[pluginName] = require('cigar-plugin-' + pluginName);
});

// ----------------------------------------------------------------------------
// server

var server = http.createServer();
server.on('request', function(req, res) {
    var data;

    // figure out which plugin to do
    var pluginName = req.url.substr(1);

    if ( pluginName === '' ) {
        // just list all the plugins available on this client
        data = {
            ok   : true,
            info : Object.keys(plugin),
        };
        log('home', Object.keys(plugin));
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data) + "\n");
    }
    else if ( pluginName === 'all' ) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ ok : false, err : 'ToDo' }) + "\n");
        log('all', 'ToDo');
    }
    else if ( plugin[pluginName] ) {
        plugin[pluginName](function(err, info) {
            data = {
                ok   : true,
                info : info,
            };
            log(pluginName, info);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(data) + "\n");
        });
    }
    else {
        data = {
            ok  : false,
            err : 'Unknown plugin ' + pluginName,
        };
        log(pluginName, 'Unknown plugin');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data) + "\n");
    }
});

var port = process.env.CIGAR_CLIENT_PORT || 9599;
server.listen(port, function() {
    console.log('Listening on port %s', port);
});

// ----------------------------------------------------------------------------

function log(pluginName, info) {
    console.log((new Date()).toISOString() + ' - ' + pluginName + ' : ' + JSON.stringify(info));
}

// ----------------------------------------------------------------------------
