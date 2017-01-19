
'use strict';

/**
 * @author palmtale
 * @since 2016/12/29.
 */

let isString = (obj) => Object.prototype.toString.call(obj) === "[object String]";

export default class Promisify {

    constructor(ctx, method) {
        this.ctx = ctx;
        this.method = method;
    }

    exec() {
        const args = Array.prototype.slice.call(arguments);
        return new Promise((resolve, reject) => {
            args.push((err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
            this.method.apply(this.ctx, args);
        });
    };

    /**
     * Would attache a new method on ctx with the name of form below:
     * method name + Async,
     * Which would be the method's promised method.
     */

    static promisefy(ctx, method) {
        let methodImpl = method, methodName = method.name;
        if(isString(method)) {
            methodImpl = ctx[method];
            methodName = method;
        }
        methodName = methodName + "Async";
        ctx[methodName] = function() {
            const args = Array.prototype.slice.call(arguments);
            return new Promise((resolve, reject) => {
                args.push((err, result) => {
                    if (err) {
                        reject(err);
                    } else{
                        resolve(result);
                    }
                });
                methodImpl.apply(this, args);
            });
        };
        return ctx;
    }
}
