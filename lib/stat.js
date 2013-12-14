// ----------------------------------------------------------------------------

// core
var fs = require('fs');
var qs = require('querystring');

// npm
var ini = require('ini');
var jsonquest = require('jsonquest');

// local
var cfg = require('./cfg.js');
var db = require('./db.js');
var log = require('./log.js');

// ----------------------------------------------------------------------------

// local
var stat = cfg.stat;

// load all the plugins
var statNames = Object.keys(stat);
statNames.forEach(function(statName) {
    // firstly, set some defaults
    stat[statName].name = statName;
    stat[statName].period = parseInt(stat[statName].period, 10) || 60;

    // now load the plugin itself
    stat[statName].plugin = require('cigar-plugin-' + stat[statName].type);

    // now start the stat collection for this stat
    nextStatCollection(cfg.main.name, stat[statName], db);
});

// returns the number of milliseconds until the next stat collection
function getNextStatTrigger(period) {
    return period - (Date.now() % period);
}

// wrap the plugin and the period
function nextStatCollection(serverName, stat, db) {
    // get the next time and the wait period for this stat to collect stats
    var now  = Date.now();
    var r = now % (stat.period*1000);
    var last = now - r;
    var next = last + stat.period * 1000;
    var wait = next - now;
    var date = new Date(next);

    // run this function when we need to collect new stats for this stat
    setTimeout(function() {

        // collect the stats
        stat.plugin(stat, function(err, data) {
            if (err) {
                console.error(err);
                return;
            }

            var msg = stat.name + ' - ' + JSON.stringify(data)
            log('Collected: ' + msg);

            // now save the data to LevelDB
            var key = 'stat!' + serverName + '!' + stat.type + '!' + stat.name + '!' + date.toISOString();
            db.put(key, data, function(err) {
                if (err) return console.error(err);
                log('Stored: ' + msg);
            });

            // in parrallel to saving to LevelDB, also tell our server
            jsonquest({
                host : cfg.main.serverhost,
                port : cfg.main.serverport,
                path : '/stat' + '?' + qs.stringify({ server : serverName, name : stat.name, type : stat.type, ts : date.toISOString() }),
                body : data,
                method : 'PUT',
                protocol : 'http',
            }, function (err, res, body) {
                if (err) {
                    log.warn('Send Failed: ' + err);
                    return;
                }
                log('Sent: ' + msg);
            });

            // prior to finishing the timeout, make sure it runs again soon!
            nextStatCollection(serverName, stat, db);
        });
    }, wait);

}

// ----------------------------------------------------------------------------

module.exports = stat;

// ----------------------------------------------------------------------------
