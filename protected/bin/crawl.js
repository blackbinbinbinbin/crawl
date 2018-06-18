/**
 * Created by ben on 2017/10/24.
 */
require('../common.js');

let php = require('phpjs');
// let cheerio = require('cheerio');
let Tool = require('../framework/lib/Tool.js');
let Spider = require('../models/Spider.js');

// const puppeteer = require('puppeteer');
const TableHelper = require('../framework/lib/TableHelper.js');

// const STATE_EXECING = 0;
// const STATE_SUCC = 1;
// const STATE_ERROR = 2;
// const STATE_TIMEOUT = 3;
let args = process.argv.splice(2);
let proc_index = args[0] || 0;
let proc_num = args[1] || 1;
let server_ip = getServerIp();
let proc_id = process.pid;

async function run(cb) {
    // let startTime = (new Date).getTime();
    let task = null;
    if (proc_index === 0) {
        task = await getTask('headless');
    }

    if (!task) {
        task = await getTask('normal');
    }

    let flag = false;
    if (task) {
        let objSpider = new Spider(task);
        await objSpider.run();
        flag = true;
    } else {
        Tool.log(`no tasks need run.`);
    }

    logProc(task);

    cb && cb(flag);
}

async function logProc(task) {
    task = task || {};
    let objProcLog = new TableHelper('proc_log', 'crawl');
    let where = {server_ip, proc_id};
    let count = await objProcLog.getCount(where);
    let now = php.date('Y-m-d H:i:s');
    let data = {
        task_id : task.task_id || 0,
        rule_id : task.rule_id || 0,
        url : task.url || '',
        update_time : now
    };

    if (count > 0) {
        objProcLog.updateObject(data, where);
    } else {
        let data2 = {
            server_ip,
            proc_id,
            create_time : now,
        };
        objProcLog.addObject(Object.assign(data, data2));
    }
}

async function getTask(request_mode) {
    const objRule = new TableHelper('rule', 'crawl');
    let _field = 'rule_id';
    let enable = 1;
    let rule_ids = await objRule.getCol({enable, request_mode}, {_field});

    let len = rule_ids.length;
    let tempRule_id = [];
    if (proc_num > len) {
        tempRule_id.push(rule_ids[proc_index % len]);
    } else {
        for (let i = 0; i < len; i++) {
            if (i % proc_index) {
                tempRule_id.push(rule_ids[i]);
            }
        }
    }

    let task = null;
    if (tempRule_id.length) {
        task = await tryGetTask(tempRule_id);
    }

    if (!task) {
        task = await tryGetTask(rule_ids);
    }

    return task;
}

async function tryGetTask(rule_id) {
    const objTask = new TableHelper('task', 'crawl');
    let last_crawl_time = php.time();
    let _where = `next_crawl_time < ${last_crawl_time} `;
    if (php.empty(rule_id)) {
        return null;
    }

    let enable = 1;
    return await objTask.getRow({enable, rule_id}, {_where});
}

setTimeout(function() {
    run(function _callback(flag) {
        let timeout = flag ? php.rand(100, 500) : 3000;
        setTimeout(async function() {
            await run(_callback);
        }, timeout);
    });
}, proc_index * 271);



