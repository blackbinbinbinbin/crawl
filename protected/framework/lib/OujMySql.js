"use strict";

const Mysql = require('mysql');
const AppErrors = require('./AppErrors.js');
const Tool = require('./Tool.js');

let objPools = {};

/**
 * 基本类，提供增删改查
 * @param {string} dbKey
 */
class OujMySql {

    constructor(dbKey) {
        this.dbKey = dbKey || 'default';
        this.sqls = [];
        this.num = 0;
    }

    getPool() {
        if (!objPools[this.dbKey]) {
            let config = GLOBALS.dbInfo[this.dbKey];
            if (config) {
                config['host'] = config['host'] || config['dbHost'];
                config['user'] = config['user'] || config['dbUser'];
                config['password'] = config['password'] || config['dbPass'];
                config['database'] = config['database'] || config['dbName'];
                config['port'] = config['port'] || config['dbPort'];
                config['connectionLimit'] = config['connectionLimit'] || 100;
                config['dateStrings'] = true;
                objPools[this.dbKey] = Mysql.createPool(config);
            } else {
                throw new AppErrors.DbError("数据库:" + this.dbKey + "没有配置");
            }
        }

        return objPools[this.dbKey];
    }

    query(sql, values) {
        let that = this;
        return new Promise(function(resolve, reject) {
            let index = that.num++;
            let time = (new Date).getTime();
            that.getPool().query(sql, values, function(err, result) {
                let timespan = ((new Date).getTime() - time) / 1000;
                sql = sql.substr(0, 8000);
                // 只记录前10000条
                // if (index < 10000) {
                    // that.sqls[index] = `[${that.dbKey}] [${index}] [exec:${timespan}] ${sql}`;
                // }
                Tool.log(`[${that.dbKey}] [exec:${timespan}] ${sql}`);

                if (err) {
                    reject(err);
                    Tool.error(`DB ERROR. dbKey:${that.dbKey}, sql:${sql}`);
                    throw new AppErrors.DbError(err);
                } else {
                    resolve(result);
                }
            });
        });
    };

    /**
     * 更新数据
     * @param {string} sql
     */
    update(sql) {
        return this.query(sql, []);
    };

    /**
     * 获取一个值
     * @param {string}  sql
     * @return Promise
     */
    getOne(sql) {
        let that = this;
        return new Promise(function(resolve, reject) {
            let p1 = that.getAll(sql, 1);
            p1.then(function(rows) {
                let row = rows[0];
                let val = null;
                if (row) {
                    let keys = Object.keys(row);
                    val = keys && row[keys[0]];
                }
                resolve(val);
            }, reject);
        });
    };

    /**
     * 获取一列数据
     * @param sql
     * @param limit 行数
     */
    getCol(sql, limit) {
        let that = this;
        return new Promise(function(resolve, reject) {
            let p1 = that.getAll(sql, limit);
            p1.then(function(rows) {
                let cols = [];
                if (rows[0] && rows.length) {
                    let keys = Object.keys(rows[0]);
                    let key = keys[0];

                    for (let i = 0; i < rows.length; i++) {
                        cols.push(rows[i][key]);
                    }
                }

                resolve(cols);
            }, reject);
        });
    };

    /**
     * 获取一行数据
     * @param sql
     */
    getRow(sql) {
        let that = this;
        return new Promise(function(resolve, reject) {
            let p1 = that.getAll(sql, 1);

            p1.then(function(rows) {
                resolve(rows[0] || null);
            }, reject);
        });
    };

    /**
     * 获取所有行数据
     * @param sql
     * @param limit 行数
     */
    getAll(sql, limit) {
        if (typeof limit == 'number' && limit > 0) {
            sql += " LIMIT " + limit;
        }

        return this.query(sql, []);
    };

    /**
     * 关闭连接池
     */
    close() {
        return new Promise(function(resolve, reject) {
            this.getPool().end(function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    /**
     * 转义需要插入或者更新的字段值
     *
     * 在所有查询和更新的字段变量都需要调用此方法处理数据
     *
     * @param mixed $str 需要处理的变量
     * @return mixed 返回转义后的结果
     */
    escape(str) {
        if (typeof str === 'object') {
            for (let key in str) {
                str[key] = this.escape(str[key]);
            }
        } else {
            return this.getPool().escape(str);
        }

        return str;
    }

    getSql() {
        return this.sqls;
    };

    clearSql() {
        this.sqls = [];
        this.num = 0;
    };

}

module.exports = OujMySql;
