'use strict';

/**
 * @author palmtale
 * @since 2016/12/30.
 */


import BaseController from './base';
import context from '../context/context';

class WechatController extends BaseController {

    constructor(ctx){
        super(ctx);
    }

    subscribe(openid) {
        return context.wechat.middleware(async (ctx, next) => {
            const message = this.weixin;
            if (info.Content === '=') {
                var exp = this.wxsession.text.join('');
                this.wxsession.text = '';
                this.body = exp;
            } else {
                this.wxsession.text = this.wxsession.text || [];
                this.wxsession.text.push(info.Content);
                this.body = '收到' + info.Content;
            }
        });
    }
}

export default WechatController;