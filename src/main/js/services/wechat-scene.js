'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import WechatScene from '../models/wechat-scence';
import WechatBonusStore from '../models/wechat-bonus-store';

export default class WechatSceneService {
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
}
 
 
