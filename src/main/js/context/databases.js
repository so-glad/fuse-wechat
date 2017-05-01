
'use strict';

/**
 * @author palmtale
 * @since 16/12/19.
 */


import log4js from 'koa-log4';
import Sequelize from 'sequelize';
import context from './config';

const logger = log4js.getLogger('fuse-wechat-db');
const databases = context.config.databases;

export default {
    soglad: new Sequelize(databases.soglad.name,
        databases.soglad.username, databases.soglad.password, {
            dialect: databases.soglad.dialect,
            host: databases.soglad.host,
            port: databases.soglad.port,
            pool: {
                max: 8,
                min: 3,
                idle: 10000
            },
            logging: (msg) => logger.info.apply(logger, [msg])
        }),
};