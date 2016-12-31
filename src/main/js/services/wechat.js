
'use strict';

/**
 * @author palmtale
 * @since 2016/12/29.
 */

import context from '../context/context';
import promisify from '../util/promisify';

import Member from '../models/member';
import WechatUser from '../models/wechat-user';
import WechatUserInfo from '../models/wechat-user-info';
import WechatScene from '../models/wechat-scence';
import WechatBonusStore from '../models/wechat-bonus-store';


export default class WechatSceneService {

    constructor(){
        //This kind of private member variables did private.
        this.wechatApi = context.wechatApi;
        this.wechatApi.createLimitQRCodeAsync = promisify(this.wechatApi.createLimitQRCode);
        this.wechatApi.batchGetUsersAsync = promisify(this.wechatApi.batchGetUsers);

        this.toMember = (wechatUserInfo) => {
            return {
                username: wechatUserInfo.unionid,
                password: 'FromWechat',
                email: wechatUserInfo.openid + "@dummy.com",
                mobile: wechatUserInfo.unionid,//TODO some digital bits. parseInt(new Date().getTime() - Math.random()*1000) + "",
                gender: wechatUserInfo.sex,
                alias: wechatUserInfo.nickname
            };
        };

        this.toUserInfo = (wechatUserInfo) => {
            return {
                unionid: wechatUserInfo.unionid,
                nickname: wechatUserInfo.nickname,
                sex: wechatUserInfo.sex,
                headimgurl: wechatUserInfo.headimgurl,
                city: wechatUserInfo.city,
                country: wechatUserInfo.country,
                province: wechatUserInfo.province,
                language: wechatUserInfo.language
            };
        };

        this.mergeUserInfo = (userInfo, wechatUserInfo) => {
            userInfo.openid = wechatUserInfo.openid;
            userInfo.unionid = wechatUserInfo.unionid;// ? wechatUserInfo.openid: null;
            userInfo.headimgurl = wechatUserInfo.headimgurl;// ? wechatUserInfo.headimgurl : null;
            userInfo.nickname = wechatUserInfo.nickname;// ? wechatUserInfo.nickname : null;
            userInfo.sex = wechatUserInfo.sex;// ? wechatUserInfo.sex : null ;
            userInfo.city = wechatUserInfo.city;//? wechatUserInfo.city: null;
            userInfo.province = wechatUserInfo.province;// ?wechatUserInfo.province :null;
            userInfo.country = wechatUserInfo.country;// ? wechatUserInfo.country :null;
            userInfo.language = wechatUserInfo.language;// ? wechatUserInfo.language:null;
            return userInfo;
        };

        this.toWechatUser = (wechatUserInfo) => {
            return {
                unionid: wechatUserInfo.unionid,
                remark: wechatUserInfo.remark,
                groupid: wechatUserInfo.groupid,
                subscribeTime: new Date(wechatUserInfo.subscribe_time * 1000)
            };
        };
    }

    findUserInfoByOpenidTask(openid) {
        return WechatUser.findOne({where: {openid: openid}})
            .then((wechatUser) => {
                if (wechatUser) {
                    /* Get wechat user info in local storage sys*/
                    return wechatUser.getWechatUserInfo();
                } else {
                    /* Get wechat user info through wechat API*/
                    return promisify(wechatApi.getUser)(openid);
                }
            }).then((userInfo) => {
                if (userInfo.openid) {
                    /*Since it did not hold openid in the entity of wechatuserinfo, this result is from wechat server */
                    return this.syncUserInfoTask(userInfo);
                } else {
                    return userInfo;
                }
            });
    }

    syncUserInfoTask(wechatUserInfo) {
        let savedWechatUserInfo = null;
        return WechatUserInfo.findOne({where: {unionid: wechatUserInfo.unionid}})
            .then((foundWechatUserInfo) => {
                if (!foundWechatUserInfo) {
                    return Member.create(this.toMember(wechatUserInfo));
                } else {
                    return foundWechatUserInfo;
                }
            }).then((object) => {
                if (object.Model.name != 'user_info') {
                    logger.warn('Member created,  id|' + object.id + ', unionid|' + wechatUserInfo.unionid);
                    let userInfo = this.toUserInfo(wechatUserInfo);
                    userInfo.memberId = object.id;
                    return WechatUserInfo.create(userInfo);
                } else {
                    object = this.mergeUserInfo(object, wechatUserInfo);
                    return object.save();
                }
            }).then((wechatUserInfo) => {
                savedWechatUserInfo = wechatUserInfo;
                let wechatUser = this.toWechatUser(wechatUserInfo);
                wechatUser.memberId = wechatUserInfo.memberId;
                return WechatUser.findOrCreate({where: {openid: wechatUserInfo.openid}, defaults: wechatUser});
            }).then(() => savedWechatUserInfo);
    }

    findUserSceneTask(openid) {
        let wechatScene = null;
        return WechatScene.findOrCreate({where: {type: 'Openid', sceneString: openid}})
            .spread((clubS, created) => {
                if (created) {
                    wechatScene = clubS;
                    return Promise.all([WechatBonusStore.create({openid: openid}),
                        this.createLimitQRCode(openid)]);
                } else {
                    return wechatScene = clubS;
                }
            }).then((result) => {
                if (result != null && result.constructor == Array) {
                    let scene = result[1];
                    wechatScene.ticket = scene.ticket;
                    wechatScene.url = scene.url;
                    wechatScene.expiredSeconds = scene.expire_seconds;
                    return wechatScene.save();
                }
                return wechatScene;
            });
    }

    syncUserInfoByOpenidsTask(openidArray, syncUserQueue) {
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
                for (let i =0 ; i< userInfoArray.user_info_list.length; i++) {
                    syncUserQueue.push(this.syncUserInfoTask, [userInfoArray.user_info_list[i]]);
                }
            });
    }
}