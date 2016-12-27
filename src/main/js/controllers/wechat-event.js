
'use strict';

/**
 * @author palmtale
 * @since 2016/12/19.
 */

var Promise = require('bluebird'),
    app = require('../context/context'),

    wechatApi = app.WechatApi,
    tuling = app.tuLing,
    memberService = require('../services/member-service'),
    imageService = require('../services/image-service'),
    venueInfoService = require('../services/venue-info-service'),
    wechatSceneService = require('../services/wechat-scene-service'),

    ClubMedia = require('../models/club-media'),
    ClubBonusStore = require('../models/club-bonus-store'),
    ClubSceneMember = require('../models/club-scene-member'),
    VenueDiscount = require('../models/venue-discount'),
    VenueVIP = require('../models/venue-vip');

var ClubEventController = function () {

    var createMemberScene = function (openid) {
        var clubScene = null;
        return Promise.all([memberService.findUserInfoByOpenidTask(openid), wechatSceneService.findUserSceneTask(openid)])
            .then(function (results) {
                var userInfo = results[0];
                clubScene = results[1];
                return imageService.makeSceneImage(openid, userInfo.headimgurl,
                    wechatApi.showQRCodeURL(clubScene.ticket), userInfo.nickname);
            }).then(function (path) {
                return wechatApi.uploadMediaAsync(path, 'image');
            }).then(function (media) {
                media.clubSceneId = clubScene.id;
                return media;
            });
    };

    var venueInfosId = function (venueInfos) {
        var result = [];
        for (var i = 0; i < venueInfos.length; i++) {
            result.push(venueInfos[i].id || venueInfos[i].venueInfoId);
        }
        return result;
    };

    var getVenueInfoDiscount = function (venueInfoId, venueInfoDiscounts) {
        for (var i = 0; i < venueInfoDiscounts.length; i++) {
            if (venueInfoId == venueInfoDiscounts[i].venueInfoId) {
                return venueInfoDiscounts[i];
            }
        }
        return null;
    };

    var attachArticles = function (promise) {
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
                picUrl: app.config.assetsURL + "/assets/img/shanghai-h-" + parseInt(1 + Math.random() * 9) + ".ps.jpg?v=1"
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
                    picUrl: app.config.clubURL + "/upload/" + vi.logoPath,
                    url: app.config.clubURL + "/venue/" + vi.id
                });
            }
            return articles;
        });
    };

    return {

        subscribe: function (openid) {
            return memberService.findUserInfoByOpenidTask(openid)
        },

        spread: function (openid) {
            var clubMedia = null;
            return ClubMedia.findOne({where: {type: 'Image', otherId: openid, table: 'ubm_wechat.club_scene'}})
                .then(function (clubM) {
                    clubMedia = clubM;
                    if (clubMedia == null || Date.now() - clubMedia.updated_at > 3 * 24 * 60 * 60 * 1000) {
                        return createMemberScene(openid);
                    } else {
                        return clubMedia;
                    }
                }).then(function (media) {
                    if (clubMedia == null) {//Case of no club media
                        return ClubMedia.create({
                            type: 'Image', mediaId: media.media_id, otherId: openid,
                            tableId: media.clubSceneId, table: 'ubm_wechat.club_scene'
                        });
                    } else if (media.clubSceneId) { //case of expired club media
                        clubMedia.mediaId = media.media_id;
                        clubMedia.updated_at = Date.now();
                        return clubMedia.save();
                    }
                    return clubMedia;//Case of existed club media.
                }).then(function (clubMedia) {
                    return clubMedia.mediaId;
                }).then(function (mediaId) {
                    return wechatApi.sendImageAsync(openid, mediaId);
                }).then(function (result) {
                    return ClubBonusStore.findOne({where:{openid:openid}});
                }).then(function (clubBonusStore) {
                    return wechatApi.sendTextAsync(openid, "转发此图片到朋友圈或给你的微信朋友，即可代言！通过代言你已经赚了 "
                        + clubBonusStore.earned + "元。");
                });
        },

        spreaded: function (spreader, follower, userInfo) {
            return ClubSceneMember.create({openid: follower, memberId: userInfo.memberId, sceneString: spreader})
                .then(function (clubSceneMember) {
                    return ClubBonusStore.find({where: {openid: clubSceneMember.sceneString}})
                }).then(function (clubBonusStore) {
                    if(clubBonusStore) {
                        clubBonusStore.earned = clubBonusStore.earned + 1.00;
                        return clubBonusStore.save();
                    } else {
                        return null;
                    }
                }).then(function (clubBonusStore) {
                    return wechatApi.sendTextAsync(spreader, "[" + userInfo.nickname + "] 通过扫描你的二维码关注了小品。");
                });
        },

        keywords: function (openid, said) {
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
        },

        locate: function (openid, x, y) {
            return attachArticles(Promise.all(
                [memberService.findMemberVIPTask(openid), venueInfoService.findDistanceVenuesTask(x, y)]
                )
            );
        }//locate
    };

};

module.exports = new ClubEventController();