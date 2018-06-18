const request = require('request-promise');
const php = require('phpjs');
const CallLog = require('./CallLog');

class dwHttp {

    constructor() {
        this.addCallId = true;
        this.proxy = null;
    }

    /**
     * 是否需要添加callId
     * @param flag
     */
    enableCallId(flag) {
        this.addCallId = flag;
    }

    setProxy(proxy) {
        this.proxy = proxy;
    }

    /**
     * 通过get方式获取数据
     * @author ben
     * @param url 请求地址
     * @param timeout 超时时间
     * @param header 请求头部
     * @param ttl 缓存时间(秒)，默认为0，不缓存
     * @return string 响应数据
     */
    async get(url, timeout = 5, header = "", ttl = 0) {
        timeout = timeout || 5;
        header = header || "";
        ttl = ttl || 0;
        if (php.empty(url)||php.empty(timeout)) return false;

        let key = '';
        // if (ttl > 0) {
        //     key = url;
        //     let response = this.getCache(key);
        //     if (response) {
        //         return response;
        //     }
        // }

        let startTime = (new Date).getTime();
        // if (this.addCallId && php.strpos(url, '_call_id=') === false && php.strpos(url, '&sign=') === false) {
        //     let and = '&';
        //     if (php.strpos(url, '?') === false) {
        //         and = '?';
        //     }
        //
        //     url += and + '_call_id=' . CallLog.getCallId();
        // }

        let r = request;
        let options = {
            url : url,
            timeout: timeout * 1000,
            headers : this.getHeaders(header),
        };

        if (this.proxy) {
            options['proxy'] = `http://${this.proxy}`;
        }

        let response = await r(options);

        // if (ttl > 0 && response) {
        //     this.setCache(key, ttl, response);
        // }

        // let objCallLog = new CallLog();
        // objCallLog.logModuleCall("GET", url, null, response, startTime);
        return response;
    }

    getHeaders(header) {
        let headers = {};
        if (typeof header === 'string') {
            if (header && header.trim()) {
                let parts = header.trim().split("\n");
                for (let part of parts) {
                    let val = part.split(":");
                    headers[val[0].trim()] = val[1].trim();
                }
            }
        } else {
            headers = header;
        }

        headers['Accept-Language'] = headers['Accept-Language'] || 'en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4';
        headers['User-Agent'] = headers['User-Agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';
        return headers;
    }

    /**
     * 重试n次，通过get方式获取数据
     * @author ben
     * @param url 请求地址
     * @param times 重试次数，默认为3次
     * @param firstTimeout 第一次超时时间，后续超时间为：$i * $firstTimeout
     * @param header 头部信息
     * @param ttl 缓存时间(秒)，默认为0，不缓存
     * @return string 响应数据
     */
    async get2(url, times = 3, firstTimeout, header, ttl) {
        times = times || 3;
        firstTimeout = firstTimeout || 3;
        header = header || "";
        ttl = ttl || 0;
        for (let i = 1; i <= times; i++) {
            let response = await this.get(url, firstTimeout * i, header, ttl);
            if (response !== false) {
                return response;
            }
        }

        return false;
    }


    async post2(url, data, times, firstTimeout, header) {
        times = times || 3;
        firstTimeout = firstTimeout || 3;
        header = header || "";
        for (let i = 1; i <= times; i++) {
            let response = await this.post(url, data, firstTimeout * i, header);
            if (response !== false) {
                return response;
            }
        }

        return false;
    }

    /**
     * post
     * @author ben
     * @param url 请求地址
     * @param data 请求数据
     * @param timeout 超时时间
     * @param header 请求头部
     * @return string 响应数据
     */
    async post(url, data, timeout, header) {
        timeout = timeout || 5;
        header = header || "";
        if (php.empty(url) || php.empty(timeout)) return false;

        let startTime = (new Date).getTime();
        // if (this.addCallId && php.strpos(url, '_call_id=') === false && php.strpos(url, '&sign=') === false) {
        //     let and = '&';
        //     if (php.strpos(url, '?') === false) {
        //         and = '?';
        //     }
        //
        //     url += and + '_call_id=' . CallLog.getCallId();
        // }

        let r = request;
        let options = {
            method:'post',
            url : url,
            form : data,
            timeout: timeout * 1000,
            headers : this.getHeaders(header),
        };

        if (this.proxy) {
            options['proxy'] = `http://${this.proxy}`;
        }

        let response = await r(options);

        // let objCallLog = new CallLog();
        // objCallLog.logModuleCall("GET", url, null, response, startTime);
        return response;
    }

}

module.exports = dwHttp;
