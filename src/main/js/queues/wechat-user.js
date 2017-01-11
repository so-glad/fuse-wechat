'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import Queue from 'promise-queue';
import log4js from 'koa-log4';

import promisefy from '../util/promisify';
const logger = log4js.getLogger('fuse-wechat');


export default class WechatUserQueue {

    constructor(context) {
        this.batchNumber = 100;
        this.wechatApi = context.wechatApi;
        this.wechatUserService = context.module('service.wechat.user');
        this.wechatUserSyncQueue = new Queue(context.config.wechat.sync.user_queue.concurrency,
            context.config.wechat.sync.user_queue.max);

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
            let followerResult = null, totalCount = 0;
            const getFollowersAsync = promisefy(this.wechatApi.getFollowers);

            return getFollowersAsync(fromOpenid)
                .then((result) => {
                    followerResult = result;
                    totalCount = result.total;
                    gottenCount = gottenCount + result.count;
                    return this.groupTasks(result.data.openid);
                }).then((results) => {
                    if (totalCount > gottenCount) {
                        return this._sync(followerResult.next_openid, gottenCount);
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
        const batchGetUsersAsync = promisefy(this.wechatApi.batchGetUsers);
        return batchGetUsersAsync(openidArray)
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