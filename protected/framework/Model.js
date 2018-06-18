'use strict';
var MySql = require('../framework/lib/OujMySql.js');
var TableHelper = require('../framework/lib/TableHelper.js');

class Model {
    constructor(tableName, dbKey) {
        this.tableName = tableName;
        this.dbKey = dbKey || 'default';

        if (!tableName) {
            return;
        }

        /**
         * 数据库的表助手
         * @type {TableHelper}
         */
        this.objTable = new TableHelper(tableName, this.dbKey);

        /**
         * 数据库的操作类
         * @type {OujMySql}
         */
        this.objDb = new MySql(this.dbKey);
    }

    /**
     * 返回数据库操作对象
     * @param dbKey
     * @returns {OujMySql}
     */
    getObjDb(dbKey) {
        if (dbKey) {
            return new MySql(dbKey);
        } else {
            return this.objDb;
        }
    }
}

module.exports = Model;