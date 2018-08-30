/**
 * Created by ben on 2017/10/24.
 */
const php = require('phpjs');
let cheerio = require('cheerio');
const request = require('request-promise');
const Tool = require('../framework/lib/Tool.js');
const iconv = require('iconv-lite');
const Http = require("http");
const zlib = require('zlib');
const Browser = require('../models/Browser');
const AmcMsg = require('../models/AmcMsg');

// 回调里面可能回用到
const JTool = require('./JTool');
const OujRedis = require('../framework/lib/OujRedis');
const dwHttp = require('../framework/lib/dwHttp.js');

const URL = require('url');
const puppeteer = require('puppeteer');
const TableHelper = require('../framework/lib/TableHelper.js');

const MapData = require('./MapData.js');
const ProxyPool = require('./ProxyPool');
let pagePool = {};

let uaList = [
    'Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1; 125LA; .NET CLR 2.0.50727; .NET CLR 3.0.04506.648; .NET CLR 3.5.21022)',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.108 Safari/537.36 2345Explorer/8.8.3.16721',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 BIDUBrowser/8.7 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15063',
    'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.104 Safari/537.36 Core/1.53.3427.400 QQBrowser/9.6.12513.400',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:38.0) Gecko/20100101 Firefox/38.0',
    'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.3) Gecko/2008092416 Firefox/3.0.3',
];

class Spider {

    /**
     * 基本类，提供增删改查
     * @param {string} task 表名
     */
    constructor(task) {
        this.task = task;
        // this.dbKey = dbKey || 'default';
        // this.objMySql = new MySql(this.dbKey);

        this.STATE_EXECING = 0;
        this.STATE_SUCC = 1;
        this.STATE_ERROR = 2;
        this.STATE_TIMEOUT = 3;
        this.STATE_PART_SUCC = 4;
        this.STATE_PROXY_ERROR = 5;

        this.INSERT_TYPE_ONLY_INSERT = 'only_insert';
        this.INSERT_TYPE_ONLY_UPDATE = 'only_update';
        this.INSERT_TYPE_UPDATE = 'update';

        this.state = this.STATE_SUCC;
        this.skip = false;
        this.http_code = 0;
        Tool.startRecordLog();
    }

    async run(preview) {
        const objTask = new TableHelper('task', 'crawl');
        const objRule = new TableHelper('rule', 'crawl');
        this.rule = await objRule.getRow({'rule_id' : this.task['rule_id']});
        if (!this.rule) {
            await objTask.updateObject({'enable' : 0}, {'task_id' : this.task.task_id});
            Tool.error(`error task have no rule. task_id:${this.task.task_id}, rule_id:${this.task.rule_id}`);
            return false;
        }
        await this._mergeRule();
        await this._delayRun();

        let startTime = (new Date).getTime();

        let result = {};
        if (!preview) {
            result = await this._logStart();
        }

        // 找这个任务的规则
        const objItem = new TableHelper('item', 'crawl');
        let items = await objItem.getAll({'rule_id' : this.task.rule_id, 'enable' : 1});
        await this._mergeItems(items);

        let content = '';
        let data = {};

        try {
            Tool.log(`爬虫：${this.task.url}`);
            Tool.log(`请求模式：${this.rule.request_mode}，更新模式：${this.rule.update_mode}`);
            JTool.initUrl(this.task.url);

            //this.rule.request_mode = 'headless';
            if (this.rule.request_mode === 'headless') {
                content = await this._headless();
            } else {
                content = await this._request();
            }
            

            // let objRedis = OujRedis.init('logic');
            // content = await objRedis.get('globals:url_map:http://14.17.108.216:9998/previewRule?rule_id=steam:game_data:steamdb&url=');
            Tool.log('http code:' + this.http_code);
            if (preview) {
                return content;
            }

            if (this.skip) {
                Tool.log('预处理返回了false，当作成功，并跳过处理');
                this.state = this.STATE_SUCC;
                this.http_code = 200;
                if (this.rule.request_mode === 'headless') {
                    await this.scoreBrowser(this.http_code);
                }
            } else if (!content || content.length <= this.rule.min_length) {
                // 代理出问题，当作超时处理
                Tool.log('内容过短，代理出问题');
                if (this.rule.request_mode === 'headless') {
                    await this.scoreBrowser(0);
                }
                this.state = this.STATE_TIMEOUT;
            } else {
                if (this.rule.request_mode === 'headless') {
                    await this.scoreBrowser(200);
                }
                
                Tool.log('开始分析页面');
                let $ = null;
                let $el = null;
                if (this.rule['data_type'] === 'html') {
                    $ = cheerio.load(content, { decodeEntities: false });
                } else if (this.rule['data_type'] === 'json') {
                    $el = JSON.parse(content);
                }

                JTool.initJquery($);
                for (let item of items) {
                    try {
                        let ret = this._handle(item, $, $el);
                        if (!ret) {
                            if (item.require) {
                                this.state = this.STATE_ERROR;
                                Tool.error('lack of required field:' + item.field_name);
                                break;
                            } else {
                                Tool.log('skip not found field:' + item.field_name);
                                continue;
                            }
                        }

                        let {value, task_key} = ret;
                        data[item.field_name] = value;
                        if (item.next_rule_id) {
                            await this._addNewTask(item, value, task_key);
                        }
                    } catch (ex) {
                        this.state = this.STATE_PART_SUCC;
                        let errorMsg = `error item:${item.field_name}\nselector:${item.selector}\nfetch_value:\n${item.fetch_value}`;
                        if (item.new_task_key) {
                            errorMsg += '\n\nnew_task_key:\n' + item.new_task_key;
                        }
                        Tool.log(errorMsg);
                        Tool.error(ex.stack);
                    }

                    if (item.require && !data[item.field_name]) {
                        this.state = this.STATE_ERROR;
                        Tool.error(`lack of require item:${item.field_name}\nselector:${item.selector}\nfetch_value:\n${item.fetch_value}`);
                        break;
                    }
                }

                if (this.state !== this.STATE_ERROR) {
                    await this._insertData(result.insertId, items, data);
                }
            }

            await this._logEnd(result.insertId, content, data, startTime);
        } catch (ex) {
            if (this.rule.request_mode === 'headless') {
                await this.closeBrowser();
            }
            Tool.err(ex.message);
            Tool.err(ex.stack);

            if (preview) {
                return ex.stack;
            }

            this._preprocess(ex.message);
            // 如果需要跳过，则跳过
            let flag2 = false;
            if (!this.skip) {
                // 代理出问题的情况
                let flag = ex.message.indexOf("Error: ") >= 0;
                flag = flag || ex.message.indexOf("net::") >= 0;

                // 代理访问慢的情况
                flag2 = ex.message.indexOf('Navigation Timeout Exceeded') >= 0;
                flag2 = flag2 || ex.message.indexOf("Most likely the page has been closed") >= 0;
                if (flag) {
                    this.state = this.STATE_PROXY_ERROR;
                } else if (flag2) {
                    this.state = this.STATE_TIMEOUT;
                } else {
                    this.state = this.STATE_ERROR;
                }

                if (!this.http_code) {
                    this.http_code = parseInt(ex.message);
                    Tool.err('http_code:' + this.http_code);
                }

                let error_codes = [403, 429, 502, 503, 504];
                if (error_codes.indexOf(this.http_code) >= 0) {
                    this.state = this.STATE_PROXY_ERROR;
                    // 请求太频繁了
                    if (this.http_code === 429 || this.http_code === 502) {
                        let next_crawl_time = php.time() + 300 * php.rand(1, 6);
                        this._setNextTime(next_crawl_time);
                    }
                }
            }

            await this._logEnd(result.insertId, content, data, startTime);

            if (flag2) {
                // 异常情况，要重启进程
                
                process.exit(0);
            }
        }

        return content;
    }

    async _mergeRule() {
        // 继承父规则的数据
        if (this.rule['parent_rule_id']) {
            const objRule = new TableHelper('rule', 'crawl');
            let parent_rule = await objRule.getRow({'rule_id': this.rule['parent_rule_id']});
            Tool.log('old rule:' + JSON.stringify(this.rule));
            for (let key in parent_rule) {
                // enable 不继承
                if (key === 'enable') continue;
                // 填充空白数据
                let flag = !this.rule[key] || this.rule[key] === 'undefined';
                if (flag && parent_rule[key]) {
                    this.rule[key] = parent_rule[key];
                }
            }

            Tool.log('new rule:' + JSON.stringify(this.rule));
        }
    }

    async _mergeItems(items) {
        // 继承父规则的数据
        if (this.rule['parent_rule_id']) {
            const objItem = new TableHelper('item', 'crawl');
            let parent_items = await objItem.getAll({'rule_id' : this.rule['parent_rule_id'], 'enable' : 1});
            let items_map = {};
            for (let item of items) {
                items_map[item['field_name']] = 1;
            }

            // 合并规则详情
            for (let parent_item of parent_items) {
                if (!items_map[parent_item['field_name']]) {
                    // 要修改rule_id
                    parent_item.rule_id = this.rule.rule_id;
                    items.push(parent_item);
                }
            }
        }
    }

    async _delayRun() {
        // 先延后，怕并行运行
        let next_crawl_time = php.time() + 30;
        await this._setNextTime(next_crawl_time);

        let objTask = new TableHelper('task', 'crawl');
        const objCrawlLog = await this._getLogObject();
        let create_time = php.date('Y-m-d H:i:s', php.time() - 3600);
        let _where = `create_time > '${create_time}'`;
        let where = {'task_id' : this.task.task_id, 'state' : [this.STATE_ERROR, this.STATE_TIMEOUT]};
        let errorNum = await objCrawlLog.getCount(where, {_where});

        let max_exception_count = this.task.max_exception_count || this.rule.max_exception_count;
        if (errorNum > max_exception_count - 1) {
            // 大于最大异常数，要停止任务
            let newData = {'enable' : 0, 'state' : 2};
            await objTask.updateObject(newData, {'task_id' : this.task.task_id});
            Tool.log("大于最大异常数，要停止任务");
        } else if (errorNum > 0) {
            // 延后重试
            let next_crawl_time = php.time() + (errorNum + 1) * 30;
            await this._setNextTime(next_crawl_time);
        }
    }

    async _request() {
        await this._resetProxy();

        let r = request;
        if (this.proxy && this.rule.need_proxy) {
            r = request.defaults({'proxy':`http://${this.proxy}`});
        } else if (!this.proxy && this.rule.need_proxy) {
            return '';
        }

        // let j = request.jar();
        // this.task.url = 'http://ka.duowan.com';

        // 先decode，再encode，可以把字符给encode，又不会引起多次encode
        let url = encodeURI(decodeURI(this.task.url));
        let response = await r({
            url : url,
            // jar:  j,
            headers : this.getHeaders(this.rule.header),
            timeout: 60000,
            gzip: true,
            encoding: null,
            resolveWithFullResponse: true,
            rejectUnauthorized: false
        });

        this.http_code = response.statusCode;
        let content = response.body.toString('utf8');
        let $ = cheerio.load(content, { decodeEntities: false });

        let head = $('head').html() || '';
        let matches = head.match(/[;\s]charset=['"]?(\w+)['"]?/);
        if (matches && matches[1].match(/gb/ig)) {
            content = iconv.decode(response.body, 'gbk');
        }

        return this._preprocess(content);
    }

    async scoreBrowser(http_code = '') {
        if (http_code == 200) {
            Browser.incScore();
        } else {
            Browser.reduceScore();
        }
    }

    async closeBrowser() {
        await Browser.close();
    }

    async _getPage() {
        var url = this.task.url;
        var p = URL.parse(this.task.url);
        var taget_host = p.host;
        var proxy = this.proxy;
        if (!this.rule.need_proxy) {
            proxy = false;
        }
        let browser = await Browser.init(proxy);
        
        const page = await Browser.newPage();
        const viewport = {
            width : 1440,
            height: 706
        };
        await page.setViewport(viewport);

        return page;
    }

    async _headlessCookie(page, headers) {
        if (headers['Cookie']) {
            let parts = headers['Cookie'].split(';');
            let url = this.task.url;
            let urlInfo = URL.parse(url);
            for (let part of parts) {
                part = part.trim();
                if (!part) continue;
                let index = part.indexOf('=');
                if (index < 0) continue;
                let name = part.substr(0, index);
                let value = part.substr(index + 1);

                let domain = urlInfo['host'];
                let path = '/';
                let expires = php.time() + 86400;
                await page.setCookie({name, value, url, domain, path, expires});
            }
            delete headers['Cookie'];
        }
    }

    async _headless() {
        // 设置头部
        let headers = this.getHeaders(this.rule.header);
        await this._resetProxy();
        if (!this.proxy && this.rule.need_proxy) {
            return '';
        }

        let page = await this._getPage();
        await this._headlessCookie(page, headers);
        page.setExtraHTTPHeaders(headers);

        let cookies = await page.cookies(this.task.url);
        Tool.log(cookies);


        // 开始爬虫
        if (!headers['User-Agent']) {
            //因为在请求中有些api会针对 user-agent 做限制，所以动态做一下调整
            let ua = uaList[Math.floor((Math.random()*uaList.length))];
            page.setUserAgent(ua);
        }

        if (this.rule.wait_request_url) {
            page.on('request', request => {
                var request_url = request.url();
                if (request_url.indexOf(this.rule.wait_request_url) != -1) {
                    Tool.log('请求api链接：' + request.url());
                }
            });
            page.on('requestfinished', async request => {
                
                if (request.url().indexOf(this.rule.wait_request_url) != -1) {
                    Tool.log('【success】请求api成功：' + this.rule.wait_request_url);
                    let api_response = await request.response().text();
                    Tool.log('请求api内容：' + api_response);
                }
            });
            page.on('requestfailed', async request => {
                if (request.url().indexOf(this.rule.wait_request_url) != -1) {
                    Tool.log('【error】请求api失败：' + this.rule.wait_request_url);
                }
            });
        }
        
        //开始打开页面
        let response = await page.goto(this.task.url, {
            waitUntil : 'domcontentloaded'

            // waitUntil : 'load'
        });
        
        await this._autoScroll(page);

        await this._waitRequired(page);

        this.http_code = response.status();
        let content = await page.content();

        return this._preprocess(content, page);
    }

    //页面懒加载-滚动
    async _autoScroll(page) {
        return page.evaluate(() => {
            return new Promise((resolve, reject) => {
                var scroll_count = 0;
                var totalHeight = 0;
                var distance = 100;
                var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if(totalHeight >= scrollHeight || scroll_count > 30){
                        clearInterval(timer);
                        resolve();
                    }
                    scroll_count++;
                }, 100);
            })
        });
    }


    async _setNextTime(next_crawl_time) {
        // next_crawl_time = 0;
        const where = {'task_id': this.task['task_id']};
        // 修改最后更新时间
        let last_crawl_time = php.date('Y-m-d H:i:s');

        const objTask = new TableHelper('task', 'crawl');
        await objTask.updateObject({last_crawl_time, next_crawl_time}, where);
    }

    async _getLogObject() {
        if (!this.objCrawlLog) {
            // let tableName = 'crawl_log_' + php.date('Ymd');
            // let objCrawlLog = new TableHelper(tableName, 'crawl');
            // let flag = await objCrawlLog.checkTableExist(tableName);
            // if (!flag) {
            //     let sql = `CREATE TABLE ${tableName} LIKE _crawl_log`;
            //     await objCrawlLog.objMySql.update(sql);
            // }
            // this.objCrawlLog = objCrawlLog;

            this.objCrawlLog = new TableHelper('crawl_log', 'crawl');
        }

        return this.objCrawlLog;
    }

    async _logStart() {
        const objCrawlLog = await this._getLogObject();
        let log = await objCrawlLog.getRow({"task_id" : this.task['task_id'], "state" : this.STATE_EXECING});
        if (log) {
            await objCrawlLog.updateObject({'state' : this.STATE_TIMEOUT}, {"log_id" : log.log_id});
        }

        let logData = {
            'task_id' : this.task['task_id'],
            'task_key' : this.task['task_key'],
            'rule_id' : this.task['rule_id'],
            'url' : this.task['url'],
            'state' : this.STATE_EXECING,
            'rule_name' : this.rule['rule_name'],
            'create_time' : php.date('Y-m-d H:i:s'),
        };

        return await objCrawlLog.addObject(logData);
    }

    async _logEnd(log_id, raw_content, data, startTime) {
        if (this.state === this.STATE_EXECING) {
            this.state = this.STATE_SUCC;
        }

        Tool.log(`log id: ${log_id}, this.state: ${this.state}`);
        Tool.log('Raw Content:\n' + raw_content);

        let exec_timespan = ((new Date).getTime() - startTime) / 1000;
        this.reportProxy(exec_timespan);

        let logData = {
            proxy : this.proxy,
            state : this.state,
            content : JSON.stringify(data),
            'exec_end_time' : php.date('Y-m-d H:i:s'),
            'exec_timespan' : exec_timespan,
            'exec_log' : this.getLogs().substr(0, 500000)
        };

        if(log_id) {
            const objCrawlLog = await this._getLogObject();
            let where = {log_id};
            await objCrawlLog.updateObject(logData, where);

            //通用告警
            var errMsgList = this.getLogs().substr(0, 500000).match(/【error】([^\n]+)\n/);
            if (errMsgList) {
                var errMsg = '';
                if (errMsgList && errMsgList[1]) {
                    errMsg = errMsgList[1];
                    errMsg = errMsg.substr(0, 50);
                    var result = await this.recordAmcMsg(errMsg);
                    Tool.log(`【AMC_Msg】` + JSON.stringify(result));
                }
            }
            

            // 成功后，才修改下一阶段的时间
            if (this.state === this.STATE_SUCC || this.state === this.STATE_PART_SUCC) {
                let interval = this.task['interval'] || this.rule['interval'];
                let next_crawl_time = php.time() + interval;
                await this._setNextTime(next_crawl_time);
            }
        }
    }

    //通用告警
    async recordAmcMsg(errMsg) {
        if (errMsg !== '' && errMsg.indexOf('waiting for selector')  !== -1) {
            return;
        }
        //过滤掉 400,401,404
        if (errMsg.match(/4[\d]{2}\s-/)) {
            return;
        }
        //过滤掉 5xx
        if (errMsg.match(/5[\d]{2}\s-/)) {
            return;
        }
        if (this.http_code == 400 || this.http_code == 401 || this.http_code == 404) {
            return;
        }
        //过滤掉超时，代理错误，成功的状态
        if (this.state == this.STATE_TIMEOUT || this.state == this.STATE_PROXY_ERROR || this.state == this.STATE_SUCC || this.state == this.STATE_EXECING || this.state == this.STATE_PART_SUCC) {
            return;
        }

        let objAmcMsg = new AmcMsg;

        var msg_code = -1;
        if (!msg_code) {
            msg_code = -1;
        }
        var creator = this.rule.creator;
        if (!creator) {
            creator = 'spider';
        }
        var rule_id = this.rule.rule_id;
        var rule_name = this.rule.rule_name;
        var msg_content = `【${creator}】的《${rule_name}》（${rule_id}）有异常： ${errMsg}`;
        let ret = await objAmcMsg.recordMsg(msg_code, msg_content);
        if (ret.length == 0) {
            return false;
        }
        return ret;
    }

    reportProxy(exec_timespan) {
        let score = 0;
        if (this.state === this.STATE_SUCC || this.state === this.STATE_PART_SUCC) {
            if (exec_timespan < 3) {
                score = 2;
            } else if (exec_timespan < 8) {
                score = 1;
            } else if (exec_timespan > 30) {
                score = -1;
            } else if (exec_timespan > 50) {
                score = -2;
            }
        } else if (this.state === this.STATE_PROXY_ERROR) {
            score = -20;
        }

        if (score && this.proxy) {
            const objProxyPool = new ProxyPool();
            let p = URL.parse(this.task.url);
            Tool.log(`reportProxy(p.host:${p.host}, this.proxy:${this.proxy}, score:${score})`);
            objProxyPool.reportProxy(p.host, this.proxy, score);
        }
    }

    getLogs() {
        return Tool.stopRecordLog().join('\n');
    }

    getHeaders(header) {
        Tool.log(header);

        let headers = {};
        if (header && header.trim()) {
            let parts = header.trim().split("\n");
            for (let part of parts) {
                let index = part.indexOf(':');
                let key = part.substr(0, index);
                let val = part.substr(index + 1);
                headers[key.trim()] = val.trim();
            }
        }

        headers['Accept'] = headers['Accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8';
        headers['Accept-Encoding'] = headers['Accept-Encoding'] || 'gzip, deflate';
        headers['Accept-Language'] = headers['Accept-Language'] || 'en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4';

        let index = php.rand(0, uaList.length - 1);
        let ua = uaList[index];
        if (this.rule.request_mode != 'headless' || !this.rule.wait_request_url) {
            headers['User-Agent'] = headers['User-Agent'] || ua;
        }
        
        return headers;
    }

    async _resetProxy() {
        let p = URL.parse(this.task.url);
        const objProxyPool = new ProxyPool();
        let proxyList = await objProxyPool.getXProxyBest(p.host);

        this.proxy = '';
        if (!php.empty(proxyList)) {
            this.proxy = proxyList[php.rand(0, proxyList.length - 1)];
            Tool.log('select proxy:' + this.proxy);
        } else {
            Tool.log('没有代理，停止爬虫');
            this.state = this.STATE_PROXY_ERROR;
        }
    }

    async _getArgs() {
        let args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // '--proxy-server=211.138.60.25:80'
        ];

        if (this.proxy && this.rule.need_proxy) {
            args.push(`--proxy-server=${this.proxy}`);
        }

        return args;
    }

    async _waitRequired(page) {
        let waitFor = this.rule['wait_for'];
        if (waitFor) {
            Tool.log('等待页面准备好. waitFor:' + waitFor);
            let waitForInt = parseInt(waitFor);
            if (waitForInt) {
                waitFor = waitForInt;
            }
            await page.waitFor(waitFor);
        } else {
            //如果没有等待条件 wait_for 取 item 内一条必填的选择器当做等待
            const objItem = new TableHelper('item', 'crawl');
            let require_item = await objItem.getRow({'rule_id' : this.task.rule_id, 'enable' : 1, 'require' : 1});
            if (require_item) {
                Tool.log(`【timeout】wait for item selector(item.field_name=${require_item.field_name}):`+ require_item.selector);
                await page.waitForSelector(require_item.selector);
            }
        }
    }

    async _preprocess(content, page) {
        if (this.rule.data_type === 'json') {
            content = content.trim();
            let lastChar = php.substr(content, -1);
            if (lastChar === ')') {
                let pos = content.indexOf('(');
                content = content.substr(pos + 1, content.length - pos - 2);
            }
        }

        let preprocess = this.rule.preprocess && this.rule.preprocess.trim();
        if (preprocess) {
            let func = php.create_function('$html, $, page, _task, JTool, Tool', preprocess);

            let $ = null;
            let $html = null;
            if (this.rule.data_type === 'html') {
                $ = cheerio.load(content, { decodeEntities: false });
                JTool.initJquery($);

                $html = $('html');
                let flag = func($html, $, page, this.task, JTool, Tool);
                if (flag === false) {
                    this.skip = true;
                }
                return $('<div></div>').html($html).html();
            } else if (this.rule.data_type === 'json') {
                $html = content;
                return func($html, $, page, JTool, Tool);
            }
        }
        
        return content;
    }

    _getElemOnce(key, val, selector) {
        let sections = [];
        let parts = selector.split(key);
        if (parts.length === 1) return [selector];

        for (let part of parts) {
            if (part.trim()) {
                sections.push(part);
                sections.push(key);
            }
        }

        if (val[1] === false) {
            sections.pop();
        }

        return sections;
    }

    _getElem($, selector) {
        // 蛋疼，cheerio不支持:first, :last, :nth(xx), :eq(xx)的选择器，需要自己实现
        let map = {
            ':first' : ['eq', 0],
            ':last' : ['eq', -1],
            ':nth(' : ['eq', false],
            ':eq(' : ['eq', false]
        };

        let sections = [selector];
        for (let key in map) {
            for (let i = 0; i < sections.length; i++) {
                let tempSections = this._getElemOnce(key, map[key], sections[i]);
                if (tempSections.length > 1) {
                    sections = sections.slice(0, i).concat(tempSections).concat(sections.splice(i + 1));
                    // i += tempSections.length - 1;
                    i--;
                }
            }

        }

        let $el = null;
        for (let i = 0; i < sections.length; i++) {
            let sl = sections[i];
            if (!sl.trim()) continue;

            let val = map[sl];
            if (val) {
                // 用函数代替选择器
                if (val[1] === false) {
                    let sl2 = sections[i + 1];
                    let num = parseInt(sl2.trim());
                    sections[i + 1] = sl2.replace(/[\s]*[-\d]+[\s]*\)/, '');

                    $el = $el[val[0]](num);
                } else {
                    $el = $el[val[0]](val[1]);
                }
            } else {
                if ($el === null) {
                    $el = $(sl);
                } else if (sl[0] === ' ') {
                    $el = $el.find(sl.trim());
                } else {
                    $el = $el.filter(sl.trim());
                }
            }
        }

        return $el;
    }

    _handle(item, $, $el) {
        if ($) {
            // html模式才需要获取元素
            $el = this._getElem($, item.selector);
            if ($el.length === 0) {
                return false;
            }
        }

        let value = this._fetchVal2($el, item, false, $);
        let task_key = this._fetchVal2($el, item, true, $);

        if (!task_key) {
            task_key = value;
        }

        return {value, task_key};
    }

    _fetchVal2($el, item, iskey, $) {
        // var key = iskey ? item.field_name + '-new_task_key' : item.field_name;
        // var func = __crawPage[key];
        let str = iskey ? item.new_task_key : item.fetch_value;
        if (!str) {
            return null;
        }

        let func = php.create_function('$el, $, _task, JTool, Tool', str);
        if (!func) {
            console.error('can not find:' + key);
            return null;
        }

        if (item.is_multi && this.rule.data_type === 'html') {
            let value = [];
            for (let i = 0; i < $el.length; i++) {
                let val = func($($el[i]), $, this.task, JTool, Tool);
                if (Array.isArray(val)) {
                    return val;
                } else {
                    value[i] = val;
                }
            }
            return value;
        } else {
            return func($el, $, this.task, JTool, Tool);
        }
    }


    _predoRuleId(item) {
        if (!this.rule.parent_rule_id) {
            return;
        }

        let next_id = item.next_rule_id;
        Tool.log('next_rule_id：' + next_id + '，rule_id：' + item.rule_id);
        // 这里特殊处理，支持专区爬虫...
        let matches = next_id.match(/ka:(\d+):/);
        if (matches) {
            let next_game_id = matches[1];
            if (next_game_id === '0') {
                matches = item.rule_id.match(/ka:(\d+):/);
                if (matches && matches[1]) {
                    Tool.log('next_game_id：' + next_game_id + ' => game_id：' + matches[1]);
                    next_id = next_id.replace('ka:0:', `ka:${matches[1]}:`);
                    if (next_id.endsWith('_tpl')) {
                        next_id = next_id.substr(0, next_id.length - 4);
                    }
                    item.next_rule_id = next_id;
                }
            }
        }
    }

    async _addNewTask(item, value, task_key) {
        let objTask = new TableHelper('task', 'crawl');
        if (!Array.isArray(value)) {
            value = [value];
            task_key = [task_key];
        }

        // 预处理下一个规则id
        this._predoRuleId(item);

        let where = {
            'rule_id' : item.next_rule_id,
        };

        let demo_url = null;
        let batchNum = 1000;
        value = php.array_chunk(value, batchNum);
        task_key = php.array_chunk(task_key, batchNum);
        for (let batchIndex in value) {
            let key = task_key[batchIndex];
            where['task_key'] = key;

            let task_keys = await objTask.getCol(where, {_field : 'task_key'});
            let map = {};
            for (let k of task_keys) {
                map[k] = 1;
            }

            let datas = [];
            let now = php.date('Y-m-d H:i:s');
            for (let i in key) {
                let task_key = key[i];
                let url = value[batchIndex][i];
                if (task_key && url && !map[task_key]) {
                    map[task_key] = 1; // 防止自身就有重复链接
                    datas.push({
                        parent_task_id : this.task.task_id,
                        rule_id : item.next_rule_id,
                        url : url,
                        task_key : task_key,
                        create_time : now,
                        update_time : now,
                    });

                    demo_url = demo_url || value[batchIndex][i];
                }
            }

            if (datas.length) {
                await objTask.addObjectsIfNotExist(datas);
            }

            const objRule = new TableHelper('rule', 'crawl');
            let where2 = {
                'rule_id' : item.next_rule_id,
            };
            let nextRule = await objRule.getRow(where2);
            if (demo_url && !nextRule['demo_url']) {
                objRule.updateObject({demo_url}, where2);
            }
        }
    }

    _formatData(data) {
        for (let tableName in data) {
            let arrLen = 0;
            let hasArr = false;
            for (let key in data[tableName]) {
                let value = data[tableName][key];
                if (Array.isArray(value)) {
                    arrLen = Math.max(arrLen, value.length);
                    hasArr = true;
                }
            }

            if (hasArr) {
                let newArr = [];
                for (let i = 0; i < arrLen; i++) {
                    let item = {};
                    let value = data[tableName];
                    for (let key in value) {
                        if (Array.isArray(value[key])) {
                            item[key] = value[key][i];
                        } else {
                            item[key] = value[key];
                        }
                    }

                    newArr[i] = item;
                }
                data[tableName] = newArr;
            } else {
                // 统一转化为数组
                data[tableName] = [data[tableName]];
            }
        }

        return data;
    }

    async _queryTables(rule_id) {
        const objTable = new TableHelper('data_db', 'crawl');
        let sql = 'SELECT data_db.db_id, db_name, table_name, pri_key, notice_url, rule_id, is_default, update_mode ' +
            'FROM data_db JOIN rule_db_conf ON data_db.db_id = rule_db_conf.db_id ' +
            `WHERE rule_id = '${rule_id}'`;

        return await objTable.objMySql.getAll(sql);
    }

    async _getTables() {
        let tables = await this._queryTables(this.rule.rule_id);
        if (this.rule.parent_rule_id) {
            let parentTables = await this._queryTables(this.rule.parent_rule_id);
            let map = {};
            for (let table of tables) {
                let key = table.table_name + ':' + table.table_name;
                map[key] = true;
            }

            for (let table of parentTables) {
                let key = table.table_name + ':' + table.table_name;
                if (!map[key]) {
                    tables.push(table);
                }
            }
        }

        return tables;
    }

    async _insertData(log_id, items, data) {
        let tables = await this._getTables();
        if (tables.length === 0) {
            return;
        }

        let defaultTable = tables[0].table_name;
        for (let table of tables) {
            if (table.is_default) {
                defaultTable = table.table_name;
                break;
            }
        }

        let onlyInsertData = {};
        let onlyUpdateData = {};
        let updateData = {};
        // let data = {};
        let items2 = {};
        let saveasItems = {};
        for (let item of items) {
            let value = data[item.field_name];
            if (value === null || value === undefined || item.next_rule_id){
                continue;
            }

            // 判断是否要翻译
            if (item.map_key) {
                let map = await MapData.getData(item.map_key, value);
                if (Array.isArray(value)) {
                    for (let k in value) {
                        value[k] = map[value[k]];
                    }
                } else {
                    value = map[value];
                }
            }

            let table_name = defaultTable;
            let field_names = item.field_name.split(',');

            for (let field_name of field_names) {
                field_name = field_name.trim();
                let parts = field_name.split('.');
                if (parts.length > 1) {
                    table_name = parts[0];
                    field_name = parts[1];
                }

                items2[table_name] = items2[table_name] || {};
                if (!item.next_rule_id) {
                    if (item.insert_type === this.INSERT_TYPE_ONLY_INSERT) {
                        onlyInsertData[table_name] = onlyInsertData[table_name] || {};
                        onlyInsertData[table_name][field_name] = value;
                    } else if (item.insert_type === this.INSERT_TYPE_ONLY_UPDATE) {
                        onlyUpdateData[table_name] = onlyUpdateData[table_name] || {};
                        onlyUpdateData[table_name][field_name] = value;
                    } else if (item.insert_type === this.INSERT_TYPE_UPDATE) {
                        updateData[table_name] = updateData[table_name] || {};
                        updateData[table_name][field_name] = value;
                    } else {
                        Tool.error('unknown insert type.');
                    }
                }

                items2[table_name][field_name] = item;
                if (item.save_as > 0) {
                    saveasItems[table_name] = saveasItems[table_name] || [];
                    saveasItems[table_name].push(field_name);
                }
            }
        }

        this._formatData(onlyInsertData);
        this._formatData(onlyUpdateData);
        this._formatData(updateData);

        for (let table of tables) {
            let tableName = table.table_name;
            let priKey = table.pri_key && table.pri_key.trim();
            if (!priKey || php.empty(onlyInsertData[tableName]) && php.empty(onlyUpdateData[tableName]) && php.empty(updateData[tableName])) {
                continue;
            }

            let onlyInsertArr = onlyInsertData[tableName] || [];
            let onlyUpdateArr = onlyUpdateData[tableName] || [];
            let updateArr = updateData[tableName] || [];

            let result = null;
            let update_mode = table.update_mode ? table.update_mode : this.rule.update_mode;
            if (update_mode === 'replace') {
                result = await this._replaceBatch(table, items2, onlyInsertArr, updateArr, onlyUpdateArr);
            } else {
                result = await this._updateOneByOne(table, items2, onlyInsertArr, updateArr, onlyUpdateArr);
            }

            await this._notifyUrl(log_id, table.notice_url, result);

            // 图片/视频 转存信息
            await this._saveasData(table, items2, saveasItems, result.datas, result.temp_saveas_fields);
        }
    }

    async _notifyUrl(log_id, notice_url, data) {
        if (!notice_url) {
            return false;
        }

        if (php.empty(data.datas)) {
            Tool.log('没发生数据变化，不发送通知');
            return false;
        }

        let objHttp = new dwHttp();
        data.log_id = log_id;
        data.oldDatas = JSON.stringify(data.oldDatas);
        data.datas = JSON.stringify(data.datas);
        let json = await objHttp.post2(notice_url, data);

        Tool.log('发送数据变更通知：' + notice_url + '，返回：' + json);
    }

    async _replaceBatch(table, items, onlyInsertArr, updateArr, onlyUpdateArr) {
        let objTable = new TableHelper(table.table_name, table.db_name);
        let priKey = table.pri_key && table.pri_key.trim();

        let len = onlyInsertArr.length || updateArr.length || onlyUpdateArr.length;
        let allArr = [];
        let oldDatas = {};
        let datas = {};

        Tool.log(`_replaceBatch, onlyInsertArr:${onlyInsertArr.length}, updateArr:${updateArr.length}, onlyUpdateArr:${onlyUpdateArr.length}, getTempData:false`);
        let {allOldDatas} = await this._getOldDatas(table, onlyInsertArr, updateArr, onlyUpdateArr, false);

        // let objTempData = new TableHelper('temp_data', 'crawl');
        // let has_temp_data = await objTempData.getCount({db_id:table.db_id});

        for (let i = 0; i < len; i++) {
            onlyInsertArr[i] = onlyInsertArr[i] || {};
            updateArr[i] = updateArr[i] || {};
            onlyUpdateArr[i] = onlyUpdateArr[i] || {};

            let allData = Object.assign({}, onlyInsertArr[i], updateArr[i], onlyUpdateArr[i]);
            let where = this._getWhere(allData, priKey);
            if (where === false) {
                Tool.error('Replace的数据必须要含有主键');
                this.state = this.STATE_PART_SUCC;
            } else {
                // let oldData = await objTable.getRow(where);
                let whereStr = JSON.stringify(where);
                let oldData = allOldDatas[whereStr];
                if (oldData) {
                    // 存在不同的数据才更新
                    for (let key in allData) {
                        if (allData[key] != oldData[key]) {
                            allArr.push(allData);
                            oldDatas[whereStr] = oldData;
                            datas[whereStr] = allData;
                            break;
                        }
                    }
                } else {
                    // replace方式，暂时不支持暂存数据
                    // if (tempDatas) {
                    //     let whereStr2 = table.db_id + php.md5(whereStr);
                    //     if (tempDatas[whereStr2]) {
                    //         let temp_value = JSON.parse(tempDatas[whereStr2]);
                    //         allData = Object.assign(temp_value, allData);
                    //     }
                    // }
                    allArr.push(allData);
                    datas[whereStr] = allData;
                }
            }
        }

        try {
            if (allArr.length) {
                await objTable.replaceObjects2(allArr);
            } else {
                Tool.log('没有新数据，不需要replaceObjects2');
            }
        } catch (ex) {
            this.state = this.STATE_ERROR;
            Tool.err(ex.stack);
        }

        return {oldDatas, datas};
    }

    async _saveasData(table, items2, saveasItems, datas, temp_saveas_fields) {
        let table_name = table.table_name;
        if ((!saveasItems[table_name] && php.empty(temp_saveas_fields)) || php.empty(datas)) {
            return false;
        }

        let saveasArr = [];
        let insert_saveas_data_ids = [];
        for (let whereStr in datas) {
            let allData = datas[whereStr];
            // 判断是否存在转存字段
            if (saveasItems[table_name]) {
                for (let field_name of saveasItems[table_name]) {
                    if (!allData[field_name]) {
                        continue;
                    }

                    let item = items2[table_name][field_name];
                    if (insert_saveas_data_ids.indexOf(table.db_id + '|' + whereStr + '|' + field_name) == '-1') {
                        saveasArr.push({
                            saveas_data_id : php.md5(table.db_id + '|' + whereStr + '|' + field_name),
                            db_id : table.db_id,
                            key_value : whereStr,
                            save_as : item['save_as'],
                            save_as_referer : item['save_as_referer'],
                            field_name
                        });

                        insert_saveas_data_ids.push(table.db_id + '|' + whereStr + '|' + field_name);
                    }
                }
            }
            

            //临时表合并过来的数据需要检查是否插入转存
            if (temp_saveas_fields[whereStr]) {
                let temp_data = temp_saveas_fields[whereStr];
                for (let temp_field in temp_data) {
                    if (!allData[temp_field]) {
                        continue;
                    }

                    if (insert_saveas_data_ids.indexOf(table.db_id + '|' + whereStr + '|' + temp_field) == '-1') {
                        let saveas_db_id = table.db_id;
                        if (temp_data[temp_field].db_id) {
                            saveas_db_id = temp_data[temp_field].db_id;
                        }
                        saveasArr.push({
                            saveas_data_id : php.md5(table.db_id + '|' + whereStr + '|' + temp_field),
                            db_id : saveas_db_id,
                            key_value : whereStr,
                            save_as : temp_data[temp_field].save_as,
                            save_as_referer : temp_data[temp_field].save_as_referer,
                            field_name : temp_field
                        });

                        insert_saveas_data_ids.push(table.db_id + '|' + whereStr + '|' + temp_field);
                    }
                }
            }
            
        }

        try {
            if (saveasArr.length) {
                let objTable = new TableHelper('saveas_data', 'crawl');
                await objTable.replaceObjects2(saveasArr);
            }
        } catch (ex) {
            this.state = this.STATE_ERROR;
            Tool.err(ex.stack);
            return false;
        }

        return true;
    }

    async _getOldDatas(table, onlyInsertArr, updateArr, onlyUpdateArr, getTempData) {
        let objTable = new TableHelper(table.table_name, table.db_name);
        let priKey = table.pri_key && table.pri_key.trim();

        let mergeWhere = this._getMergeWhere(priKey, onlyInsertArr, updateArr, onlyUpdateArr);
        let allOldDatas = {}, tempDatas = {};
        let len = onlyInsertArr.length || updateArr.length || onlyUpdateArr.length;
        if (len <= 0) {
            return {allOldDatas, tempDatas};
        }

        let row = Object.assign({}, onlyInsertArr[0], updateArr[0], onlyUpdateArr[0]);
        let keys = Object.keys(row);

        let has_temp_data = false;
        let objTempData = new TableHelper('temp_data', 'crawl');
        if (getTempData) {
            let dateStr = php.date('Y-m-d', php.time() - 86400 * 3);
            let _where = `create_time > '${dateStr}'`;
            // 判断是否有临时数据
            has_temp_data = await objTempData.getCount({db_id: table.db_id}, {_where});
        }

        let _field = '`' + keys.join('`,`') + '`';
        let temp_keys = [];
        if (!mergeWhere) {
            for (let i = 0; i < len; i++) {
                let allData = Object.assign({}, onlyInsertArr[i], updateArr[i], onlyUpdateArr[i]);
                let where = this._getWhere(allData, priKey);
                if (where === false) {
                    continue;
                }

                let key = JSON.stringify(where);
                has_temp_data && temp_keys.push(php.md5(key));
                allOldDatas[key] = await objTable.getRow(where, {_field});
            }
        } else {
            let datas = await objTable.getAll(mergeWhere, {_field});
            for (let data of datas) {
                let where = this._getWhere(data, priKey);
                let key = JSON.stringify(where);
                allOldDatas[key] = data;
            }

            if (has_temp_data) {
                // 构造临时数据的条件
                for (let i = 0; i < len; i++) {
                    let allData = Object.assign({}, onlyInsertArr[i], updateArr[i], onlyUpdateArr[i]);
                    let where = this._getWhere(allData, priKey);
                    if (where === false) {
                        continue;
                    }

                    let key = JSON.stringify(where);
                    temp_keys.push(php.md5(key));
                }
            }
        }

        if (has_temp_data && temp_keys.length) {
            let where = {
                db_id: table.db_id,
                temp_key: temp_keys,
            };

            let datas = await objTempData.getAll(where);
            for (let data of datas) {
                tempDatas[data.db_id + data.temp_key] = {"temp_value": data.temp_value, "temp_saveas_data": data.temp_saveas_data, "db_id": table.db_id};
            }

            objTempData.updateObject({'create_time': '2000-01-01'}, where);
        }

        return {allOldDatas, tempDatas};
    }

    _getMergeWhere(priKey, onlyInsertArr, updateArr, onlyUpdateArr) {
        let mergeWhere = {};
        let len = onlyInsertArr.length || updateArr.length || onlyUpdateArr.length;
        for (let i = 0; i < len; i++) {
            let allData = Object.assign({}, onlyInsertArr[i], updateArr[i], onlyUpdateArr[i]);
            let where = this._getWhere(allData, priKey);
            if (where === false) {
                continue;
            }

            let arrNum = 0;
            for (let key in where) {
                let val = where[key];
                if (!mergeWhere[key]) {
                    // 第一次赋值
                    mergeWhere[key] = val;
                } else if (mergeWhere[key] !== val) {
                    if (typeof mergeWhere[key] === 'object') {
                        mergeWhere[key].push(val);
                    } else {
                        // 转化为数组
                        arrNum++;
                        if (arrNum > 1) {
                            return false;
                        } else {
                            let preValue = mergeWhere[key];
                            mergeWhere[key] = [];
                            mergeWhere[key].push(preValue);
                            mergeWhere[key].push(val);
                        }
                    }
                }
            }
        }

        return mergeWhere;
    }

    async _updateOneByOne(table, items, onlyInsertArr, updateArr, onlyUpdateArr) {
        let len = onlyInsertArr.length || updateArr.length || onlyUpdateArr.length;
        let priKey = table.pri_key && table.pri_key.trim();
        let oldDatas = {};

        let datas = {};
        let getTempData = onlyInsertArr.length || updateArr.length;
        Tool.log(`_updateOneByOne, onlyInsertArr:${onlyInsertArr.length}, updateArr:${updateArr.length}, onlyUpdateArr:${onlyUpdateArr.length}, getTempData:${getTempData}`);
        let {allOldDatas, tempDatas} = await this._getOldDatas(table, onlyInsertArr, updateArr, onlyUpdateArr, getTempData);
        let prefix = `db_name:${table.db_name}, table:${table.table_name}: `;

        let objTempData = new TableHelper('temp_data', 'crawl');
        let need_saveas_data = {};
        for (let key in items[table.table_name]) {
            if (items[table.table_name][key]['save_as'] > 0) {
                need_saveas_data[key] = {'save_as': items[table.table_name][key]['save_as'], 'save_as_referer': items[table.table_name][key]['save_as_referer']};
            }
        }


        let onlyUpdataDatas = [];
        let temp_saveas_fields = {};
        try {
            for (let i = 0; i < len; i++) {
                onlyInsertArr[i] = onlyInsertArr[i] || {};
                updateArr[i] = updateArr[i] || {};
                onlyUpdateArr[i] = onlyUpdateArr[i] || {};

                let allData = Object.assign({}, onlyInsertArr[i], updateArr[i], onlyUpdateArr[i]);

                let where = this._getWhere(allData, priKey);
                if (where === false) {
                    Tool.err('数据没包含主键：' + priKey);
                    continue;
                }

                let whereStr = JSON.stringify(where);
                let objTable = new TableHelper(table.table_name, table.db_name);
                // let oldData = await objTable.getRow(where);
                let oldData = allOldDatas[whereStr];
                if (!oldData) {
                    allData = Object.assign({}, onlyInsertArr[i], updateArr[i]);
                    let newData = {};
                    // 去掉null的数据
                    for (let key in allData) {
                        if (allData[key] !== null && allData[key] !== undefined) {
                            newData[key] = allData[key];
                        }
                    }

                    if (!php.empty(newData)) {
                        // 判断是否有暂存数据，如果有则合并
                        if (tempDatas) {
                            if (tempDatas[table.db_id + php.md5(whereStr)] != undefined) {
                                let temp_value = tempDatas[table.db_id + php.md5(whereStr)].temp_value;
                                temp_value = JSON.parse(temp_value);
                                newData = Object.assign(temp_value, newData);
                            }
                        }

                        await objTable.addObject(newData);
                        if (tempDatas[table.db_id + php.md5(whereStr)] != undefined) {
                            let temp_saveas_data = tempDatas[table.db_id + php.md5(whereStr)].temp_saveas_data;
                            temp_saveas_data = JSON.parse(temp_saveas_data);
                            temp_saveas_fields[whereStr] = temp_saveas_data;
                        }
                        
                        datas[whereStr] = newData;
                    } else if (!php.empty(onlyUpdateArr)) {
                        // 处理暂存的数据
                        let db_id = table.db_id;
                        let temp_key = php.md5(whereStr);
                        let temp_value = JSON.stringify(onlyUpdateArr[i]);
                        let temp_saveas_data = {}
                        for (let field in onlyUpdateArr[i]) {
                            if (need_saveas_data[field]) {
                                temp_saveas_data[field] = need_saveas_data[field];
                            }
                        }

                        temp_saveas_data = JSON.stringify(temp_saveas_data);
                        onlyUpdataDatas.push({db_id, temp_key, temp_value, temp_saveas_data});
                    } else {
                        Tool.log(prefix + "没有'只插入'或'更新'的数据");
                    }
                } else {
                    allData = Object.assign({}, updateArr[i], onlyUpdateArr[i]);
                    if (!php.empty(allData)) {
                        let newData = {};
                        // 存在老数据，只更新updateData
                        for (let key in allData) {
                            if (allData[key] === null && allData[key] === undefined) {
                                continue;
                            }

                            // 只填充的字段，只在更新模式有限
                            if (items[table.table_name][key]['only_fill']) {
                                // 老数据不存在时才填充
                                if (!oldData[key] && allData[key])  {
                                    newData[key] = allData[key];
                                } else {
                                    // Tool.log(`只填充字段：${key}, 已存在老数据:${oldData[key]}, 新数据:${allData[key]}`);
                                    Tool.log(`只填充字段：${key}, 已存在老数据，不需要填充`);
                                }
                            } else if (allData[key] != oldData[key]) {
                                newData[key] = allData[key];
                            }
                        }

                        if (!php.empty(newData)) {
                            await objTable.updateObject(newData, where);
                            oldDatas[whereStr] = oldData;
                            datas[whereStr] = newData;
                        } else {
                            Tool.log(prefix + "newData和oldData数据一样，不需要更新");
                        }
                    } else {
                        Tool.log(prefix + "没有'只更新'或'更新'的数据");
                    }
                }
            }

            // 暂存的数据
            if (onlyUpdataDatas.length) {
                await objTempData.replaceObjects2(onlyUpdataDatas);
            }

        } catch (ex) {
            this.state = this.STATE_ERROR;
            Tool.err(ex.stack);
        }

        return {oldDatas, datas, temp_saveas_fields};
    }

    _getWhere(allData, priKey) {
        let where = {};
        let parts = priKey.split(',');
        for (let part of parts) {
            priKey = part.trim();
            if (allData[priKey] === undefined) {
                return false;
            }

            where[priKey] = allData[priKey] + '';
        }

        return where;
    }

}

module.exports = Spider;