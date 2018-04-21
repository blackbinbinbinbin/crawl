/**
 * Created by ben on 2017/10/24.
 */
const php = require('phpjs');
const Tool = require('../framework/lib/Tool.js');
const dwHttp = require('../framework/lib/dwHttp.js');

const TableHelper = require('../framework/lib/TableHelper.js');

class ProxyPool {

    getYYProxyList() {
        let proxyList = [
            "10.20.60.190:8118",
            "10.20.60.225:8118",
            "10.20.60.243:8118",
            "10.20.60.241:8118",
            "10.20.60.170:8118",
            "10.20.60.162:8118",
            "10.20.60.155:8118",
            "10.20.60.87:8118",
            "10.20.60.168:8118",
            "10.20.60.137:8118",
            "10.20.60.136:8118",
            "10.20.60.132:8118",
            "10.20.60.129:8118",
            "10.20.60.128:8118",
            "10.20.60.127:8118",
            "10.20.60.126:8118",
            "10.20.61.250:8118",
            "10.20.60.236:8118",
            "10.20.60.233:8118",
            "10.20.60.232:8118",
            "10.20.60.230:8118",
            "10.20.60.228:8118",
            "10.20.60.227:8118",
            "10.20.60.224:8118",
            "10.20.61.118:8118",
            "10.20.61.98:8118",
            "10.20.60.186:8118",
            "10.20.60.172:8118",
            "10.20.60.171:8118",
            "10.20.61.216:8118",
            "10.20.61.215:8118",
            "10.20.49.190:8118",
            "10.20.49.189:8118",
            "10.20.60.23:8118",
            "10.20.96.171:8118",
            "10.20.96.170:8118",
            "10.20.96.169:8118",
            "10.20.60.250:8118",
            "10.20.60.153:8118",
            "10.20.60.108:8118",
            "10.20.61.117:8118",
            "10.20.61.116:8118",
            "10.20.61.84:8118",
            "10.20.61.83:8118",
        ];

        return proxyList;
    }

    async getFreeProxyList() {
        return [];

        let objHttp = new dwHttp();

        let url = 'http://61.160.36.225:8000/?count=10';
        let rep = await objHttp.get2(url);

        if (rep) {
            let list = JSON.parse(rep);
            for (let i = 0; i < list.length && i < 100; i++) {
                list[i] = `${list[i][0]}:${list[i][1]}`;
            }

            return list;
        } else {
            return [];
        }
    }

    async getXProxyList() {
        let objHttp = new dwHttp();

        let url = 'http://61.160.36.226/spider/ipList';
        let rep = await objHttp.get2(url, 3, 3, "HOST:admin.duowan.com");
        console.log("XProxyList:" + rep);
        if (rep) {
            let result = JSON.parse(rep);
            if (result.result) {
                return result.data.proxyList;
            }
        }

        return [];
    }

    async getXProxyBest(domain) {
        let objHttp = new dwHttp();

        let num = 100;
        let url = `http://61.160.36.226/spider/bestProxy?num=${num}&domain=${domain}`;
        let rep = await objHttp.get2(url, 3, 3, "HOST:admin.duowan.com");
        if (rep) {
            let result = JSON.parse(rep);
            if (result.result) {
                return result.data.proxyList;
            }
        }

        return [];
    }

    async reportProxy(domain, proxy, score) {
        let objHttp = new dwHttp();

        let url = `http://61.160.36.226/spider/reportProxy?proxy=${proxy}&domain=${domain}&score=${score}`;
        let rep = await objHttp.get2(url, 3, 3, "HOST:admin.duowan.com");
        if (rep) {
            let result = JSON.parse(rep);
            if (result.result) {
                return result.data;
            }
        }

        return 0;
    }

    async getProxyList() {
        let freeProxyList = await this.getFreeProxyList();
        let xProxyList = await this.getXProxyList();
        freeProxyList = freeProxyList.concat(xProxyList);
        if (ENV === ENV_DEV) {
            return freeProxyList;
        } else {
            let yyProxyList = await this.getYYProxyList();
            return yyProxyList.concat(freeProxyList);
        }
    }

}

module.exports = ProxyPool;