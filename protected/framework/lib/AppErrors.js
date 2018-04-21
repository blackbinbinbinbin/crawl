"use strict";

class AbstractError extends  Error {
    constructor(msg) {
        super(msg);
        this.name = 'Abstract Error';
    }
}

/**
 * 中断（正常停止）
 * @param msg
 * @constructor
 */
class Interrupt extends  AbstractError {
    constructor(msg) {
        super(msg);
        this.name = 'Interrupt';
    }
}

/**
 * 数据库错误
 * @param msg
 * @constructor
 */
class DbError extends  AbstractError {
    constructor(msg) {
        super(msg);
        this.name = 'Database Error';
    }
}

/**
 * Redis错误
 * @param msg
 * @constructor
 */
class RedisError extends  AbstractError {
    constructor(msg) {
        super(msg);
        this.name = 'Redis Error';
    }
}

/**
 * R2M错误
 * @param msg
 * @constructor
 */
class R2MError extends  AbstractError {
    constructor(msg) {
        super(msg);
        this.name = 'R2M Error';
    }
}

module.exports = {
    Interrupt,
    DbError,
    RedisError,
    R2MError
};