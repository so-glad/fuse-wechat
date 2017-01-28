'use strict';

/**
 * @author palmtale
 * @since 2017/1/12.
 */

import log4js from 'koa-log4';
import redis from 'redis';
import ElasticSearch from 'elasticsearch';

import Wechat from 'co-wechat';
import WechatApi from 'wechat-api';

import context from './config';
import Promisify from '../util/promisify';

import WechatUserService from '../services/wechat-user';
import WechatNewsService from '../services/wechat-news';
import WechatMediaService from '../services/wechat-media';
import WechatSceneService from '../services/wechat-scene';

import WechatEventController from '../controllers/wechat-event';
import WechatUserTask from '../tasks/wechat-user';
import WechatMediaTask from '../tasks/wechat-media';


let logger = log4js.getLogger('fuse-wechat');

let buildRedisClient = (redisConfig) => {
    const redisClient = redis.createClient(redisConfig);
    redisClient.on("error", (error) => {
        logger.error("Redis error, caused by: " + error);
    });
    Promisify.promisefy(redisClient, redisClient.get);
    Promisify.promisefy(redisClient, redisClient.set);
    return redisClient;
};

let buildWechatClient = (redisClient) => {
    let wechatApi = new WechatApi(context.config.wechat.appid, context.config.wechat.appsecret, (callback) => {
        redisClient.getAsync(context.KEY_WECHAT_ACCESSTOKEN)
            .then((r) => {
                callback(null, JSON.parse(r));
            }).catch((e) => {
            logger.error("Got access token on redis error, caused by: " + e.stack);
            callback(e, null);
        });
    }, (token, callback) => {
        redisClient.setAsync(context.KEY_WECHAT_ACCESSTOKEN, JSON.stringify(token))
            .then((r) => {
                redisClient.expire(context.KEY_WECHAT_ACCESSTOKEN, 7000);
                callback(null, r);
            }).catch((e) => {
            logger.error("Save access token on redis error, caused by: " + e.stack);
            callback(e, null);
        });
    });
    Promisify.promisefy(wechatApi, 'getFollowers');
    Promisify.promisefy(wechatApi, 'batchGetUsers');
    Promisify.promisefy(wechatApi, 'createLimitQRCode');
    Promisify.promisefy(wechatApi, 'getMaterial');
    Promisify.promisefy(wechatApi, 'getMaterials');
    Promisify.promisefy(wechatApi, 'getMedia');
    Promisify.promisefy(wechatApi, 'getUser');
    Promisify.promisefy(wechatApi, 'sendText');
    Promisify.promisefy(wechatApi, 'sendImage');
    Promisify.promisefy(wechatApi, 'uploadMedia');
    return wechatApi;
};

let buildElasticSearchClient = (config) => {
    let elasticConfig = config;
    elasticConfig.log = (config) => {
        return log4js.getLogger('fuse-wechat-elastic');
    };
    return new ElasticSearch.Client(elasticConfig);
};

let redisClient = buildRedisClient(context.config.databases.redis);


context.register('client.redis', redisClient);
context.register('client.elasticsearch', buildElasticSearchClient(context.config.elasticsearch));
context.register('client.wechat', buildWechatClient(redisClient));


context.register('service.wechat.user', new WechatUserService(context));
context.register('service.wechat.news', new WechatNewsService(context));
context.register('service.wechat.media', new WechatMediaService(context));
context.register('service.wechat.scene', new WechatSceneService(context));


context.register('server.wechat', new Wechat(context.config.wechat));

context.register('controller.wechat.event', new WechatEventController(context));

context.register('task.wechat.user', new WechatUserTask(context));
context.register('task.wechat.media', new WechatMediaTask(context));

export default context;