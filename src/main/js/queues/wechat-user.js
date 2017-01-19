
'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import Queue from 'promise-queue';
import log4js from 'koa-log4';

import Promisefy from '../util/promisify';


const logger = log4js.getLogger('fuse-wechat');


export default class WechatUserQueue {

    constructor(context) {
        this.batchNumber = 100;
        this.wechatApi = context.module('client.wechat');
        this.wechatUserService = context.module('service.wechat.user');
        this.wechatUserSyncQueue = new Queue(context.config.wechat.sync.user_queue.concurrency,
            context.config.wechat.sync.user_queue.max);

        Promisefy.promisefy(this.wechatApi, "getFollowers");
        Promisefy.promisefy(this.wechatApi, "batchGetUsers");

        this.groupTasks = (opids) => {
            let tasks = [], openids = [], count = 0;
            while (opids.length > 0) {
                if (count == this.batchNumber) {
                    tasks.push(this.queueUserInfoByOpenids(openids));
                    openids = [];
                    count = 0;
                }
                openids.push(opids.pop());
                count++;
            }
            return Promise.all(tasks);
        };

        this._sync = (fromOpenid, gottenCount) => {
            let group = null;
            let getFollowersPromise = fromOpenid ? this.wechatApi.getFollowersAsync(fromOpenid) :
                this.wechatApi.getFollowersAsync();
            return getFollowersPromise
                .then((result) => {
                    group = result;
                    return this.groupTasks(result.data.openid);
                }).then((results) => {
                    if (group.total > gottenCount + group.count) {
                        return this._sync(group.next_openid, gottenCount + group.count);
                    } else {
                        logger.info("Sync all subscriber from wechat successfully.");
                        return results;
                    }
                }).catch((exception) => {
                    logger.error("Sync all subscriber from wechat error, caused by " + exception.track)
                });
        };
    }

    sync(openid) {
        return this._sync(openid, 0);
    };

    queueUserInfoByOpenids(openidArray) {
        if (openidArray == null
            || openidArray.constructor.name != "Array"
            || openidArray.length > 100) {
            return null;
        }

        return this.wechatApi.batchGetUsersAsync(openidArray)
            .then((userInfoArray) => {
                if (userInfoArray == null || userInfoArray.user_info_list == null
                    || userInfoArray.user_info_list.constructor.name != "Array"
                    || userInfoArray.user_info_list.length == 0) {
                    return null;
                }
                for (let i = 0; i < userInfoArray.user_info_list.length; i++) {
                    this.wechatUserSyncQueue.add(() => {
                        return this.wechatUserService.syncUserInfoTask(userInfoArray.user_info_list[i])
                    }).then((data) => {
                        logger.info("Sync Member Completely,  id|" + data.memberId + ", unionid|" + data.unionid + ".");
                    }).catch((e) => {
                        logger.error("Sync Member Failed. Cause:" + e.stack);
                    });
                }
            });
    }

}