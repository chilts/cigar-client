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

// npm
var xtend = require('xtend');
var ini = require('ini');

// ----------------------------------------------------------------------------
// Order of config is this:
//
// * defaults
// * main config file (e.g. /etc/cigar/client.conf
// * config file specified on command line (e.g. client.conf)
// * environment variables
// * command line options

var defaults = {
    store : '/var/lib/cigar-client/store',
    ini   : '/etc/cigar/client-config.ini',
};

var cfg = xtend(
    {},
    defaults,
    ini.parse(fs.readFileSync('/etc/cigar/client-config.ini', 'utf8'))
);

console.log('cfg:', cfg);

// ----------------------------------------------------------------------------

module.exports = cfg;

// ----------------------------------------------------------------------------
