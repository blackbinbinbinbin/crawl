/**
 * 浏览器类代理池
 */
const puppeteer = require('puppeteer');
const exec = require('child_process').exec;
const Tool = require('../framework/lib/Tool.js');
const TableHelper = require('../framework/lib/TableHelper.js');
const URL = require('url');
const ProxyPool = require('../models/ProxyPool');

let map = {};
let page = null;
class Browser {
	static async init(host, proxy = false) {
		//如果 map 是空对象数组，那么说明是程序退出然后守护进程重启了，需要先杀死所有的 chrome 
		//因为 browser.process() 拿不到程序id，所以只能 ps 查看所有的 chrome 然后杀掉进程
		try {
			if (Object.keys(map).length == 0) {
				await this.killAllChrome();	
			}
			
			await this.checkBrowser();
			if (!map.browser) {
				const objProxyPool = new ProxyPool();
	        	let proxyList = await objProxyPool.getXProxyBest(host);
	        	let args = ['--no-sandbox','--disable-setuid-sandbox'];

		        if (proxy) {args.push(`--proxy-server=${proxy}`);}

		        let browser = await puppeteer.launch({
			        args: args
			    });

		        var date = new Date();
				var now = Math.floor(date.getTime()/1000); 
				map = {browser: browser, expire: now + 15 * 60, score: 0};
			}
  
    	} catch (ex) {
    		await this.close();
    	}

    	return map.browser;
    }

    static async checkBrowser() {
    	if (Object.keys(map).length > 0) {
    		var date = new Date();
			var now = Math.floor(date.getTime()/1000); 
    		

    		if (map.expire < now || map.score < 0) {
				await this.close();
			}
        }
    }

    static async close() {
    	if (map.browser) {
    		await map.browser.close();
    		page = null;
    	}
    	map = {};
    }


    static getBrowserMap() {
    	return map;
    }

    //杀死可能是上一个错误使得 chrome 没有杀死的所有浏览器进程
    static async killAllChrome() {
    	const cmdStr = 'ps -A -opid,etime,args | grep "/protected/node_modules/_puppeteer"';
    	let that = this;
	    // const cmdStr = 'ps -A -opid,etime,args | grep Chrome';
	    exec(cmdStr, function(err, stdout, stderr){
	        if (err) {
	            Tool.log('get weather api error:' + stderr);
	        } else {
	            let rows = stdout.split("\n");
	            let index = 1;
	            for (let row of rows) {
	                let data = that.getPidTime(row);

	                let cmd = '';
	                if (data.time > 30 * 60) {
                    	// 强制kill
	                    cmd = `kill -9 ${data.pid}`;
	                } else if (data.time > 15 * 60) {
	                    // 普通kill
	                    cmd = `kill ${data.pid}`;
	                }

	                if (cmd) {
	                    // console.log(`${index}: ${cmd}, time:${data.time}`);
	                    exec(cmd, function(err, stdout, stderr) {
	                        Tool.log(`${index}: ${cmd}, time:${data.time}, stdout:${stdout}, stderr:${stderr}`);
	                    });
	                    index++;
	                }
	            }
	        }
	    });
    }

    static getPidTime(row) {
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

	static incScore() {
		map.score++;
	}

	static reduceScore() {
		map.score = map.score - 10;
	}

	static async newPage() {
		if (!map.browser) {
			return null;
		} else {
			if (page) {
				return page;
			} else {
				page = await map.browser.newPage();
				return page;
			}	
		}
	}
}

module.exports = Browser;


/*** Usage:
*
const Browser = require('../models/Browser');
let browser = await Browser.init(args['host'], false);
var map = await Browser.getBrowserMap();
let page = await browser.newPage();
await page.goto("http://www.baidu.com");
new Promise(async () => {
    let content = await page.content();
    console.log(content);
    if (!content) {
        await Browser.close(args['host']);
    }
});
Browser.closAll();
*
***/
