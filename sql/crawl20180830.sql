CREATE TABLE `crawl_log` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '爬虫日志id',
  `task_id` bigint(20) NOT NULL COMMENT '任务id',
  `task_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '任务标识符',
  `rule_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则id',
  `url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '爬虫的地址',
  `rule_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则名称',
  `proxy` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '代理ip',
  `state` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态：0:执行中,1:正常,2:异常,3:超时,4:部分成功,5:代理异常',
  `content` varchar(3000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '处理数据',
  `exec_timespan` float NOT NULL COMMENT '执行时长',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `exec_end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `exec_log` text COLLATE utf8mb4_unicode_ci COMMENT '运行日志',
  `proc_index` int(11) DEFAULT NULL COMMENT '进程编号',
  PRIMARY KEY (`log_id`),
  KEY `task_id` (`task_id`,`state`) USING BTREE,
  KEY `create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫日志';

CREATE TABLE `data_db` (
  `db_id` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据存储id',
  `db_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据库名',
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '表名',
  `pri_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '主键',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '修改时间',
  `notice_url` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '回调通知地址',
  PRIMARY KEY (`db_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫数据库表';

CREATE TABLE `db_table` (
  `rule_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则id',
  `db_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据库名',
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '表名',
  `pri_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '主键',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '修改时间',
  `is_default` tinyint(4) DEFAULT '1' COMMENT '是否默认',
  `notice_url` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '回调通知地址',
  `update_mode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新模式：update:更新,replace:覆盖',
  `update_time_field` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新时间字段',
  PRIMARY KEY (`rule_id`,`db_name`,`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫数据库表';

CREATE TABLE `item` (
  `rule_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则id',
  `field_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '列名',
  `selector` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '选择器',
  `fetch_value` varchar(5000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '获取值($el)',
  `is_multi` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否多项：1:多项,0:单项',
  `require` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否必须：1:必须,0:可选',
  `enable` tinyint(4) NOT NULL DEFAULT '1' COMMENT '开关：1:启用,0:禁用',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '修改时间',
  `next_rule_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '下一个规则id',
  `new_task_key` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '任务标识符(默认url)',
  `insert_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插入方式：only_insert:只插入,update:插入&更新',
  `map_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '字典',
  `save_as` tinyint(4) DEFAULT '0' COMMENT '转存：0:不需要,1:单文件,2:json数组,3:自定义',
  `save_as_callback` varchar(3000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '自定义转存(php)',
  `last_saveas_time` datetime DEFAULT NULL COMMENT '上次转存时间',
  `only_fill` tinyint(4) DEFAULT '0' COMMENT '只填充：1:是,0:否',
  `save_as_referer` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '转存需要的referer',
  PRIMARY KEY (`rule_id`,`field_name`) USING BTREE,
  KEY `rule_id` (`rule_id`,`enable`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选择器表';

CREATE TABLE `item_backup` (
  `rule_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则id',
  `field_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '列名',
  `selector` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '选择器',
  `fetch_value` varchar(5000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '获取值($el)',
  `is_multi` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否多项：1:多项,0:单项',
  `require` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否必须：1:必须,0:可选',
  `enable` tinyint(4) NOT NULL DEFAULT '1' COMMENT '开关：1:启用,0:禁用',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '修改时间',
  `next_rule_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '下一个规则id',
  `new_task_key` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '任务标识符(默认url)',
  `insert_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '插入方式：only_insert:只插入,update:插入&更新',
  `map_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '字典',
  `save_as` tinyint(4) DEFAULT '0' COMMENT '转存：0:不需要,1:单文件,2:json数组,3:自定义',
  `save_as_callback` varchar(3000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '自定义转存(php)',
  `last_saveas_time` datetime DEFAULT NULL COMMENT '上次转存时间',
  `only_fill` tinyint(4) DEFAULT '0' COMMENT '只填充：1:是,0:否',
  `save_as_referer` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '转存需要的referer',
  PRIMARY KEY (`rule_id`,`field_name`) USING BTREE,
  KEY `rule_id` (`rule_id`,`enable`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选择器表';

CREATE TABLE `proc_log` (
  `server_ip` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '服务器ip',
  `proc_id` bigint(20) NOT NULL COMMENT '进程id',
  `task_id` bigint(20) DEFAULT NULL COMMENT '任务id',
  `rule_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '规则id',
  `host` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '域名',
  `url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '爬虫的地址',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`server_ip`,`proc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='进程日志';

CREATE TABLE `rule` (
  `rule_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则id',
  `parent_rule_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '父规则id',
  `rule_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '规则名称',
  `enable` tinyint(4) NOT NULL DEFAULT '1' COMMENT '开关：1:启用,0:禁用',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '修改时间',
  `interval` int(11) DEFAULT NULL COMMENT '时间间隔(秒)',
  `max_exception_count` int(11) DEFAULT '10' COMMENT '最大异常次数',
  `header` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头部',
  `demo_url` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '示范url',
  `wait_for` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '等待条件(selector/timeout)',
  `request_mode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'headless' COMMENT '请求模式：headless:Headless模式,normal:普通请求',
  `update_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'update' COMMENT '更新模式：update:更新,replace:覆盖',
  `preprocess` varchar(3000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '页面预处理($page)',
  `min_length` int(11) DEFAULT '3000' COMMENT '源码至少字数',
  `data_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'html' COMMENT '数据类型：html:Html,json:Json',
  `rule_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'normal' COMMENT '类型：normal:普通,ka:特权',
  `creator` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `editor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '修改人',
  `need_proxy` tinyint(4) DEFAULT '1' COMMENT '是否需要代理：0:否,1:是',
  `wait_request_url` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '等待页面请求的url',
  PRIMARY KEY (`rule_id`),
  KEY `rule_id` (`rule_id`,`enable`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫规则表';

CREATE TABLE `rule_db_conf` (
  `rule_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则id',
  `db_id` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据存储id',
  `is_default` tinyint(4) DEFAULT '1' COMMENT '是否默认',
  `update_mode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新模式：update:更新,replace:覆盖',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '修改时间',
  PRIMARY KEY (`rule_id`,`db_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='规则数据配置';

CREATE TABLE `saveas_data` (
  `saveas_data_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '转存数据id',
  `db_id` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据存储id',
  `key_value` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '主键内容',
  `field_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '字段名',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` bigint(20) DEFAULT '0' COMMENT '处理时间',
  `save_as` tinyint(4) DEFAULT '0' COMMENT '转存：0:不需要,1:单文件,2:json数组,3:富文本',
  `save_as_referer` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '转存需要的reffer',
  `try_num` int(10) NOT NULL DEFAULT '0' COMMENT '尝试转存次数',
  `target_field` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '转存目标字段名',
  PRIMARY KEY (`saveas_data_id`),
  KEY `update_time` (`update_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫转存中间表';

CREATE TABLE `task` (
  `task_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '任务id',
  `parent_task_id` bigint(20) DEFAULT '0' COMMENT '父任务id',
  `rule_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则id',
  `task_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '任务标识符(默认url)',
  `url` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '爬虫的地址',
  `state` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：1:正常,2:异常',
  `enable` tinyint(4) NOT NULL DEFAULT '1' COMMENT '开关：1:启用,0:禁用',
  `interval` int(11) DEFAULT NULL COMMENT '时间间隔(秒)',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '修改时间',
  `last_crawl_time` datetime DEFAULT NULL COMMENT '最后爬虫时间',
  `max_exception_count` int(11) DEFAULT '10' COMMENT '最大异常次数',
  `next_crawl_time` bigint(20) DEFAULT '0' COMMENT '下次爬虫时间',
  `reffer` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '来源页面',
  PRIMARY KEY (`task_id`),
  KEY `parent_task_id` (`parent_task_id`),
  KEY `task_key` (`task_key`),
  KEY `next_crawl_time` (`rule_id`,`next_crawl_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=226463 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫任务';

CREATE TABLE `temp_data` (
  `db_id` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据存储id',
  `temp_key` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '主键',
  `temp_value` varchar(3000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '存储的内容',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `temp_saveas_data` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '临时表需要转存数据',
  PRIMARY KEY (`db_id`,`temp_key`),
  KEY `db_id` (`db_id`,`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫临时中间表';

CREATE TABLE `video_save_log` (
  `video_url` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频地址',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频地标题',
  `url_md5` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频地址Md5',
  `state` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'video_check' COMMENT '状态：video_check:审核中,video_delete:删除,video_update:视频更新',
  `url_task_id` int(11) DEFAULT NULL COMMENT '抓取系统的任务id',
  `vid` bigint(20) DEFAULT NULL COMMENT '视频ID',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '修改时间',
  PRIMARY KEY (`video_url`),
  KEY `url_md5` (`url_md5`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频转存日志';

