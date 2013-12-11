module.exports = function(statName, info) {
    console.log((new Date()).toISOString() + ' - ' + statName + ' : ' + JSON.stringify(info));
}
