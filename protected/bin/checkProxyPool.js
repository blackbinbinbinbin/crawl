/**
 * 定时检查脚本
 */
require('../common.js');
const OujRedis = require('../framework/lib/OujRedis.js');
const php = require('phpjs');
const dwHttp = require('../framework/lib/dwHttp');
const TOTAL_KEY = 'globals:ip_proxy_pool:total';
const TOTAL_KEY_CHECK = 'globals:ip_proxy_pool:total_check:';
const objLogic = OujRedis.init('logic');
const Tool = require('../framework/lib/Tool');

async function main() {
    let list = await objLogic.zrange(TOTAL_KEY, 0, -1, 'WITHSCORES');
    for (let i = 0; i < list.length; i += 2) {
        let proxy = list[i];
        let score = list[i + 1];

        if (score > 10) {
            let proxyKey = TOTAL_KEY_CHECK + proxy;
            let flag = await objLogic.exists(proxyKey);
            if (flag) {
                continue;
            } else {
                objLogic.setex(proxyKey, 10, php.date('Y-m-d H:i:s'));
            }
        }

        requestByProxy(proxy);
    }

    setTimeout(main, 5000);
}

async function requestByProxy(proxy) {
    let request_time = (new Date).getTime();
    let objHttp = new dwHttp();
    objHttp.setProxy(proxy);
    // let url = `http://${server_ip}:${process.env.PORT}/proxy?proxy=${proxy}&request_time=${request_time}`;
    // let url = `http://localhost:${process.env.PORT}/proxy?proxy=${proxy}&request_time=${request_time}`;
    let url = `http://14.17.108.216:${process.env.PORT}/proxy?proxy=${proxy}&request_time=${request_time}`;
    // let url = `http://ka.duowan.com/user/centerRedPoint?_from=ajax`;

    let startTime = (new Date).getTime();
    objHttp.get(url, 10).then(async function(json) {
        let incr = 0;
        let span = (new Date).getTime() - startTime;
        try {
            let result = JSON.parse(json);
            if (result['result']) {
                if (span < 1000) {
                    incr = 10;
                } else if (span < 2000) {
                    incr = 5;
                } else if (span < 3000) {
                    incr = 1;
                } else if (span > 8000) {
                    incr = -5;
                } else if (span > 6000) {
                    incr = -3;
                }
            } else {
                incr = -20;
            }
        } catch (ex) {
            Tool.error(ex.message);
            incr = -20;
        }

        if (incr > 0) {
            objLogic.zincrby(TOTAL_KEY, incr, proxy);
        } else if (incr < 0) {
            let score = await objLogic.zscore(TOTAL_KEY, proxy);
            await objLogic.zrem(TOTAL_KEY, proxy);
            score += incr;
            if (score > 0) {
                objLogic.zadd(TOTAL_KEY, score, proxy);
            }
        }
        Tool.log(`proxy:${proxy}, span:${span}, incr:${incr}`);

    }).catch(async function(ex) {
        Tool.error(ex.message);
        let errArr = [
            'Error: connect ECONNREFUSED',
        ];

        for (let err of errArr) {
            if (ex.message.indexOf(err) >= 0) {
                // 代理失效要删除
                objLogic.zrem(TOTAL_KEY, proxy);
                Tool.log('remove proxy:' + proxy);
                return;
            }
        }

        // 请求超时
        // if (ex.message.indexOf('Error: ETIMEDOUT') >= 0) {
        let score = await objLogic.zscore(TOTAL_KEY, proxy);
        let desc = Math.ceil(parseInt(score) / 2);
        score = score - desc;
        if (score > 10) {
            score = 10;
        }

        await objLogic.zrem(TOTAL_KEY, proxy);
        if (score > 0) {
            await objLogic.zadd(TOTAL_KEY, score, proxy);
        }
        Tool.log('catch proxy:' + proxy + ', desc:' + desc);
        // }
    });
}

main();