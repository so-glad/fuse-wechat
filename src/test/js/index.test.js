'use strict';

/**
 * @author palmtale
 * @since 16/7/14.
 */

const should = require('should');


describe('soglad/fuse-wechat', function () {
    require('./models/wechat-user-info.test');
    require('./queues/media.test');
    require('./queues/user.test');
    require('./util/promisefy.test');
});
