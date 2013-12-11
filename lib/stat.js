// ----------------------------------------------------------------------------

// core
var fs = require('fs');

// npm
var ini = require('ini');

// local
var cfg = require('./cfg.js');
var db = require('./db.js');
var log = require('./log.js');

// ----------------------------------------------------------------------------

// local
var stat = ini.parse(fs.readFileSync('/etc/cigar/client-stats.ini', 'utf8'));

// load all the plugins
var statNames = Object.keys(stat);
statNames.forEach(function(statName) {
    // firstly, set some defaults
    stat[statName].name = statName;
    stat[statName].period = parseInt(stat[statName].period, 10) || 60;

    // now load the plugin itself
    stat[statName].plugin = require('cigar-plugin-' + stat[statName].type);

    // now start the stat collection for this stat
    nextStatCollection(cfg.name, stat[statName], db);
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

            // now save the data to LevelDB
            var key = serverName + '!' + stat.type + '!' + stat.name + '!' + date.toISOString();
            db.put(key, data, function(err) {
                if (err) return console.error(err);
                log(stat.name, data);
            });
        });

        // prior to finishing the timeout, make sure it runs again soon!
        nextStatCollection(serverName, stat, db);
    }, wait);

}

// ----------------------------------------------------------------------------

module.exports = stat;

// ----------------------------------------------------------------------------
