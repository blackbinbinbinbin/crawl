#!/usr/bin/env node --harmony --trace_gc
let cluster = require('cluster');
let http = require('http');

if (cluster.isMaster) {
    let num = require('os').cpus().length;
    num = num / 4;
    for (let i = 0; i < num; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        console.error('worker ' + worker.process.pid + ' died');
        cluster.fork();
    });

    cluster.on('listening', function(worker, address) {
        console.log("A worker with #" + worker.id + " is now connected to "
            + address.address + ":" + address.port);
    });

} else {
    let app = require('./app.js');

    let port = process.env.PORT || '3000';
    app.set('port', port);
    let server = http.createServer(app);

    server.listen(port);
}
