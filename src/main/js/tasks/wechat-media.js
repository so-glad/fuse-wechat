
'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import log4js from 'koa-log4';

import Queue from '../util/promise-queue';

const logger = log4js.getLogger('fuse-wechat-script');

export default class WechatMediaTask {

    constructor(context){
        this.batchNumber = 100;
        this.wechatApi = context.module('client.wechat');
        this.wechatMediaService = context.module('service.wechat.media');
        this.wechatMediaSyncQueue = new Queue(context.config.wechat.sync.media_queue.concurrency);
    }

}