/**
 * Created by ben on 2017/10/24.
 */
const php = require('phpjs');
const Tool = require('../framework/lib/Tool.js');
const dwHttp = require('../framework/lib/dwHttp.js');
const TableHelper = require('../framework/lib/TableHelper.js');

class AmcMsg {
	getAppInfo() {
		let appInfo = {
			"app_id": "crawl",
			"app_key": "d5d32a173ad01f7edd9b26248bbbcbd3",
			"server_ip": "14.17.108.216",
			"alerm_type": "ERROR",
		}
		return appInfo;
	}

	async recordMsg(code, msg_content) {
		var msg_content = encodeURI(msg_content);
        let objHttp = new dwHttp();
        let appInfo = this.getAppInfo();
        let url = 'http://61.160.36.226/default/recordMsg';

        var data = {
        	"code": code,
        	"code_msg": msg_content,
        	"app_id": appInfo.app_id,
			"server_ip": appInfo.server_ip,
			"alerm_type": appInfo.alerm_type,
			"time": php.time()
        };
        var sign = await this.getSign(data, appInfo.app_key);
        data['sign'] = sign;

        let headers = {};
        headers['HOST'] = 'amc-admin.duowan.com';
        let rep = await objHttp.post2(url, data, 3, 3, headers);

        if (rep) {
            let result = JSON.parse(rep);
            return result;
        } else {
            return [];
        }	
	}

	async getSign(args, app_key) {
		var tmpArgs = {
			"code": args.code,
        	"code_msg": args.code_msg,
        	"app_id": args.app_id,
			"server_ip": args.server_ip,
			"alerm_type": args.alerm_type,
			"time": args.time,
			"app_key": app_key
		};
		var tmpArr = [];
		for (let key of Object.keys(tmpArgs).sort()) {
		  tmpArr.push(tmpArgs[key]);
		}
        var str = tmpArr.sort().join('');
        var sign = php.sha1(str);
        return sign;
	}
}

module.exports = AmcMsg;