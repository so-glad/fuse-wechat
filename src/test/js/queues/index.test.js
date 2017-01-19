'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */


import Queue from 'promise-queue';

const maxConcurrent = 100;
const maxQueue = 500;
const queue = new Queue(maxConcurrent, maxQueue);

const f = (n) => {
    queue.add(() => {
        return new Promise((resolved, rejected) => {
            console.info(n + " Queue Lenght: " + queue.getQueueLength());
            console.info(n + " Pending Lenght: " + queue.getPendingLength());
            return resolved(n);
        });
    }).then((r) => {
        console.info("Success," + r);
    }).catch((e) => {
        console.error("Errored, " + e.message)
    });
};

for (let i = 0; i < 58; i++) {
    f(i);
}

let n = 100;
let loop = () => {
    setTimeout(() => {
        f(n++);
        if (n != 200) {
            loop();
        }
    }, 2000);
};
loop();