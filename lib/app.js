// ----------------------------------------------------------------------------

// core
var url = require('url');

// npm
var express = require('express');

// local
var db = require('./db.js');
var stat = require('./stat.js');
var cfg = require('./cfg.js');
var log = require('./log.js');

// ----------------------------------------------------------------------------
// helpers

var stats = Object.keys(stat);

// ----------------------------------------------------------------------------
// the app

var app = express();

app.get('/', function(req, res) {
    res.send('/');
});

app.get('/stat', function(req, res) {
    var info = { stats : [] };
    stats.forEach(function(statName) {
        info.stats.push({
            name   : stat[statName].name,
            type   : stat[statName].type,
            period : stat[statName].period,
        });
    });
    log('/', info);
    res.json(info);
});

app.get('/stat/:statname', function(req, res, next) {
    // see if this stat exists
    if ( ! stat[req.params.statname] ) {
        return next();
    }

    // just get the latest
    var info;
    db.createReadStream({
        start   : cfg.name + '!' + req.params.statname + '!~',
        reverse : true,
        limit   : 1,
    })
        .on('data', function (data) {
            info = data.value;
            var parts = data.key.split('!');
            info.server = parts[0];
            info.type = parts[1];
            info.name = parts[2];
            info.ts = parts[3];
        })
        .on('close', function () {
            res.json(info);
        })
        .on('error', next)
    ;

});

// ----------------------------------------------------------------------------

module.exports = app;

// ----------------------------------------------------------------------------
