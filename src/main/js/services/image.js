'use strict';

/**
 * @author palmtale
 * @since 2016/12/29.
 */

import GM from 'gm';
import fetch from 'fetch';
import log4js from 'koa-log4';
import fs from 'fs';

import promisify from '../util/promisify';

const logger = log4js.getLogger("fuse-wechat");

const headImgPrefix = 'data/headImage/';
const qrCodePrefix = 'data/qrCode/';


export default class ImageService {

    constructor() {
        fs.writeFileAsync = promisify(fs.writeFile);
        this.fetchImage = (openid, url) => new Promise((resolve, reject) => {
            fetch.fetchUrl(url, {}, (error, meta, body) => {
                if (error) {
                    return reject(error);
                }
                return resolve(body);
            })
        }).then((r) => {
            let path = (url.indexOf('https') === 0 ? qrCodePrefix : headImgPrefix) + openid + '.jpg';
            return fs.writeFileAsync(path, r);
        });
    }

    makeSceneImage(openid, headImageUrl, qrCodeUrl, nickname) {
        const path = "data/scene/" + openid + ".jpg";
        return Promise.all([this.fetchImage(openid, headImageUrl.substring(0, headImageUrl.length - 1) + "132"),
            this.fetchImage(openid, qrCodeUrl)])
            .then(() => {
                const gm = GM().in('-page', '+0+0')
                    .in('data/scene_base.jpg')
                    .in('-page', '+20+450')
                    .in(headImgPrefix + openid + '.jpg')
                    .in('-resize', '344x344')
                    .in('-page', '+245+755')
                    .in(qrCodePrefix + openid + '.jpg')
                    .mosaic()
                    .fill("rgb(230,99,39)").drawText(340, 480, nickname)
                    .font("data/microblack.ttf").fontSize("50");
                return promisify(gm.write)(path);
            }).catch((error) => {
                logger.error('Make scene image error, cause: ' + error.message);
            });
    }
}