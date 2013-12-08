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
};

module.exports = function(prefix) {
    var cfg = xtend(defaults);

    console.log(cfg);

    return cfg;
};

// ----------------------------------------------------------------------------
