require('../../common.js');
const TableHelper = require('../../framework/lib/TableHelper.js');
const php = require('phpjs');
const Tool = require('../../framework/lib/Tool.js');
const OujRedis = require('../../framework/lib/OujRedis.js');
const fs = require('fs');
const Template = require('ejs');

let env = 1;
if (ENV === ENV_NEW) {
    env = 2;
} else if (ENV === ENV_FORMAL) {
    env = 4;
} else {
    env = 1;
}

for (let name of GLOBALS['nameServ_php']) {
    _writeConfigFile(env, name, -1, false);
}

async function _writeConfigFile(env, name, version, notify = true){
    path = CONF_PATH;
    if (!fs.existsSync(path)) {
        fs.mkdir(path);
    }

    path += `/config.${name}.inc.php`;
    Tool.log(`准备写入：${name}`);

    let objRedis = OujRedis.init('name_serv');
    let nsNodes = await objRedis.get(`pub_data:${env}:${name}`);
    if (!nsNodes) {
        return false;
    }

    nsNodes = JSON.parse(nsNodes);
    let configs = [];
    for (let i = 0; i < nsNodes.length; i++) {
        let info = nsNodes[i];
        let info_name = info['node_name'];
        info_name = info_name.split(':');
        if (info['node_type'] === 'hash_table') {
            let keyName = getArrayKey(info['node_name']);
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

    let tmpl = 'js';
    Template.render('name_server/js')
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

function getArrayKey(keyName) {
    keyName = keyName.split(':');
    keyName.shift();
    let str =  "['" + keyName.join("']['") + "']";

    return str;
}

//
// $ip = $serverNodes['server_ip'];
//
// $objRedis = dwRedis::init('name_serv');
// $keys = $objRedis->Keys('_keys*');
//
// if ($keys) { // 初始化文件 生成配置文件
//     foreach ($keys as $key) {
//         $key = explode(':', trim($key));
//         if ($key[1]) {
//             _writeConfigFile($env, trim($key[1]), -1, false);
//         }
//     }
// }


// $GLOBALS['targetEnv'] = $env;
//
// $serverNodes = getServerConf($env);
// $ip = $serverNodes['server_ip'];
//
// $objRedis = dwRedis::init('name_serv');
// $keys = $objRedis->Keys('_keys*');
//
// if ($keys) { // 初始化文件 生成配置文件
//     foreach ($keys as $key) {
//         $key = explode(':', trim($key));
//         if ($key[1]) {
//             _writeConfigFile($env, trim($key[1]), -1, false);
//         }
//     }
// }
//
// if ($serverNodes['keys']) {
//     $nodes = explode(',', $serverNodes['keys']);
//     foreach ($nodes as $node){
//         $node = trim($node);
//         $subscribeDatas[] = "pub_event::{$env}:$node";
//     }
// }
//
// $restartChannel = "pub_restart:{$env}:{$ip}";
// $echoChannel = "pub_echo:{$env}:{$ip}";
//
// $subscribeDatas[] = $restartChannel;
// $subscribeDatas[] = $echoChannel;
//
// if ($subscribeDatas) {
//
//     $objRedis->subscribe($subscribeDatas, function ($instance, $channel, $message) use ($restartChannel, $echoChannel) {
//         if ($channel == $restartChannel) {
//             var_dump('nameService restart');
//             exit;
//         } else if ($channel == $echoChannel) {
//             notifyPubResult(1, $message);
//         }
//
//         $channels = explode(':', $channel);
//         $channelName = $channels[3];
//         _writeConfigFile($GLOBALS['targetEnv'], $channelName, $message);
//
//     });
// }
//
// function _writeConfigFile($env, $name, $version, $notify = true){
//     $path = CONF_PATH;
//     if(!file_exists($path)){
//         mkdir($path);
//     }
//     $path .= "/config.{$name}.inc.php";
//     var_dump("准备写入：{$name}");
//     $objRedis = dwRedis::init('name_serv');
//
//     $nsNodes = $objRedis->get("pub_data:{$env}:$name");
//     if (!$nsNodes) {
//         return false;
//     }
//     $nsNodes = json_decode($nsNodes, true);
//     $configs = [];
//     foreach ($nsNodes as $info){
//         $tmp = [];
//         $info_name = $info['node_name'];
//         $info_name = explode(':', $info_name);
//         if ($info['node_type'] == 'hash_table') {
//             $keyName = getArrayKey($info['node_name']);
//             $hashTables = $info['items'];
//             $value = [];
//             foreach ($hashTables as $table) {
//                 $value[$table['key_name']] = $table['key_value'];
//             }
//             $configs['hash'][$keyName] = $value;
//         }else{
//             $configs['string'][$info_name[1]] = $info['node_value'];
//         }
//     }
//     $tmpl = 'php';
//     $template = Template::init();
//     $template->assign(compact('configs'));
//     $strConfig = $template->fetch("name_server/{$tmpl}");
//     if ($tmpl == 'php') {
//         $strConfig = "<?php\n" . $strConfig;
//     }
//     $now = date('Y-m-d H:i:s');
//     $result = 1;
//     if (file_put_contents($path, $strConfig)) {
//         var_dump("[{$now}] path:{$path} 生成配置成功");
//         ob_flush();
//     } else {
//         $result = -1;
//         var_dump("[{$now}] path:{$path} 生成配置失败");
//         ob_flush();
//     }
//     if ($notify) {
//         notifyPubResult($result, $version);
//     }
// }