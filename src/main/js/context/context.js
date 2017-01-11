
'use strict';

/**
 * The application initializer/context, init the used instance into some container
 * @author palmtale
 * @since 16/12/19.
 */

import path from 'path';

import redis from 'redis';
import log4js from 'koa-log4';
import Wechat from 'co-wechat';
import WechatApi from 'co-wechat-api';

import promisify from '../util/promisify';
import config from '../../etc/config.json';


log4js.configure(config.log4js, {cwd: config.log4js.cwd});
const logger = log4js.getLogger('fuse-wechat');

let refactorConfig = (cfg) => {
    let resultConfig = cfg;
    if (!cfg.path.root) {
        resultConfig.path.root = path.join(__dirname, '../../..');
    }

    if(process.platform == 'windows') {
        if(resultConfig.path.client.indexOf(':\\') !== 1 ) {
            resultConfig.path.client = path.join(resultConfig.path.root, resultConfig.path.client);
        }
        if(resultConfig.path.server.indexOf(':\\') !== 1 ) {
            resultConfig.path.server = path.join(resultConfig.path.root, resultConfig.path.server);
        }
        if(resultConfig.path.resources.indexOf(':\\') !== 1 ) {
            resultConfig.path.resources = path.join(resultConfig.path.root, resultConfig.path.resources);
        }
    } else {
        if(resultConfig.path.client.indexOf('/') !== 0 ) {
            resultConfig.path.client = path.join(resultConfig.path.root, resultConfig.path.client);
        }
        if(resultConfig.path.server.indexOf('/') !== 0 ) {
            resultConfig.path.server = path.join(resultConfig.path.root, resultConfig.path.server);
        }
        if(resultConfig.path.resources.indexOf('/') !== 0 ) {
            resultConfig.path.resources = path.join(resultConfig.path.root, resultConfig.path.resources);
        }
    }
    resultConfig.path.views = path.join(resultConfig.path.resources, 'views');
    return resultConfig;
};

let buildRedis = (redisConfig) => {
    const redisClient = redis.createClient(redisConfig);
    redisClient.on("error", (error) => {
        logger.error("Redis error, caused by: " + error);
    });
    return redisClient;
};

let prepareWecahtApi = (redisClient) => {
    let redisGet = promisify(redisClient.get);
    let redisSet = promisify(redisClient.set);
    return  new WechatApi(config.wechat.appid, config.wechat.appsecret, (callback) => {
        return redisGet(Context.KEY_WECHAT_ACCESSTOKEN)
            .then((value) => {
                callback(null, JSON.parse(value));
            }).catch((error) => {
                logger.error("Get access token from redis error, caused by: " + error);
                callback(error, null);
            });
    }, (token, callback) => {
        return redisSet(Context.KEY_WECHAT_ACCESSTOKEN, JSON.stringify(token))
            .then((result) => {
                redisClient.expire(Context.KEY_WECHAT_ACCESSTOKEN, 7000);
                callback(null, result);
            }).catch((error) => {
                logger.error("Save access token on redis error, caused by: " + error);
                callback(error, null);
            });
    });
};

class Context {

    /**
     * @return {string}
     */
    static get KEY_WECHAT_ACCESSTOKEN() {
        return 'wechat_access_token';
    }

    constructor(cfg){

        this.config = refactorConfig(cfg);

        this.redisClient = buildRedis(this.config.databases.redis);

        this.wechat = new Wechat(this.config.wechat);

        this.wechatApi = prepareWecahtApi(this.redisClient);

        this.container = {};
    }

    register(name, module) {
        this.container[name] = module;
    }

    module(name) {
        return this.container[name];
    }

}

export default new Context(config);