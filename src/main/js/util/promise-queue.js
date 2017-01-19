'use strict';

/**
 * @author palmtale
 * @since 2017/1/20.
 */

/**
 * @return {Object}
 */
let LocalPromise = typeof Promise !== 'undefined' ? Promise : function () {
        return {
            then: function () {
                throw new Error('Queue.configure() before use Queue');
            }
        };
    };

let noop = function () {
};

/**
 * @param {*} value
 * @returns {LocalPromise}
 */
let resolveWith = (value) => {
    if (value && typeof value.then === 'function') {
        return value;
    }

    return new LocalPromise((resolve) => {
        resolve(value);
    });
};

/**
 * It limits concurrently executed promises
 *
 * @param {Number} [maxPendingPromises=Infinity] max number of concurrently executed promises
 * @param {Number} [maxQueuedPromises=Infinity]  max number of queued promises
 * @constructor
 *
 * @example
 *
 * var queue = new Queue(1);
 *
 * queue.add(function () {
     *     // resolve of this promise will resume next request
     *     return downloadTarballFromGithub(url, file);
     * })
 * .then(function (file) {
     *     doStuffWith(file);
     * });
 *
 * queue.add(function () {
     *     return downloadTarballFromGithub(url, file);
     * })
 * // This request will be paused
 * .then(function (file) {
     *     doStuffWith(file);
     * });
 */
export default class Queue {

    constructor(maxPendingPromises, maxQueuedPromises) {
        this.pendingPromises = 0;
        this.maxPendingPromises = typeof maxPendingPromises !== 'undefined' ? maxPendingPromises : Infinity;
        this.maxQueuedPromises = typeof maxQueuedPromises !== 'undefined' ? maxQueuedPromises : Infinity;
        this.queue = [];
    }

    /**
     * Defines promise promiseFactory
     * @param {Function} GlobalPromise
     */
    static configure(GlobalPromise) {
        LocalPromise = GlobalPromise;
    }

    /**
     * Number of simultaneously running promises (which are resolving)
     *
     * @return {number}
     */
    get pendingLength() {
        return this.pendingPromises;
    }

    /**
     * Number of queued promises (which are waiting)
     *
     * @return {number}
     */
    get queueLength() {
        return this.queue.length;
    }

    /**
     * @param {Function} promiseGenerator
     * @return {LocalPromise}
     */
    add(promiseGenerator) {
        return new LocalPromise((resolve, reject, notify) => {
            // Do not queue to much promises
            if (this.queue.length >= this.maxQueuedPromises) {
                reject(new Error('Queue limit reached'));
                return;
            }

            // Add to queue
            this.queue.push({
                promiseGenerator: promiseGenerator,
                resolve: resolve,
                reject: reject,
                notify: notify || noop
            });

            this._dequeue();
        });
    }


    /**
     * @returns {boolean} true if first item removed from queue
     * @private
     */
    _dequeue() {
        if (this.pendingPromises >= this.maxPendingPromises) {
            return false;
        }

        // Remove from queue
        let item = this.queue.shift();
        if (!item) {
            return false;
        }

        try {
            this.pendingPromises++;

            resolveWith(item.promiseGenerator())
            // Forward all stuff
                .then((value) => {
                    // It is not pending now
                    this.pendingPromises--;
                    // It should pass values
                    item.resolve(value);
                    this._dequeue();
                }, (err) => {
                    // It is not pending now
                    this.pendingPromises--;
                    // It should not mask errors
                    item.reject(err);
                    this._dequeue();
                }, (message) => {
                    // It should pass notifications
                    item.notify(message);
                });
        } catch (err) {
            this.pendingPromises--;
            item.reject(err);
            this._dequeue();
        }

        return true;
    }
}