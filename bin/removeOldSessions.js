/**
 * Created by timowelde on 12.03.14.
 *
 * This file removes all sessions, which are older than 24 hours
 *
 */
require("ep_etherpad-lite/node_modules/npm").load({}, function(er,npm) {

    process.chdir(npm.root+'/..')

    var db = require("ep_etherpad-lite/node/db/DB");
    var dayAgo = new Date().getTime();
    dayAgo = Math.floor(dayAgo/1000)-86400;

    db.init(function() {
        var etherpadDB = db.db;
        var api = require('ep_etherpad-lite/node/db/API');
        var async = require("ep_etherpad-lite/node_modules/async");

        var sessionIDs = [];
        async.series([
            // Find invalid sessions
            function(callback) {
                // get all sessions
                etherpadDB.findKeys('session:*', null, function(err, keyValues) {
                    // Go through all found sessions
                    async.forEach(keyValues, function(element, callback){
                        var sessionID = element.split(':')[1];
                        // Get Session
                        api.getSessionInfo(sessionID, function(err,sessionInfo) {
                            if(err != null){
                                throw err;
                            }
                            // Is the session older than one day?
                            if(sessionInfo.validUntil < dayAgo) {
                                sessionIDs.push(sessionID);
                            }
                            callback();
                        });
                    }, function(err) {
                        if(err != null) throw err;
                        callback()
                    });
                });
            },
            // Delete found invalid sessions
            function(callback) {
                async.forEachSeries(sessionIDs, function(sessionID, callback){
                    api.deleteSession(sessionID, function(err) {
                        if(err != null){
                            throw err;
                        }
                        console.log(sessionID + " deleted");
                        callback();
                    });
                }, function(err) {
                    if (err != null) {
                        throw err;
                    }
                    // Close DB connection and shut down
                    etherpadDB.doShutdown(function() {
                        callback();
                        process.exit(0);
                    });
                });
            }

        ]); // end async.series

    }); // end db.init

});
