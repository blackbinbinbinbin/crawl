/**
 * 爬虫Master，定时发布任务
 */
require('../common.js');

let php = require('phpjs');
// let cheerio = require('cheerio');
let Tool = require('../framework/lib/Tool.js');

// const puppeteer = require('puppeteer');
const TableHelper = require('../framework/lib/TableHelper.js');
const OujRedis  = require('../framework/lib/OujRedis');

const objRule = new TableHelper('rule', 'crawl');
const objTask = new TableHelper('task', 'crawl');
const objRedis = OujRedis.init('logic');
const objProcLog = new TableHelper('proc_log', 'crawl');
const NUM = 30;
const FIRST_MAX_NUM = 5;
const prefix = 'globals:crawl:';

async function run(cb) {
    let keys = ['headless', 'normal'];
    let flag = false;
    for (let key of keys) {
        let len = await objRedis.scard(prefix + key);
        if (len < NUM * 4) {
            let task_id = await getTasks(key);
            if (task_id && task_id.length) {
                Tool.log(`${key} lpush task_id num:` + task_id.length);
                await objRedis.sadd(prefix + key, task_id);
                flag = task_id.length >= NUM;

                let next_crawl_time = php.time() + 60;
                objTask.updateObject({next_crawl_time}, {task_id})
            }
        }
    }

    cb && cb(flag);
}

async function getTasks(request_mode) {
    let _field = 'rule_id';
    let enable = 1;
    let rule_id = await objRule.getCol({enable, request_mode}, {_field});
    if (!rule_id || !rule_id.length) {
        return null;
    }

    // 排除正在执行的任务数>=2的规则
    let sql = 'SELECT rule_id FROM `proc_log` GROUP BY rule_id HAVING COUNT(*) >= ' + FIRST_MAX_NUM;
    let exclude_rule_id = await objProcLog.objMySql.getCol(sql);

    let tasks = await tryGetTasks(rule_id, exclude_rule_id);
    if (tasks && tasks.length > NUM / 2) {
        return tasks;
    }

    let tasks2 = await tryGetTasks(rule_id);
    if (tasks && tasks2) {
        return tasks2.concat(tasks);
    } else if (tasks) {
        return tasks;
    } else {
        return tasks2;
    }
}

async function tryGetTasks(rule_id, exclude_rule_id) {
    let last_crawl_time = php.time();
    let _where = `next_crawl_time < ${last_crawl_time} `;
    if (exclude_rule_id && exclude_rule_id.length) {
        _where += "AND rule_id NOT IN('" + exclude_rule_id.join("', '") + "')";
    }

    let _field = 'task_id';
    let enable = 1;
    let _sortKey = 'next_crawl_time ASC';
    return await objTask.getCol({enable, rule_id}, {_where, _field, _sortKey, _limit:NUM});
}

run(function _callback(flag) {
    let timeout = flag ? 1000 : 10000;
    setTimeout(async function() {
        await run(_callback);
    }, timeout);
});



