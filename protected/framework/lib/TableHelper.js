"use strict";

let MySql = require('./OujMySql');
let php = require('phpjs');

class TableHelper {
    /**
     * 基本类，提供增删改查
     * @param {string} tableName 表名
     * @param {string} dbKey
     */
    constructor(tableName, dbKey) {
        this.tableName = tableName;
        this.dbKey = dbKey || 'default';
        this.objMySql = new MySql(this.dbKey);
    }

    setTableName(tableName) {
        this.tableName = tableName;
    }

    getCount(where, keyWord) {
        keyWord = keyWord || {};
        keyWord['_field'] = 'COUNT(*)';
        return this.getOne(where, keyWord);
    }

    /**
     * 读取数据
     * @param  {object} where   参数列表，特殊参数前缀
     * @param  {object} keyWord 查询关键字['_field', '_where', '_limit', '_sortKey', '_sortDir', '_lockRow', '_tableName', '_groupby']
     * @return {object}
     */
    getOne(where, keyWord) {
        let sql = this.buildSelectSql(where, keyWord);
        return this.objMySql.getOne(sql);
    }

    getCol(where, keyWord) {
        let sql = this.buildSelectSql(where, keyWord);
        return this.objMySql.getCol(sql);
    }

    getRow(where, keyWord) {
        let sql = this.buildSelectSql(where, keyWord);
        return this.objMySql.getRow(sql);
    }

    getAll(where, keyWord) {
        let sql = this.buildSelectSql(where, keyWord);
        return this.objMySql.getAll(sql, 0);
    }

    updateObject(newData, where) {
        if (!where) {
            throw new SQLException('updateObject没有传入where');
        }

        let _where = this.buildWhereSql(where);
        let sql = 'UPDATE `' + this.tableName + '` SET ';
        sql += this.buildValueSql(newData) + ' WHERE ' + _where;

        return this.objMySql.update(sql);
    }

    delObject(where) {
        if (!where) {
            throw new SQLException('updateObject没有传入where');
        }

        let _where = this.buildWhereSql(where);
        let sql = 'DELETE FROM `' + this.tableName + '` WHERE ' + _where;

        return this.objMySql.update(sql);
    }

    /**
     * 检查表是否存在
     * @param string tableName 表名
     * @param string dbName 【可选】数据库名
     * @return bool true/false
     */
    async checkTableExist(tableName, dbName) {
        if (tableName.indexOf(".") > 0) {
            let parts = explode(".", tableName);
            dbName = parts[0];
            tableName = parts[1];
        }

        let sql, result;
        if (dbName) {
            //------------检查数据库是否存在
            sql = `SELECT 1 FROM information_schema.SCHEMATA WHERE schema_name = '${dbName}'`;
            result = await this.objMySql.getOne(sql);
            if (!result) {
                return false;
            }

            //------------检查数据表是否存在
            sql = `SHOW TABLES FROM dbName LIKE '${tableName}'`;
            let datas = await this.objMySql.getAll(sql);
            result = datas[0];
        } else {
            //------------检查数据表是否存在
            sql = `SHOW TABLES LIKE '${tableName}'`;
            let datas = await this.objMySql.getAll(sql);
            result = datas[0];
        }

        return !!result;
    }

    replaceObject(newData) {
        let sql = 'REPLACE INTO `' + this.tableName + '` SET ';
        sql += this.buildValueSql(newData);
        return this.objMySql.update(sql);
    }

    addObject(data) {
        let sql = 'INSERT `' + this.tableName + '` SET ';
        sql += this.buildValueSql(data);

        return this.objMySql.update(sql);
    }

    getArrayCol(args) {
        if (!args || !args.length) { return false; }
        let value = args[0];
        return php.array_keys(value);
    }

    /**
     * INSERT多行数据
     * @author benzhan
     * @param  args array(array(key => $value, ...))
     */
    async addObjects2(args) {
        let cols = this.getArrayCol(args);
        if (!cols) { return false; }

        return await this.addObjects(cols, args);
    }

    /**
     * INSERT多行数据(避免重复插入记录)
     * @author hawklim
     * @param array $args array(array(key => $value, ...))
     */
    async addObjectsIfNotExist(args) {
        let cols = this.getArrayCol(args);
        if (!cols) { return false; }

        return await this._addObjects(cols, args, 'addIfNotExist');
    }

    /**
     * INSERT多行数据
     * @author benzhan
     * @param cols 列名
     * @param args 参数列表
     */
    async addObjects(col, args) {
        return this._addObjects(col, args, 'add');
    }

    async _addObjects(cols, args, type) {
        type = type || 'add';
        args = php.array_chunk(args, 3000);
        for (let datas of args) {
            await this._addObjects2(cols, datas, type);
        }
    }

    getTableName(args) {
        args = args || {};
        let tableName = this.tableName;
        if (args['_tableName']) {
            tableName = args['_tableName'];
            delete args['_tableName'];
        }
        return tableName;
    }

    async _addObjects2(cols, args, type) {
        type = type || 'add';
            // $sql = ($type == 'add' ? 'INSERT ' : 'REPLACE ');
        let sql = '';
        if (type === 'add') {
            sql = 'INSERT ';
        } else if (type === 'addIfNotExist') {
            sql = 'INSERT IGNORE ';
        } else {
            sql = 'REPLACE ';
        }

        args = this.objMySql.escape(args);
        sql += this.tableName + " (`" + cols.join("`,`") + "`) VALUES ";
        for (let value of args) {
            sql += "(" + php.join(", ", value) + "),";
        }
        sql = sql.substr(0, sql.length - 1);

        return await this.objMySql.update(sql);
    }

    /**
     * REPLACE多行数据
     * @author benzhan
     * @param  args array(array(key => $value, ...))
     */
    replaceObjects2(args) {
        let cols = this.getArrayCol(args);
        if (!cols) { return false; }

        return this.replaceObjects(cols, args);
    }

    /**
     * REPLACE多行数据
     * @author benzhan
     * @param cols 列名
     * @param args 参数列表
     */
    replaceObjects(cols, args) {
        return this._addObjects(cols, args, 'replace');
    }

    async addObjectNx(args, where) {
        let count = await this.getCount(where);
        if (count) { return true; }

        return this.addObject(args);
    }

    close() {
        return this.objMySql.close();
    }

    buildValueSql(data, separator) {
        separator = separator || ',';
        let pool = this.objMySql.getPool();
        let values = [];
        for (let key in data) {
            values.push(pool.escapeId(key) + '=' + pool.escape(data[key]));
        }

        return values.join(separator);
    }

    buildWhereSql(where, keyWord) {
        keyWord = keyWord || {};
        let _sql = keyWord['_where'] || '1';
        let pool = this.objMySql.getPool();

        where = where || {};
        for (let key in where) {
            if (php.is_array(where[key])) {
                _sql += " AND " + pool.escapeId(key) + "IN (" + pool.escape(where[key]) + ")";
            } else {
                _sql += " AND " + pool.escapeId(key) + "=" + pool.escape(where[key]);
            }
        }

        if (keyWord['_groupby']) {
            _sql += " GROUP BY " + keyWord['_groupby'];
        }

        if (keyWord['_sortKey']) {
            _sql += " ORDER BY " + keyWord['_sortKey'];
            if (keyWord['_sortDir']) {
                _sql += " " + keyWord['_sortDir'];
            }
        }

        return _sql;
    }

    buildSelectSql(where, keyWord) {
        keyWord = keyWord || {};
        let _field = keyWord['_field'] || '*';
        let pool = this.objMySql.getPool();

        let tableName = keyWord['_tableName'] || this.tableName;
        let _where = this.buildWhereSql(where, keyWord);
        tableName = pool.escapeId(tableName);

        let sql = `SELECT ${_field} FROM ${tableName} WHERE ${_where} `;

        if (keyWord['_limit']) {
            sql += ' LIMIT ' + keyWord['_limit'];
        }

        return sql;
    }

}

module.exports = TableHelper;
