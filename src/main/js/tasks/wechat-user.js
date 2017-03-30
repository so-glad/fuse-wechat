'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import log4js from 'koa-log4';

import Queue from '../util/promise-queue';

const logger = log4js.getLogger('fuse-wechat-script');


export default class WechatUserTask {

    constructor(context) {
        this.batchNumber = 100;
        this.wechatApi = context.module('client.wechat');
        this.wechatUserService = context.module('service.wechat.user');
        this.wechatUserSyncQueue = new Queue(context.config.wechat.sync.user_queue.concurrency);

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
                    logger.error("Sync all subscriber from wechat error, caused by " + exception.stack)
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
                    let userInfo = userInfoArray.user_info_list[i];
                    this.wechatUserSyncQueue.add(() => {
                        return this.wechatUserService.saveUserInfo(userInfo)
                    }).then((data) => {
                        logger.info("Sync User Completely,  id|" + data.memberId +
                            ", unionid|" + data.unionid + ", openid|" + userInfo.openid);
                    }).catch((e) => {
                        logger.error("Sync User Failed, unionid|" + userInfo.unionid +
                            ", openid|" + userInfo.openid + ", Cause: " + e.stack + "");
                    });
                }
            });
    }

}