/**
 * Created by ben on 2017/11/07.
 */
require('../extensions/function_extend.js');
// let php = require('phpjs');
// let Tool = require('../framework/lib/Tool.js');

const TableHelper = require('../framework/lib/TableHelper.js');
const OujMySql = require('../framework/lib/OujMySql.js');

let mapCache = {};
async function getData(mapKey, value) {
    let cacheKey = `${mapKey}_` + JSON.stringify(value);
    if (!mapCache[cacheKey]) {
        const objMap = new TableHelper('Cmdb3Map', 'Report');

        let mapInfo = await objMap.getRow({mapKey});
        // const objTable = new TableHelper(mapInfo.sourceTable, mapInfo.nameDb);

        let keyField = mapInfo['keyName'].trim();
        let valField = mapInfo['valueName'].trim();
        let tableName = `\`${mapInfo['sourceTable']}\``;

        if (keyField.indexOf('_') === -1 && keyField.indexOf(' ') === -1) {
            keyField = `\`${keyField}\``;
        }

        if (valField.indexOf('_') === -1 && valField.indexOf(' ') === -1) {
            valField = `\`${valField}\``;
        }

        let sql = `SELECT ${keyField}, ${valField} FROM ${tableName} WHERE 1 `;
        if (value) {
            if (Array.isArray(value)) {
                let str = value.join("', '");
                sql += `AND ${keyField} IN ('${str}') `;
            } else {
                sql += `AND ${keyField} = '${value}' `;
            }
        }

        let filter = mapInfo['mapFilter'];
        if (filter) {
            sql += `AND ${filter} `;
        }

        const objMySql = new OujMySql(mapInfo.nameDb);
        let datas = await objMySql.getAll(sql);

        let map = {};
        keyField = mapInfo['keyName'].trim();
        valField = mapInfo['valueName'].trim();
        for (let data of datas) {
            if (parseInt(mapInfo.mapType) === 1) {
                map[data[keyField]] = map[data[keyField]] = {};
                map[data[keyField]] = data[valField];
            } else {
                map[data[keyField]] = map[data[keyField]] = [];
                map[data[keyField]].push(data[valField]);
            }
        }

        mapCache[cacheKey] = map;
    }

    return mapCache[cacheKey];
}

exports.getData = getData;
