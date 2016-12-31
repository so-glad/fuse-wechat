
'use strict';

/**
 * @author palmtale
 * @since 2016/12/29.
 */

export default function (method) {
    return (ctx) => {
        const args = Array.prototype.slice.call(arguments, 1);
        return new Promise((resolve, reject) => {
            args.push((err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
            method.apply(ctx, args);
        });
    };
};

