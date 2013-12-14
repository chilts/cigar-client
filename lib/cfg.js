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
var argh = require('argh')();

// ----------------------------------------------------------------------------

var config = argh.config || '/etc/cigar/server.json';
console.log('config:', config);

var defaults = {
    port  : 9124,
    store : '/var/lib/cigar/server/store',
    serverhost : 'localhost',
    serverport : 9124,
};

var main = xtend(
    {},
    defaults,
    JSON.parse(fs.readFileSync(config, 'utf8')),
    argh
);

var stat = main.stat;
delete main.stat;

console.log('cfg:', main);

// ----------------------------------------------------------------------------

module.exports = {
    main : main,
    stat : stat,
};

// ----------------------------------------------------------------------------
