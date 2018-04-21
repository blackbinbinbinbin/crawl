/**
 * Created by ben on 2017/10/24.
 */
require('../common.js');
const TableHelper = require('../framework/lib/TableHelper.js');
const Spider = require('../models/Spider.js');

async function main(rule_id, cb) {
    const objRule = new TableHelper('rule', 'crawl');
    let rule = await objRule.getRow({rule_id});

    let task = {};
    task['task_id'] = -1;
    task['task_key'] = -1;
    task['rule_id'] = rule_id;
    task['url'] = rule['demo_url'];
    // task['url'] = 'http://apps.game.qq.com/wmp/v3.1/?p0=42&p1=searchKeywordsList&page=1&pagesize=15&order=sIdxTime&r0=s';
    // task['url'] = 'https://v.qq.com/x/page/a0552az0da5.html';
    task['url'] = 'http://ffm.qq.com/webplat/info/news_version3/34631/34642/34653/34654/m20133/201803/699873.shtml';
    task['url'] = 'https://v.qq.com/x/page/b0608idcj83.html';
    let objSpider = new Spider(task);
    // let content = await objSpider.run(true);
    let content = await objSpider.run();

    cb && cb(content);
}


let args = process.argv.splice(2);
// let rule_id = args[0] || "steam:game_player_data";
// let rule_id = args[0] || "steam:discount_info:base";
// let rule_id = args[0] || "steam:discount_detail";
// let rule_id = args[0] || "ka:2002363:video_list";
// let rule_id = args[0] || "ka:2002363:video_detail";
let rule_id = args[0] || "ka:35029:video_detail";
// let rule_id = args[0] || "steam:game_dlc";
// let rule_id = args[0] || "steam:game_data:steamdb";
// let rule_id = args[0] || "steam:game_data:yesterday_increase";
// let rule_id = args[0] || "steam:game_detail";
// let rule_id = args[0] || "steam:xiaoheihe_api";

if (!rule_id) {
    console.error('rule_id');
    return;
}

main(rule_id, function(content) {
    console.log(content);
    process.exit(0);
});
