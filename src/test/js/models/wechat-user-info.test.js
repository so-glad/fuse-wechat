'use strict';

/**
 * @author palmtale
 * @since 2017/1/19.
 */

import WechatUserInfo from '../../lib/models/wechat-user-info';

describe('models/wechat-user-info', () => {
    describe('sequelize', () => {
        it('Should find while no record in db', (done) => {
            WechatUserInfo.findOne({where: {unionid: 'zzdfda'}})
                .then((r) => {
                    done();
                })
                .catch((e) => {
                    done();
                });
        });
    });
});