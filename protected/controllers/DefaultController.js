const Controller = require('../framework/Controller.js');
const TableHelper = require('../framework/lib/TableHelper');
const Spider = require('../models/Spider');

/**
 * 首页Controller
 */
class DefaultController extends Controller {
    //var i = 0;
    constructor(req, res) {
        super(req, res);
        this.i = 0;
    }

    actionIndex(args) {
        let title = args['title'] || 'Hello';
        this.assign('title', title);
        this.display('index');
    }

    /**
     * 预览规则
     * @param args
     * @returns {Promise.<void>}
     */
    async actionPreviewRule(args) {
        // let rule_id = args['rule_id'] || "steam:game_player_data";
        let rule_id = args['rule_id'] || "steam:game_detail";

        const objRule = new TableHelper('rule', 'crawl');
        let rule = await objRule.getRow({rule_id});

        let task = {};
        task['task_id'] = -1;
        task['rule_id'] = rule_id;
        task['url'] = args['url'] || rule['demo_url'];
        let objSpider = new Spider(task);
        let content = await objSpider.run(true);
        await objSpider.closeAllBrowser();

        this.exitMsg(content);
    }

    /**
     * 执行任务
     * @param args
     * @returns {Promise.<void>}
     */
    async actionRunTask(args) {
        let rules = {
            'task_id' : {'type' : 'int' },
        };
        this.checkParam2(rules, args);

        let task_id = args['task_id'];
        const obTask = new TableHelper('task', 'crawl');
        let task = await obTask.getRow({task_id});

        let objSpider = new Spider(task);
        await objSpider.run();
        await objSpider.closeAllBrowser();

        let logs = objSpider.getLogs();
        this._res.header('Content-Type', 'application/json;charset=' + DEFAULT_CHARSET);

        // // 格式化样式
        // let matches = logs.match(/[^\n]+【error】[^\n]+/g);
        // for (let match of matches) {
        //     logs = logs.replace(match,`<span style="color:red;">${match}</span>`);
        // }
        // logs = logs.replace(/\n/g, '<\br>')

        this.exitMsg(logs);
    }

    async actionProxy(args) {
        let rules = {
            'proxy' : {'type' : 'string' },
            'request_time' : {'type' : 'int' },
        };
        this.checkParam2(rules, args);

        let ip = getClientIp(this._req);
        let time = (new Date).getTime();
        let time_span = time - args['request_time'];


        let data = {ip, time, time_span};
        this.success(data);
    }


    async actionTest(args) {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({args: ['--no-sandbox',
            '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        let that = this;
        //await page.setRequestInterceptionEnabled(true);
        

        // page.on('requestfailed', request => {
        //     console.log(request.url() + ' ' + request.failure().errorText);
        // });
        let api_request_url = '';
        let header = '';
        page.on('request', request => {
            if (request.url.indexOf('/api/pc/feed/') != -1) {
                api_request_url = request.url;
            }
        });
        let request_success_url = [];
        let api_response = '';
        // page.on('requestfinished', request => {
        //     if (request.url.indexOf('/api/pc/feed/') != -1) {
        //         api_response = request.response().buffer();
        //     }
        //     request_success_url.push(request.url);
        // });
        page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36');
        await page.goto('https://www.toutiao.com/ch/news_game/');
        //header = response.headers;
        //const waitForElement = page.waitForSelector('.item-inner', {visible:true,timeout: 3000});

        //await waitForElement;

        if (api_request_url) {
            await page.goto(api_request_url);
        }
        let content = await page.content();
        // let contexts = browser.browserContexts();
        // console.log(contexts);
        browser.close();
        // var fs = require('fs');
        // var text = fs.readFileSync('./toutiao.html', 'utf8');
        //fs.writeFileSync('./toutiao.html',content);    
        this.exitMsg(content);


    }

}

module.exports = DefaultController;

