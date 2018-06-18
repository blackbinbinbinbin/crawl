/**
 * 爬虫工人
 */
require('../common.js');

const php = require('phpjs');
// let cheerio = require('cheerio');
const Tool = require('../framework/lib/Tool.js');
const Spider = require('../models/Spider.js');

const TableHelper = require('../framework/lib/TableHelper.js');
const OujRedis  = require('../framework/lib/OujRedis');

const objTask = new TableHelper('task', 'crawl');
const objRedis = OujRedis.init('logic');
const objProcLog = new TableHelper('proc_log', 'crawl');
const prefix = 'globals:crawl:';
const HOST_MAX_NUM = DEBUG ? 1 : 20;
const RULE_MAX_NUM = DEBUG ? 1 : 8;
const { URL } = require('url');

let args = process.argv.splice(2);
let proc_index = args[0] || 0;
// let proc_num = args[1] || 1;
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

    await logProc(task);
    let flag = false;
    if (task) {
        let objSpider = new Spider(task);
        await objSpider.run();
        flag = true;
    } else {
        Tool.log(`no tasks need run.`);
    }
    await logProc();

    cb && cb(flag);
}

async function logProc(task) {
    task = task || {};
    let where = {server_ip, proc_id};
    let count = await objProcLog.getCount(where);
    let now = php.date('Y-m-d H:i:s');

    let host = '';
    if (task.url) {
        const taskUrl = new URL(task.url);
        host = taskUrl.host;
    }

    let data = {
        task_id : task.task_id || 0,
        rule_id : task.rule_id || 0,
        host : host,
        url : task.url || '',
        update_time : now
    };

    if (count > 0) {
        await objProcLog.updateObject(data, where);
    } else {
        let data2 = {
            server_ip,
            proc_id,
            create_time : now,
        };
        await objProcLog.addObject(Object.assign(data, data2));
    }
}

async function getTask(key) {
    let task_id = await objRedis.spop(prefix + key);
    if (!task_id) {
        return false;
    }

    let task = await objTask.getRow({task_id});

    let ruleCount = await objProcLog.getCount({rule_id:task.rule_id});
    let flag = ruleCount > RULE_MAX_NUM;
    if (!flag) {
        const taskUrl = new URL(task.url);
        let hostCount = await objProcLog.getCount({host:taskUrl.host});
        flag = hostCount > HOST_MAX_NUM;
        if (flag) {
            Tool.log(`Host, 当前数量：${hostCount}, 超过${taskUrl.host} 的最大限制：${HOST_MAX_NUM}`);
        }
    } else {
        Tool.log(`Rule, 当前数量：${ruleCount}, 超过${task.rule_id} 的最大限制：${RULE_MAX_NUM}`);
    }

    if (flag) {
        // 任务加回去
        await objRedis.sadd(prefix + key, task_id);
        return false;
    } else {
        return task;
    }
}

setTimeout(async function() {
    run(function _callback(flag) {
        let timeout = flag ? 100 : php.rand(5000, 10000);
        setTimeout(async function() {
            await run(_callback);
        }, timeout);
    });
}, 171 * proc_index);




