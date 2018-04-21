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

        await this._delayRun();

        let startTime = (new Date).getTime();

        let result = {};
        if (!preview) {
            result = await this._logStart();
        }

        // 找这个任务的规则
        const objItem = new TableHelper('item', 'crawl');
        let items = await objItem.getAll({'rule_id' : this.task.rule_id, 'enable' : 1});

        this.mergeParent(items);

        let content = '';
        let data = {};
        try {
            Tool.log(`爬虫：${this.task.url}`);
            Tool.log(`请求模式：${this.rule.request_mode}，更新模式：${this.rule.update_mode}`);
            JTool.initUrl(this.task.url);
            if (this.rule.request_mode === 'headless') {
                content = await this._headless();
            } else {
                content = await this._request();
            }
            // let objRedis = OujRedis.init('logic');
            // content = await objRedis.get('globals:url_map:http://14.17.108.216:9998/previewRule?rule_id=steam:game_data:steamdb&url=');

            if (preview) {
                return content;
            }

            if (!content || content.length <= this.rule.min_length) {
                // 代理出问题，当作超时处理
                Tool.log('内容过短，代理出问题');
                this.state = this.STATE_TIMEOUT;
            } else {
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

            this.http_code = 200;
            await this._logEnd(result.insertId, content, data, startTime);
        } catch (ex) {
            // 代理出问题的情况
            let flag = ex.message.indexOf("ERR_PROXY_CONNECTION_FAILED") >= 0;
            flag = flag || ex.message.indexOf("Error: tunneling socket could not be established") >= 0;
            flag = flag || ex.message.indexOf("Error: write EPROTO ") >= 0;
            flag = flag || ex.message.indexOf("Error: socket hang up") >= 0;
            flag = flag || ex.message.indexOf("Error: ESOCKETTIMEDOUT") >= 0;
            flag = flag || ex.message.indexOf("Error: Exceeded maxRedirects.") >= 0;
            flag = flag || ex.message.indexOf("net::ERR_EMPTY_RESPONSE") >= 0;
            flag = flag || ex.message.indexOf("net::ERR_TUNNEL_CONNECTION_FAILED") >= 0;
            flag = flag || ex.message.indexOf("net::ERR_INSECURE_RESPONSE") >= 0;

            // 代理访问慢的情况
            let flag3 = ex.message.indexOf('Navigation Timeout Exceeded') >= 0;
            let flag2 = ex.message.indexOf("Most likely the page has been closed") >= 0;
            if (flag) {
                this.state = this.STATE_PROXY_ERROR;
            } else if (flag2 || flag3) {
                this.state = this.STATE_TIMEOUT;
            } else {
                this.state = this.STATE_ERROR;
            }

            Tool.err(ex.message);
            // StatusCodeError: 429 -
            let stack = ex.stack;
            Tool.err(stack);

            let parts = stack.match(/StatusCodeError:\s*(\d+)\s*-/);
            this.http_code = parts && parts.length > 2 ? parseInt(parts[1]) : 0;
            if (this.http_code == 403) {
                this.state = this.STATE_PROXY_ERROR;
            }

            await this._logEnd(result.insertId, content, data, startTime);

            if (flag2) {
                // 异常情况，要重启进程
                await this.closeAllBrowser();
                process.exit(0);
            }
        }

        return content;
    }

    async mergeParent(items) {
        // 继承父规则的数据
        if (this.rule['parent_rule_id']) {
            const objRule = new TableHelper('rule', 'crawl');
            let parent_rule = await objRule.getRow({'rule_id' : this.rule['parent_rule_id']});
            Tool.log('old rule:' + JSON.stringify(this.rule));
            for (let key in parent_rule) {
                // enable 不继承
                if (key === 'enable') continue;
                // 填充空白数据
                if (!this.rule[key] && parent_rule[key]) {
                    this.rule[key] = parent_rule[key];
                }
            }

            Tool.log('new rule:' + JSON.stringify(this.rule));

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

    // async _GetGbkUrl(url) {
    //     let options;
    //     let parts = URL.parse(url);
    //     options = {
    //         hostname: parts.hostname,
    //         port: parts.port || 80,
    //         path: parts.path,
    //         method: "GET",
    //         headers: this.getHeaders(this.rule.header),
    //         gzip: true
    //     }
    //
    //     if (this.proxy) {
    //         options.proxy = 'http://' + this.proxy;
    //     }
    //
    //     return new Promise(function(resolve, reject) {
    //         // 异步处理
    //         // 处理结束后、调用resolve 或 reject
    //         let req = Http.request(options,function(res) {
    //             let chunks = [];
    //             res.on("data",function(chunk){
    //                 chunks.push(chunk);
    //             });
    //             res.on("end",function() {
    //                 let content = Buffer.concat(chunks);
    //                 zlib.gunzip(content, function(err, decoded) {
    //                     if (err) {
    //                         let decodedBody = iconv.decode(content.toString('utf-8'), 'gbk');
    //                         resolve(decodedBody);
    //                     } else {
    //                         let decodedBody = iconv.decode(decoded, 'gbk');
    //                         resolve(decodedBody);
    //                     }
    //                 });
    //             });
    //
    //             console.log(res.statusCode);
    //         });
    //
    //         req.on("error",function(err){
    //             reject(err);
    //         });
    //
    //         req.end();
    //     });
    // }

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
        let raw_content = await r({
            url : url,
            // jar:  j,
            headers : this.getHeaders(this.rule.header),
            timeout: 60000,
            gzip: true,
            encoding: null
        });

        let content = raw_content.toString('utf8');
        let $ = cheerio.load(content, { decodeEntities: false });

        let head = $('head').html() || '';
        let matches = head.match(/[;\s]charset=['"]?(\w+)['"]?/);
        if (matches && matches[1].match(/gb/ig)) {
            content = iconv.decode(raw_content, 'gbk');
        }

        return this._preprocess(content);
    }

    async closeAllBrowser() {
        for (let proxy in pagePool) {
            // 超过5分钟的浏览器要关闭掉
            await pagePool[proxy][0].close();
            await pagePool[proxy][1].close();
            delete pagePool[proxy];
            Tool.warning(`closeAllBrowser. delete pagePool:${proxy}`);
        }
    }

    async _getPage() {
        for (let proxy in pagePool) {
            let span = (new Date).getTime() - pagePool[proxy][2];
            if (span > 310 * 1000) {
                // 超过5分钟的浏览器要关闭掉
                await pagePool[proxy][0].close();
                await pagePool[proxy][1].close();
                delete pagePool[proxy];
                Tool.warning(`delete pagePool:${proxy}, span:${span}`);
            }
        }

        if (!pagePool[this.proxy]) {
            const browser = await puppeteer.launch({
                args: await this._getArgs(),
                // headless: false // 用于调试
            });

            const page = await browser.newPage();
            const viewport = {
                width : 1440,
                height: 706
            };
            page.setViewport(viewport);
            pagePool[this.proxy] = [page, browser, (new Date).getTime()];
        }

        return pagePool[this.proxy][0];
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
        if (!this.proxy) {
            return '';
        }

        let page = await this._getPage();
        await this._headlessCookie(page, headers);
        page.setExtraHTTPHeaders(headers);

        let cookies = await page.cookies(this.task.url);
        Tool.log(cookies);

        // 开始爬虫
        await page.goto(this.task.url, {
            waitUntil : 'domcontentloaded'
            // waitUntil : 'load'
        });

        await this._waitRequired(page);

        let content = await page.content();
        // await browser.close();
        // await page.close();
        return this._preprocess(content, page);
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

            // 成功后，才修改下一阶段的时间
            if (this.state === this.STATE_SUCC || this.state === this.STATE_PART_SUCC) {
                let interval = this.task['interval'] || this.rule['interval'];
                let next_crawl_time = php.time() + interval;
                await this._setNextTime(next_crawl_time);
            }
        }
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
        } else {
            // 请求太频繁了
            if (this.http_code === 429) {
                let next_crawl_time = php.time() + 600;
                this._setNextTime(next_crawl_time);
                score = -1;
            }
            // score = -2;
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
        headers['User-Agent'] = headers['User-Agent'] || ua;
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

        if (this.proxy) {
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
        }
    }

    _preprocess(content, page) {
        let preprocess = this.rule.preprocess && this.rule.preprocess.trim();
        if (preprocess) {
            let func = php.create_function('$html, $, page, JTool, Tool', preprocess);

            let $ = null;
            let $html = null;
            if (this.rule.data_type === 'html') {
                $ = cheerio.load(content, { decodeEntities: false });

                $html = $('html');
                func($html, $, page, JTool, Tool);
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
        let func = php.create_function('$el, $, _task, JTool, Tool', item.fetch_value);

        let new_task_key = item.new_task_key && item.new_task_key.trim();
        let task_key_func = new_task_key && php.create_function('$el, $, _task, JTool, Tool', item.new_task_key);

        let $els = $el;
        if ($) {
            $els = $el = this._getElem($, item.selector);
            if ($els.length === 0) {
                return false;
            }
        }

        let value = null;
        let task_key = null;
        if (item.is_multi && this.rule.data_type === 'html') {
            value = [];
            task_key = [];
            for (let i = 0; i < $els.length; i++) {
                $el = $($els[i]);
                let v = func($el, $, this.task, JTool, Tool);
                value.push(v);
                if (task_key_func) {
                    task_key.push(task_key_func($el, $, this.task, JTool, Tool));
                } else {
                    task_key.push(v);
                }
            }
        } else {
            // $el = $($els[0]); // 这个会出问题
            value = func($el, $, this.task, JTool, Tool);
            if (task_key_func) {
                task_key = task_key_func($el, $, this.task, JTool, Tool);
            } else {
                task_key = value;
            }
        }

        return {value, task_key};
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
            let key = task_key[batchIndex] || value[batchIndex];
            where['task_key'] = key;

            let task_keys = await objTask.getCol(where, {_field : 'task_key'});
            let map = {};
            for (let k of task_keys) {
                map[k] = 1;
            }

            let datas = [];
            let now = php.date('Y-m-d H:i:s');
            for (let i in key) {
                if (!map[key[i]]) {
                    map[key[i]] = 1; // 防止自身就有重复链接
                    datas.push({
                        parent_task_id : this.task.task_id,
                        rule_id : item.next_rule_id,
                        url : value[batchIndex][i],
                        task_key : key[i],
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
            await this._saveasData(table, items2, saveasItems, result.datas);
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

    async _saveasData(table, items2, saveasItems, datas) {
        let table_name = table.table_name;
        if (!saveasItems[table_name] || php.empty(datas)) {
            return false;
        }

        let saveasArr = [];
        for (let whereStr in datas) {
            let allData = datas[whereStr];
            // 判断是否存在转存字段
            for (let field_name of saveasItems[table_name]) {
                if (!allData[field_name]) {
                    continue;
                }

                let item = items2[table_name][field_name];
                saveasArr.push({
                    saveas_data_id : php.md5(table.db_id + '|' + whereStr),
                    db_id : table.db_id,
                    key_value : whereStr,
                    save_as : item['save_as'],
                    save_as_referer : item['save_as_referer'],
                    field_name
                });
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
                tempDatas[data.db_id + data.temp_key] = data.temp_value;
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

        let onlyUpdataDatas = [];
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
                            let temp_value = tempDatas[table.db_id + php.md5(whereStr)];
                            if (temp_value) {
                                temp_value = JSON.parse(temp_value);
                                newData = Object.assign(temp_value, newData);
                            }
                        }

                        await objTable.addObject(newData);
                        datas[whereStr] = newData;
                    } else if (!php.empty(onlyUpdateArr)) {
                        // 处理暂存的数据
                        let db_id = table.db_id;
                        let temp_key = php.md5(whereStr);
                        let temp_value = JSON.stringify(onlyUpdateArr[i]);
                        onlyUpdataDatas.push({db_id, temp_key, temp_value});
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

        return {oldDatas, datas};
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