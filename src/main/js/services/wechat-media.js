
'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import context from '../context/context';
import promisify from '../util/promisify';

import WechatMedia from '../models/wechat-media';

export default class WechatMediaService {

    constructor(){
        this.wechatApi = context.wechatApi;
    }

    syncMediaTask(mediaId) {
        WechatMedia.findOne({where: {mediaId: mediaId}})
            .then((wechatMedia) => {
                if(wechatMedia){
                    return wechatMedia;
                } else {
                    return this.wechatApi.getMaterial(mediaId);
                }
            }).then((wechatMedia) => {
                if(wechatMedia){
                    return wechatMedia;
                } else {
                    return this.wechatApi.getMedia(mediaId);
                }
            }).then((wechatMedia) => {
                if(!wechatMedia){
                    return wechatMedia;
                } else if (wechatMedia.id) {
                    return wechatMedia;
                } else {
                    return WechatMedia.create({
                        mediaId: wechatMedia.mediaId,
                        content: wechatMedia
                    });
                }
            });
    }

}