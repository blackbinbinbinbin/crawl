#!/usr/bin/env node --harmony --trace_gc
require('../common.js');
const TableHelper = require('../framework/lib/TableHelper.js');
const exec = require('child_process').exec;
const Tool = require('../framework/lib/Tool.js');
const php = require('phpjs');

let server_ip = getServerIp();
checkZombieSpider();
// checkOutsideZombieSpider();

// 查数据库里面的进程
async function checkZombieSpider() {
    await checkOutsideZombieSpider();

    let objProcLog = new TableHelper('proc_log', 'crawl');
    let where = {server_ip};
    let keyWord = {'_field' : 'proc_id, update_time'};
    let datas = await objProcLog.getAll(where, keyWord);
    let len = datas.length;
    Tool.log(`找到${len}个进程正在运行.`);

    let now = (new Date).getTime();
    let cmd = '';
    let num = len + 1;
    for (let data of datas) {
        // 检查进程是否存在
        let proc_id = data.proc_id;
        cmd = `ps ${proc_id}`;
        exec(cmd, function(err, stdout, stderr) {
            let parts = stdout.trim().split('\n');
            if (parts.length <= 1) {
                Tool.log(`server_ip: ${server_ip}, 找不到进程${proc_id}，删除数据库数据`);
                // 找不到进程，需要删除数据库数据
                objProcLog.delObject({server_ip, proc_id}).then(function() {
                    checkExit(--num);
                });
            } else {
                // PID TTY      STAT   TIME COMMAND
                // 7943 ?        Sl     2:03 /usr/local/bin/node /data/webapps/spider.duowan.com/protected/index.js
                // 判断是否是爬虫进程，不要误杀。。。
                if (parts[1].indexOf('node ') === -1 || parts[1].indexOf('spider.duowan.com') === -1) {
                    // 不是node进程
                    Tool.log('不知道是什么鬼进程：' + parts[1]);
                    checkExit(--num);
                    return;
                }

                let cmd = false;
                // 检查是否超时
                let timespan = now - (new Date(data['update_time']));
                if (timespan > 180 * 1000) {
                    // 超时心跳要kill掉
                    cmd = `kill ${data.proc_id}`;
                } else if (timespan > 240 * 1000) {
                    cmd = `kill -9 ${data.proc_id}`;
                }

                if (cmd) {
                    Tool.log('timespan:' + timespan);
                    exec(cmd, function(err, stdout, stderr) {
                        Tool.log(`${cmd}, stdout:${stdout}, stderr:${stderr}`);
                        checkExit(--num);
                    });
                } else {
                    checkExit(--num);
                }
            }
        });
    }

    checkExit(--num);
}

// 检查外部野生的进程
async function checkOutsideZombieSpider() {
    let host = 'spider.duowan.com';
    if (ENV == ENV_DEV) {
        host = 'test.spider.duowan.com';
    }

    let cmd = `ps -A -opid,stime,etime,cmd | grep 'node /data/webapps/${host}/protected/bin/crawlWorker.js'`;
    // let cmd = "ps -A -opid,stime,etime,command | grep 'Google'";
    return new Promise(function(resolve, reject) {
        exec(cmd, async function(err, stdout, stderr) {
            let parts = stdout.trim().split('\n');
            if (parts.length <= 1) {
                Tool.log(`server_ip: ${server_ip}, 找不到crawlWorker进程`);
                resolve(server_ip);
            } else {
                // 58521 11:31       07:33 node /data/webapps/spider.duowan.com/protected/bin/crawlWorker.js 29
                // 58530 11:31       07:33 node /data/webapps/spider.duowan.com/protected/bin/crawlWorker.js 1
                // 获取这批进程
                let pids = {};
                for (let part of parts) {
                    if (part.indexOf(' grep ') > 0) {
                        continue;
                    }
                    let parts2 = part.trim().split(' ');
                    let pid = parts2[0];
                    pids[pid] = part.trim();
                }

                let objProcLog = new TableHelper('proc_log', 'crawl');
                let where = {server_ip};
                let keyWord = {'_field' : 'proc_id'};
                let datas = await objProcLog.getCol(where, keyWord);
                for (let pid of datas) {
                    delete pids[pid];
                }

                datas = [];
                let outside_pids = [];
                for (let pid in pids) {
                    let data = {server_ip};
                    data.proc_id = pid;
                    data.create_time = data.update_time = php.date('Y-m-d H:i:s');
                    datas.push(data);
                    outside_pids.push(pid);
                    Tool.log('流浪进程：' + pids[pid]);
                }

                if (datas.length) {
                    await objProcLog.addObjects2(datas);
                    Tool.log('checkOutsideZombieSpider, 添加了：' + outside_pids.join(','));
                }

                resolve(datas);
            }
        });
    });
}



async function moveLog(times) {
    times = times || 0;
    let time = php.time() - 2 * 86400;
    let tableName = 'crawl_log_' + php.date('Ymd', time);
    let objCrawlLog2 = new TableHelper(tableName, 'crawl');
    let flag = await objCrawlLog2.checkTableExist(tableName);
    if (!flag) {
        let sql = `CREATE TABLE ${tableName} LIKE _crawl_log`;
        await objCrawlLog2.objMySql.update(sql);
    }

    let objCrawlLog = new TableHelper('crawl_log', 'crawl');
    let time2  = php.time() - 86400;
    let datas = await objCrawlLog.getAll({}, {'_where' : "create_time < '" + php.date('Y-m-d', time2) + "'", '_limit' : 100 });
    if (!datas) return;

    await objCrawlLog2.replaceObjects2(datas);

    let log_id = [];
    for (let data of datas) {
        log_id.push(data.log_id);
    }

    if (log_id.length) {
        times++;
        await objCrawlLog.delObject({log_id});
        if (log_id.length >= 100 && times < 10) {
            await moveLog(times);
        }
    }
}


async function checkExit(num) {
    // Tool.log('checkExit:' + num);
    if (num <= 0) {
        await moveLog();
        process.exit(0);
    }
}
