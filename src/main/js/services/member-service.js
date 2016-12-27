'use strict';

/**
 * @author palmtale
 * @since 2016/8/19.
 */

import log4js from 'koa-log4';

import context from '../context/context';
import Member from '../models/member';
import WechatUser from '../models/wechat-user';
import WechatUserInfo from '../models/wechat-user-info';

const logger = log4js.getLogger('fuse-wechat');

export default (function () {

    const wechatApi = context.wechatApi;

    const toMember = (wechatUserInfo) => {
        return {
            username: wechatUserInfo.unionid,
            password: 'FromWechat',
            email: wechatUserInfo.openid + "@dummy.com",
            mobile: wechatUserInfo.unionid,//TODO some digital bits. parseInt(new Date().getTime() - Math.random()*1000) + "",
            gender: wechatUserInfo.sex,
            alias: wechatUserInfo.nickname
        };
    };

    const toUserInfo = (wechatUserInfo) => {
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

    const mergeUserInfo = (userInfo, wechatUserInfo) => {
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

    const toClubUser = (wechatUserInfo) => {
        return {
            unionid: wechatUserInfo.unionid,
            remark: wechatUserInfo.remark,
            groupid: wechatUserInfo.groupid,
            subscribeTime: new Date(wechatUserInfo.subscribe_time * 1000)
        };
    };

    const filterOutSomeIssueUser = (openIdArray) => {
        const issueOpenids = ['ox4-zuLpsjqL826kykkzKNk9e1L0'];
        for(let i =0; i < issueOpenids.length; i++) {
            let openid = issueOpenids[i];
            if(openIdArray.indexOf(openid) >= 0) {
                openIdArray.splice(openIdArray.indexOf(openid), 1);
            }
        }
        return openIdArray;
    };

    const tempCreateMember = (wechatUserInfo, memberId) => {
        let weixinUI = null, foundMember = null;
        return WeixinUserInfo.findOne({where: {openid: wechatUserInfo.openid}})
            .then((weixinUserInfo) => {
                if (weixinUserInfo) {
                    weixinUI = weixinUserInfo;
                    return weixinUserInfo.getMainMember()
                }
                return null;
            }).then((mainMember) => {
                if (mainMember) {
                    if(memberId && mainMember.id != memberId) {
                        logger.warn("Member id is diff in two sys, old|" + mainMember.id + ", new|" + memberId + ", openid|" + wechatUserInfo.openid + ".");
                    }
                    if(!memberId) {
                        return Member.findOrCreate({
                            where: {$or: [{id: mainMember.id}, {email: mainMember.email}, {mobile: mainMember.mobile}]},
                            defaults: { email: mainMember.email, mobile: mainMember.mobile, alias: mainMember.alias, username: wechatUserInfo.openid, password: 'FromOldSys'}
                        });
                    } else {
                        return mainMember;
                    }
                } else if (memberId) {
                    return MainMember.findOrCreate({where: {$or: [{id: memberId}, {email:wechatUserInfo.openid + '@dummy.com'}, {mobile:wechatUserInfo.unionid}]}, defaults: toMember(wechatUserInfo)});
                } else {
                    let obj = {where: {$or: [{email:wechatUserInfo.openid + '@dummy.com'}, {mobile:wechatUserInfo.unionid}]}, defaults: toMember(wechatUserInfo)};
                    return MainMember.findOrCreate(obj).then((mainMember) =>  Member.findOrCreate(obj) );
                }
            }).then((member) => {
                foundMember = member.constructor.name=='Array' ? member[0]: member;
                if (weixinUI) {
                    weixinUI.openid = wechatUserInfo.openid;
                    weixinUI.memberId = foundMember.id;
                    weixinUI.unionid = wechatUserInfo.unionid;
                    weixinUI.headimgurl = wechatUserInfo.headimgurl;
                    weixinUI.nickname = wechatUserInfo.nickname;
                    return weixinUI.changed() ? weixinUI.save() : weixinUI;
                } else {
                    return WeixinUserInfo.create({
                        openid: wechatUserInfo.openid, memberId: foundMember.id, unionid: wechatUserInfo.unionid,
                        nickname: wechatUserInfo.nickname, headimgurl: wechatUserInfo.headimgurl
                    });
                }
            }).then(() => {
                if(memberId) {
                    delete wechatUserInfo.openid;
                    return wechatUserInfo.changed() ? wechatUserInfo.save() : wechatUserInfo;
                } else {return foundMember;}
            });
    };

    return {

        findUserInfoByOpenidTask: (openid) => {
            let syncUserInfoTask = this.syncUserInfoTask;
            return WechatUser.findOne({where: {openid: openid}})
                .then((clubUser) => {
                    if (clubUser) {
                        return clubUser.getWechatUserInfo();
                    } else {
                        return wechatApi.getUserAsync(openid);
                    }
                }).then((userInfo) => {
                    if(userInfo.openid) {
                        /* Means user info from wechat */
                        return syncUserInfoTask(userInfo);
                    } else {
                        return userInfo;
                    }
                });
        },

        syncUserInfoTask: (wechatUserInfo) => {
            let savedWechatUserInfo = null;
            return WechatUserInfo.findOne({where: {unionid: wechatUserInfo.unionid}})
                .then((clubWechatUserInfo) => {
                    if(!clubWechatUserInfo) {
                        return tempCreateMember(wechatUserInfo, null); //Member.create(toMember(wechatUserInfo));
                    } else {
                        return clubWechatUserInfo;
                    }
                }).then((object) => {
                    if(object.Model.name != 'user_info') {
                        logger.warn('Member created,  id|' + object.id + ', unionid|' + wechatUserInfo.unionid);
                        let userInfo = toUserInfo(wechatUserInfo);
                        userInfo.memberId = object.id;
                        return WechatUserInfo.create(userInfo);
                    } else {
                        logger.info('Member updated,  id|' + object.memberId + ', unionid|' + wechatUserInfo.unionid);
                        object = mergeUserInfo(object, wechatUserInfo);
                        return tempCreateMember(object, object.memberId); //object.save()
                    }
                }).then((clubWechatUserInfo) => {
                    savedWechatUserInfo = clubWechatUserInfo;
                    let clubUser = toClubUser(wechatUserInfo);
                    clubUser.memberId = clubWechatUserInfo.memberId;
                    return WechatUser.findOrCreate({where: {openid: wechatUserInfo.openid}, defaults: clubUser});
                }).then(() => {
                    return savedWechatUserInfo;
                });
        },

        syncUserInfoByOpenidsTask: (openidArray, syncUserQueue) => {
            if (openidArray == null
                || openidArray.constructor.name != "Array"
                || openidArray.length > 100) {
                return null;
            }
            let syncUserInfoTask = this.syncUserInfoTask;

            return wechatApi.batchGetUsersAsync(filterOutSomeIssueUser(openidArray))
                .then((userInfoArray) => {
                    if (userInfoArray == null || userInfoArray.user_info_list == null
                        || userInfoArray.user_info_list.constructor.name != "Array"
                        || userInfoArray.user_info_list.length == 0) {
                        return null;
                    }
                    for (let i =0 ; i< userInfoArray.user_info_list.length; i++) {
                        syncUserQueue.push(syncUserInfoTask, [userInfoArray.user_info_list[i]]);
                    }
                });
        },

        findMemberVIPTask: (openid) => {
            return WechatUser.findOne({where: {openid: openid}})
                .then((clubUser) => {
                    if(clubUser){
                        return clubUser.getMember();
                    }
                    return null;
                }).then((member) => {
                    if(!member){
                        return null;
                    }
                    let now = Date.now();
                    return MemberVIP.findOne({
                        where: {
                            memberId: member.id,
                            beginDate: {$lte: now},
                            endDate: {$gte: now}
                        }
                    });
                })
                .then((memberVIP) => {
                    if (memberVIP) {
                        return memberVIP;
                    } else {
                        return null;
                    }
                }).catch((error) => {
                    logger.error(error.stack)
                });
        }

    };

})();