/**
 * 定时检查脚本
 */
require('../common.js');

const exec = require('child_process').exec;

killTimeoutChrome();

function killTimeoutChrome() {
    const cmdStr = 'ps -A -opid,etime,args | grep "/protected/node_modules/_puppeteer"';
    // const cmdStr = 'ps -A -opid,etime,args | grep Chrome';
    exec(cmdStr, function(err, stdout, stderr){
        if (err) {
            console.log('get weather api error:' + stderr);
        } else {
            let rows = stdout.split("\n");
            let index = 1;
            for (let row of rows) {
                let data = getPidTime(row);
                let cmd = '';
                if (data.time > 60 * 60) {
                    // 强制kill
                    cmd = `kill -9 ${data.pid}`;
                } else if (data.time > 30 * 60) {
                    // 普通kill
                    cmd = `kill ${data.pid}`;
                }

                if (cmd) {
                    // console.log(`${index}: ${cmd}, time:${data.time}`);
                    exec(cmd, function(err, stdout, stderr) {
                        console.log(`${index}: ${cmd}, time:${data.time}, stdout:${stdout}, stderr:${stderr}`);
                    });
                    index++;
                }
            }
        }
    });
}

function getPidTime(row) {
    let pid = 0;
    let time = 0;
    let parts = row.trim().split(' ');
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        if (!pid) {
            pid = part;
        } else if (!time) {
            let timeParts = part.split(':');
            for (let j = timeParts.length - 1; j >= 0; j--) {
                time += timeParts[j] * Math.pow(60, timeParts.length - 1 - j);
            }
            break;
        }
    }

    return {pid, time};
}