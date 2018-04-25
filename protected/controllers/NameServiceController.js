const Controller = require('../framework/Controller.js');
const TableHelper = require('../framework/lib/TableHelper');
const Template = require('ejs');

/**
 * 首页Controller
 */
class NameServiceController extends Controller {
    //var i = 0;
    constructor(req, res) {
        super(req, res);
        this.i = 0;
    }

    async actionNsConfigEnv(args) {
    	let node_name = args['node_name'];
    	let env = args['env'];
    	let targetEnv = args['targetEnv'];
        if (!node_name || !env || !targetEnv) {
            this.exitMsg("参数错误");
        }

    	if (targetEnv == 'new') {
            this.exitMsg('暂时不支持预发布环境');
        } else if (targetEnv == 'formal') {
            this.exitMsg('暂时不支持正式环境');
        }

        const obNsNode = new TableHelper('ns_node', 'Web');
        let where = {node_name, env};
        let nodeInfo = await obNsNode.getRow(where);

        if (!nodeInfo) {
        	this.exitMsg("节点：" + node_name +", env："+ env +" 没有数据");
        }

        //this._writeConfigFile(env, nodeInfo);
    }

    async _writeConfigFile(env, nsNodes) {
    	if (!nsNodes) {
	        return false;
	    }
	    let name = nsNodes['dir_1'];
        let objNode = new TableHelper('ns_node', 'Web');
        let _field = 'node_name, node_type, value_type, node_value, node_tips';
        let where1 = {
            'dir_1' : name,
            'env' : [env, 7],
            'enable' : 1
        };
        let datas = await objNode.getAll(where1, {_field});
        if (!datas) {
            this.exitMsg('没有数据');
        }

        let hashKeys = [];
        for (let k in datas) {
            if (datas[k].node_type == 'hash_table') {
                hashKeys.push(datas[k].node_name);
            }
        }

        let objHashTable = new TableHelper('ns_hash_table', 'Web');
        let where2 = {
            'node_name' : hashKeys,
            'env' : [env, 7],
            'enable' : 1
        };
        _field = 'node_name,key_name,key_value,value_type';
        let hashDatas = await objHashTable.getAll(where2, {_field});
        let tmp = [];
        for (var i = hashDatas.length - 1; i >= 0; i--) {
        	tmp[hashDatas[i].node_name] = hashDatas[i];
        }
        hashDatas = tmp;

        for (let k in datas) {
            if (datas[k].node_type == 'hash_table') {
                datas[k].items = hashDatas[datas[k].node_name];
            }
        }

        nsNodes = datas;
        // 特殊的一级目录
        //    if ($name == 'code') {
        let items = [];
        for (let k in nsNodes) {
            if (nsNodes[k].node_type == 'code') {
                items.push({
                    'key_name' : nsNodes[k].node_value,
                    'key_value' : nsNodes[k].node_tips,
                    'value_type' : "number",
                });
            }
        }

        if (items.length > 0) {
            nsNodes.push({
                'node_name' : name + ":code_map",
                'node_type' : 'hash_table',
                'items' : items,
            });
        }

	    let configs = [];
	    for (let i = 0; i < nsNodes.length; i++) {
	        let info = nsNodes[i];
	        let info_name = info['node_name'];
	        info_name = info_name.split(':');
	        if (info['node_type'] === 'hash_table') {
	            let keyName = this.getArrayKey(info['node_name']);
	            let hashTables = info['items'];
	            let value = [];
	            for (let table of hashTables) {
	                value[table['key_name']] = table['key_value'];
	            }
	            configs['hash'][keyName] = value;
	        } else {
	            configs['string'][info_name[1]] = info['node_value'];
	        }
	    }
	    console.log(configs);
	    let tmpl = 'js';
	    let strConfig = Template.render('name_server/js');
	    let path = CONF_PATH + "config."+name+".inc.js";

	    // let template = Template.init();
	    // $template->assign(compact('configs'));
	    // $strConfig = $template->fetch("name_server/{$tmpl}");
	    // if ($tmpl == 'php') {
	    //     $strConfig = "<?php\n" . $strConfig;
	    // }
	    // $now = date('Y-m-d H:i:s');
	    // $result = 1;
	    // if (file_put_contents($path, $strConfig)) {
	    //     var_dump("[{$now}] path:{$path} 生成配置成功");
	    //     ob_flush();
	    // } else {
	    //     $result = -1;
	    //     var_dump("[{$now}] path:{$path} 生成配置失败");
	    //     ob_flush();
	    // }
    }

    getArrayKey(keyName) {
	    keyName = keyName.split(':');
	    keyName.shift();
	    let str =  "['" + keyName.join("']['") + "']";

	    return str;
	}
}

module.exports = NameServiceController;