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

app.get('/server/', function(req, res) {
    // just list this server
    res.json([ cfg.main.name ]);
});

app.get('/server/:server', checkServerExists, function(req, res) {
    // send info about this server
    var info = {
        name : cfg.main.name,
    };

    stats.forEach(function(statName) {
        console.log(stat[statName]);
        if ( stat[statName].type in info.type ) {
            info.type[stat[statName].type]++;
        }
        else {
            info.type[stat[statName].type] = 1;
        }
    });

    res.json(info);
});

app.get('/server/:server/type/', checkServerExists, function(req, res) {
    // send info about this server
    var type = {};
    stats.forEach(function(statName) {
        type[stat[statName].type] = true;
    });
    return res.json(Object.keys(type).sort());
    stats.forEach(function(statName) {
        console.log(stat[statName]);
        if ( stat[statName].type in type ) {
            type[stat[statName].type].push(stat[statName].name);
        }
        else {
            type[stat[statName].type] = [ stat[statName].name ];
        }
    });
    res.json(type);
});

// List all the types for this server
app.get('/server/:server/type/', checkServerExists, function(req, res) {
    var theseStats = [];
    stats.forEach(function(statName) {
        theseStats.push({
            name   : stat[statName].name,
            type   : stat[statName].type,
            period : stat[statName].period,
        });
    });
    log('/', theseStats);
    res.json(theseStats);
});

app.get('/server/:server/type/:type/', function(req, res, next) {
    // get all these types
    var types = stats.map(function(statName) {
        return stat[statName];
    })
        .filter(function(stat) {
            if ( stat.type === req.params.type ) {
                return true;
            }
            return false;
        })
    ;

    res.json(types);
});

app.get('/server/:server/type/:type/stat/', function(req, res, next) {
    // get all these types
    var names = stats.map(function(statName) {
        return stat[statName];
    })
        .filter(function(stat) {
            if ( stat.type === req.params.type ) {
                return true;
            }
            return false;
        })
        .map(function(stat) {
            return stat.name;
        })
    ;

    res.json(names);
});

app.get('/server/:server/type/:type/stat/:statname', function(req, res, next) {
    // see if this stat exists
    if ( ! stat[req.params.statname] ) {
        return next();
    }

    return res.json(stat[req.params.statname]);

    // just get the latest
    var info;
    db.createReadStream({
        start   : cfg.main.name + '!' + req.params.type + '!' + req.params.statname + '!~',
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

app.get('/server/:server/type/:type/stat/:statname/latest', function(req, res, next) {
    // see if this stat exists
    if ( ! stat[req.params.statname] ) {
        return next();
    }

    // just get the latest
    var info;
    db.createReadStream({
        start   : cfg.main.name + '!' + req.params.type + '!' + req.params.statname + '!~',
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

app.get('/server/:server/type/:type/stat/:statname/count', function(req, res, next) {
    // see if this stat exists
    if ( ! stat[req.params.statname] ) {
        return next();
    }

    // get them all
    var count = 0;
    db.createReadStream({
        start   : cfg.main.name + '!' + req.params.type + '!' + req.params.statname + '!',
        end     : cfg.main.name + '!' + req.params.type + '!' + req.params.statname + '!~',
    })
        .on('data', function (data) {
            count++;
        })
        .on('close', function () {
            res.json(count);
        })
        .on('error', next)
    ;
});

app.get('/server/:server/type/:type/stat/:statname/archive', function(req, res, next) {
    // see if this stat exists
    if ( ! stat[req.params.statname] ) {
        return next();
    }

    // get them all
    var stats = [];
    db.createReadStream({
        start   : cfg.main.name + '!' + req.params.type + '!' + req.params.statname + '!',
        end     : cfg.main.name + '!' + req.params.type + '!' + req.params.statname + '!~',
    })
        .on('data', function (data) {
            var info = data.value;
            var parts = data.key.split('!');
            info.ts = parts[3];
            stats.push(info);
        })
        .on('close', function () {
            res.json(stats);
        })
        .on('error', next)
    ;
});

// ----------------------------------------------------------------------------
// middleware helpers

function checkServerExists(req, res, next) {
    if ( req.params.server !== cfg.main.name ) {
        res.statusCode = 404;
        res.end('404 - Not Found\r\n');
        return;
    }
    next();
}

// ----------------------------------------------------------------------------

module.exports = app;

// ----------------------------------------------------------------------------
