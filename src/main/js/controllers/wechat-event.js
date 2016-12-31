
'use strict';

/**
 * @author palmtale
 * @since 2016/12/19.
 */

import context from '../context/context';
import memberService from '../services/member';
import imageService  from '../services/image';
import wechatSceneService from '../services/wechat';

import WechatMedia from '../models/wechat-media';
import WechatBonusStore from '../models/wechat-bonus-store';
import WechatSceneMember from '../models/wechat-scene-member';

let createMemberScene = function (openid) {
    let wechatScene = null;
    return Promise.all([memberService.findUserInfoByOpenidTask(openid), wechatSceneService.findUserSceneTask(openid)])
        .then((results) => {
            let userInfo = results[0];
            wechatScene = results[1];
            return imageService.makeSceneImage(openid, userInfo.headimgurl,
                context.wechatApi.showQRCodeURL(wechatScene.ticket), userInfo.nickname);
        }).then((path) => {
            return context.wechatApi.uploadMediaAsync(path, 'image');
        }).then((media) => {
            media.clubSceneId = wechatScene.id;
            return media;
        });
};

let venueInfosId = function (venueInfos) {
    var result = [];
    for (var i = 0; i < venueInfos.length; i++) {
        result.push(venueInfos[i].id || venueInfos[i].venueInfoId);
    }
    return result;
};

let getVenueInfoDiscount = function (venueInfoId, venueInfoDiscounts) {
    for (var i = 0; i < venueInfoDiscounts.length; i++) {
        if (venueInfoId == venueInfoDiscounts[i].venueInfoId) {
            return venueInfoDiscounts[i];
        }
    }
    return null;
};

let attachArticles = function (promise) {
    var memberVIP = null, venueInfos = null, venueVIPs = [];
    return promise.then(function (results) {
        memberVIP = results[0];
        venueInfos = results[1];
        if (!venueInfos || venueInfos.length == 0) {
            return null;
        }
        var venueInfoIds = venueInfosId(venueInfos);
        if (memberVIP) {
            return VenueVIP.findAll({
                where: {discount: {$notIn:['-1','0']},
                    venueInfoId: {$in: venueInfoIds}, $or: [
                        {ruleCodes: memberVIP.ruleCode}, {ruleCodes: {$like: memberVIP.ruleCode + ',%'}},
                        {ruleCodes: {$like: '%,' + memberVIP.ruleCode}},
                        {ruleCodes: {$like: '%,' + memberVIP.ruleCode + ',%'}}]
                }
            });
        } else {
            return VenueDiscount.findAll({where: {venueInfoId: {$in: venueInfoIds}}});
        }
    }).then(function (venueDiscounts) {
        if (!venueDiscounts||venueDiscounts.length == 0) {
            return null;
        } else if (memberVIP && venueDiscounts.length < venueInfos.length) {
            var noVIPVenueInfoIds = [];
            for (var i = 0; i < venueInfos.length; i++) {
                if (getVenueInfoDiscount(venueInfos[i].id, venueDiscounts) == null) {
                    noVIPVenueInfoIds.push(venueInfos[i].id);
                }
            }
            venueVIPs = venueDiscounts;
            return VenueDiscount.findAll({where: {venueInfoId: {$in: noVIPVenueInfoIds}}});
        } else {
            return venueDiscounts;
        }
    }).then(function (venueDiscounts) {
        if (!venueDiscounts) {
            return null;
        }
        var articles = [{
            title: "Taste the best of Shanghai",
            url: "http://m.urbem.cn/search?sort=dist",
            picUrl: context.config.assetsURL + "/assets/img/shanghai-h-" + parseInt(1 + Math.random() * 9) + ".ps.jpg?v=1"
        }];
        venueDiscounts = venueDiscounts.concat(venueVIPs);
        for (var i = 0; i < venueInfos.length; i++) {
            var vi = venueInfos[i];
            var vd = getVenueInfoDiscount(vi.id, venueDiscounts);
            if(vd.discount == 0){
                vd.discountInfo = "礼遇";
            } else {
                vd.discountInfo = ((100.00 - vd.discount) / 10.00) + vd.pattern;
            }
            articles.push({
                title: vi.name + (vi.alias ? " - " + vi.alias : "") + "\r\n"
                + vd.discountInfo + " " + (vi.distance ? vi.distance : ""),
                picUrl: context.config.clubURL + "/upload/" + vi.logoPath,
                url: context.config.clubURL + "/venue/" + vi.id
            });
        }
        return articles;
    });
};

class WechatEventController {

    constructor(){
        this.memberService = new MemberService
    }

    subscribe(openid) {
        return memberService.findUserInfoByOpenidTask(openid)
    }

    spread(openid) {
        let wechatMedia = null;
        return WechatMedia.findOne({where: {type: 'Image', otherId: openid, table: ''}})
            .then((wechatM) => {
                wechatMedia = wechatM;
                if (wechatMedia == null || Date.now() - wechatMedia.updated_at > 3 * 24 * 60 * 60 * 1000) {
                    return createMemberScene(openid);
                } else {
                    return wechatMedia;
                }
            }).then((media) => {
                if (wechatMedia == null) {//Case of no wechat media
                    return WechatMedia.create({
                        type: 'Image', mediaId: media.media_id, otherId: openid,
                        tableId: media.clubSceneId, table: 'ubm_wechat.club_scene'
                    });
                } else if (media.clubSceneId) { //case of expired club media
                    wechatMedia.mediaId = media.media_id;
                    wechatMedia.updated_at = Date.now();
                    return wechatMedia.save();
                }
                return wechatMedia;//Case of existed club media.
            }).then((wechatMedia) => {
                return context.wechatApi.sendImageAsync(openid, wechatMedia.mediaId);
            }).then(() => {
                return WechatBonusStore.findOne({where:{openid:openid}});
            }).then((wechatBonusStore) => {
                return context.wechatApi.sendTextAsync(openid, ""
                        + wechatBonusStore.earned + "元。");
            });
        }

    spreaded(spreader, follower, userInfo) {
        return WechatSceneMember.create({openid: follower, memberId: userInfo.memberId, sceneString: spreader})
            .then(function (clubSceneMember) {
                return WechatBonusStore.find({where: {openid: clubSceneMember.sceneString}})
            }).then(function (clubBonusStore) {
                if(clubBonusStore) {
                    clubBonusStore.earned = clubBonusStore.earned + 1.00;
                    return clubBonusStore.save();
                } else {
                    return null;
                }
            }).then(() => {
                return context.wechatApi.sendTextAsync(spreader, "[" + userInfo.nickname + "] 通过扫描你的二维码关注了。");
            });
    }

    keywords(openid, said) {
        return attachArticles(Promise.all(
            [memberService.findMemberVIPTask(openid), venueInfoService.findKeywordsVenues(said)]
            )
        ).then(function (articles) {
            if(articles && articles.length > 0) {
                return articles;
            }
            return tuling.send({userid: openid, info: said})
                .then(function (response) {
                    return response.text;
                });
        });
    }

    locate(openid, x, y) {
        return attachArticles(Promise.all(
            [memberService.findMemberVIPTask(openid), venueInfoService.findDistanceVenuesTask(x, y)]
            )
        );
    }//locate

}

export default new WechatEventController();