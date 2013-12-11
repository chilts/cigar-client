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
var fs = require('fs');
var http = require('http');

// npm
var ini   = require('ini');
var paramify = require('paramify');

// local
var cfg = require('./lib/cfg.js');
var app = require('./lib/app.js');

// ----------------------------------------------------------------------------
// server

var server = http.createServer();
server.on('request', app);

var port = process.env.CIGAR_CLIENT_PORT || cfg.port || 9123;
server.listen(port, function() {
    console.log('Listening on port %s', port);
});

// ----------------------------------------------------------------------------
