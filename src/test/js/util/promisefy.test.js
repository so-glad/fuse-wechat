
'use strict';

/**
 * @author palmtale
 * @since 2017/1/13.
 */

import should from 'should';
import redis from 'redis';

import Promisify from '../../../main/js/util/promisify';

let ctx = {
    method: (data, callback) => {
        if (data.indexOf('error') == 0) {
            callback(new Error("Error: " + data));
        } else {
            callback(null, data);
        }
    }
};

let redisDefine = {options: {host: "localhost", port: 6379, db: 1}, timeout: 7000, key: 'testKey', value: 'testValue'};

describe('soglad/fuse-wechat/util/promisify', () => {

    describe('exec', () => {
        let promisedCtx = new Promisify(ctx, ctx.method);
        it('Promisify.exec should be passed.', (done) => {
            promisedCtx.exec("pass1").then((r) => {
                console.info(r);
                done();
            }).catch((e) => {
                console.error(e.message);
                done();
            });
        });
        it('Promisify.exec should catch error.', (done) => {
            promisedCtx.exec("error1").then((r) => {
                console.info(r);
                done();
            }).catch((e) => {
                console.error(e.message);
                done();
            });
        });
    });

    describe('promisify', () => {
        Promisify.promisefy(ctx, ctx.method);
        it('Promisify.promisify should be passed.', (done) => {
            ctx.methodAsync("pass2").then((r) => {
                console.info(r);
                done();
            }).catch((e) => {
                console.error(e.message);
                done();
            });
        });
        it('Promisify.promisify should catch error.', (done) => {
            ctx.methodAsync("error2").then((r) => {
                console.info(r);
                done();
            }).catch((e) => {
                console.error(e.message);
                done();
            });
        });
    });

    describe('redis/set', () => {
        let redisClient = redis.createClient(redisDefine.options);
        Promisify.promisefy(redisClient, redisClient.set);

        it('Should set key correctly', (done) => {
            redisClient.setAsync(redisDefine.key, redisDefine.value)
                .then((r) => {
                    redisClient.expire(redisDefine.key, redisDefine.timeout);
                    done();
                })
                .catch((e) => {
                    console.error(e.message);
                    done();
                });
        });

    });

    describe('redis/get', () => {
        let redisClient = redis.createClient(redisDefine.options);
        Promisify.promisefy(redisClient, redisClient.get);
        it('Should get key correctly', (done) => {
            redisClient.getAsync(redisDefine.key)
                .then((r) => {
                    r.should.equal(redisDefine.value);
                    done();
                })
                .catch((e) => {
                    done();
                });
        });

        it('Should not get value because of expiration', (done) => {
            this.timeout(redisDefine.timeout + 2000);
            let task = () => redisClient.getAsync(redisDefine.key)
                .then((r) => {
                    r.should.equal(null);
                    done();
                })
                .catch((e) => {
                    done();
                });
            setTimeout(task , redisDefine.timeout);
        });
    });
});