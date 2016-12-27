
'use strict';

/**
 * @author palmtale
 * @since 16/12/19.
 */


const Sequelize = require('sequelize'),
    databases = require('./context').config.databases;
// logger = require('log4js').getLogger('club-wxs-db');

export default {
    public: new Sequelize(databases.SoGladPublic.name,
        databases.SoGladPublic.username, databases.SoGladPublic.password, {
            dialect: databases.SoGladPublic.dialect,
            host: databases.SoGladPublic.host,
            port: databases.SoGladPublic.port,
            pool: {
                max: 8,
                min: 3,
                idle: 10000
            },
            //logging: false//logger.log
        }),
    wechat: new Sequelize(databases.SoGladWechat.name,
        databases.SoGladWechat.username, databases.SoGladWechat.password, {
            dialect: databases.SoGladWechat.dialect,
            host: databases.SoGladWechat.host,
            port: databases.SoGladWechat.port,
            pool: {
                max: 8,
                min: 3,
                idle: 10000
            },
            //logging: false//logger.log
        })
};