#!/usr/bin/env node
// ----------------------------------------------------------------------------
//
// cigar-client
//
// * https://github.com/chilts/cigar-client
// * https://npmjs.org/package/cigar-client
//
// Copyright 2013 Andrew Chilton. All Rights Reserved.
//
// License: MIT
//
// ----------------------------------------------------------------------------

// core
var http = require('http');
var url = require('url');

// npm
var async = require('async');
var nconf = require('nconf');
var level = require('level');
var flake = require('flake')('eth0');

// local
var cfg = require('./lib/cfg.js')();

// ----------------------------------------------------------------------------
// plugins

var plugin = {};

// loop through which plugins we want loaded
var plugins = process.env.CIGAR_PLUGINS || ['os', 'mem'];
plugins.forEach(function(pluginName) {
    plugin[pluginName] = require('cigar-plugin-' + pluginName);
});

// ----------------------------------------------------------------------------
// the datastore

// open the LevelDB
var db = level(cfg.store, { valueEncoding : 'json' });

// ----------------------------------------------------------------------------
// stats collection

// collect stats every 60 seconds
// var boundary = 60 * 1000;
var boundary = 15 * 1000;

// gether() - will get everything together and put it into LevelDB
function gather() {
    var date = (new Date());
    plugins.forEach(function(pluginName) {
        // gether these stats
        plugin[pluginName](function(err, info) {
            if (err) {
                console.error(err);
                return;
            }

            log(pluginName, info);

            var key = pluginName + '~' + date.toISOString();
            db.put(key, info, function(err) {
                if (err) return console.error(err);
            });
        });
    });

    // let's do this again in a minute
    setTimeout(gather, getNextStatTrigger() );
}

// trigger the first timeout on the next minute boundary
var now = Date.now();
setTimeout(gather, getNextStatTrigger() );

function getNextStatTrigger() {
    return boundary - (Date.now() % boundary);
}

// ----------------------------------------------------------------------------
// server

var server = http.createServer();
server.on('request', function(req, res) {
    var data;

    // figure out which plugin to do
    var pluginName = url.parse(req.url).pathname.substr(1);

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
