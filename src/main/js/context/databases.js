
'use strict';

/**
 * @author palmtale
 * @since 16/12/19.
 */


const Sequelize = require('sequelize'),
    databases = require('./context').config.databases;
// logger = require('log4js').getLogger('club-wxs-db');

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
            //logging: false//logger.log
        }),
};