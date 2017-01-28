'use strict';

/**
 * Async/Await format converted from co-wechat
 * @author palmtale
 * @since 2017/1/28.
 */

import getRawBody from 'raw-body';
import xml2js from 'xml2js';
import crypto from 'crypto';
import ejs from 'ejs';
import WXBizMsgCrypt from 'wechat-crypto';

export default class wechat {

    constructor(config) {
        if (!(this instanceof wechat)) {
            return new wechat(config);
        }
        this.token = config;
    }

    set token(config) {
        if (typeof config === 'string') {
            this._token = config;
        } else if (typeof config === 'object' && config.token) {
            this._token = config.token;
            this.appid = config.appid || '';
            this.encodingAESKey = config.encodingAESKey || '';
        } else {
            throw new TypeError('please check your config');
        }
    }

    get token() {
        return this._token;
    }

    middleware(handle) {
        if (this.encodingAESKey) {
            this.cryptor = new WXBizMsgCrypt(this.token, this.encodingAESKey, this.appid);
        }
        return async (next) => {
            let query = this.query;
            // 加密模式
            let encrypted = !!(query.encrypt_type && query.encrypt_type === 'aes' && query.msg_signature);
            let timestamp = query.timestamp;
            let nonce = query.nonce;
            let echostr = query.echostr;
            let method = this.method;

            if (method === 'GET') {
                let valid = false;
                if (encrypted) {
                    let signature = query.msg_signature;
                    valid = signature === this.cryptor.getSignature(timestamp, nonce, echostr);
                } else {
                    // 校验
                    valid = query.signature === getSignature(timestamp, nonce, this.token);
                }
                if (!valid) {
                    this.status = 401;
                    this.body = 'Invalid signature';
                } else {
                    if (encrypted) {
                        let decrypted = this.cryptor.decrypt(echostr);
                        // TODO 检查appId的正确性
                        this.body = decrypted.message;
                    } else {
                        this.body = echostr;
                    }
                }
            } else if (method === 'POST') {
                if (!encrypted) {
                    // 校验
                    if (query.signature !== getSignature(timestamp, nonce, this.token)) {
                        this.status = 401;
                        this.body = 'Invalid signature';

                        return ;
                    }
                }
                // 取原始数据
                let xml = await getRawBody(this.req, {
                    length: this.length,
                    limit: '1mb',
                    encoding: this.charset
                });

                this.weixin_xml = xml;
                // 解析xml
                let result = await parseXML(xml);
                let formated = formatMessage(result.xml);
                if (encrypted) {
                    let encryptMessage = formated.Encrypt;
                    if (query.msg_signature !== this.cryptor.getSignature(timestamp, nonce, encryptMessage)) {
                        this.status = 401;
                        this.body = 'Invalid signature';

                        return ;
                    }
                    let decryptedXML = this.cryptor.decrypt(encryptMessage);
                    let messageWrapXml = decryptedXML.message;
                    if (messageWrapXml === '') {
                        this.status = 401;
                        this.body = 'Invalid signature';

                        return;
                    }
                    let decodedXML = await parseXML(messageWrapXml);
                    formated = formatMessage(decodedXML.xml);
                }

                // 挂载处理后的微信消息
                this.weixin = formated;

                // 取session数据
                if (this.sessionStore) {
                    this.wxSessionId = formated.FromUserName;
                    this.wxsession = await this.sessionStore.get(this.wxSessionId);
                    if (!this.wxsession) {
                        this.wxsession = {};
                        this.wxsession.cookie = this.session.cookie;
                    }
                }

                // 业务逻辑处理
                await* handle.call(this);

                // 更新session
                if (this.sessionStore) {
                    if (!this.wxsession) {
                        if (this.wxSessionId) {
                            await this.sessionStore.destroy(this.wxSessionId);
                        }
                    } else {
                        await this.sessionStore.set(this.wxSessionId, this.wxsession);
                    }
                }

                /*
                 * 假如服务器无法保证在五秒内处理并回复，可以直接回复空串。
                 * 微信服务器不会对此作任何处理，并且不会发起重试。
                 */
                if (this.body === '') {
                    return;
                }

                let replyMessageXml = reply(this.body, formated.ToUserName, formated.FromUserName);

                if (!query.encrypt_type || query.encrypt_type === 'raw') {
                    this.body = replyMessageXml;
                } else {
                    let wrap = {};
                    wrap.encrypt = this.cryptor.encrypt(replyMessageXml);
                    wrap.nonce = parseInt((Math.random() * 100000000000), 10);
                    wrap.timestamp = new Date().getTime();
                    wrap.signature = this.cryptor.getSignature(wrap.timestamp, wrap.nonce, wrap.encrypt);
                    this.body = encryptWrap(wrap);
                }

                this.type = 'application/xml';

            } else {
                this.status = 501;
                this.body = 'Not Implemented';
            }
        };
    }

}

let getSignature = (timestamp, nonce, token) => {
    let shasum = crypto.createHash('sha1');
    let arr = [token, timestamp, nonce].sort();
    shasum.update(arr.join(''));
    return shasum.digest('hex');
};

let parseXML = (xml) => {
    return (done) => xml2js.parseString(xml, {trim: true}, done);
};

/*!
 * 将xml2js解析出来的对象转换成直接可访问的对象
 */
let formatMessage = (result) => {
    let message = {};
    if (typeof result === 'object') {
        for (let key in result) {
            if (!(result[key] instanceof Array) || result[key].length === 0) {
                continue;
            }
            if (result[key].length === 1) {
                let val = result[key][0];
                if (typeof val === 'object') {
                    message[key] = formatMessage(val);
                } else {
                    message[key] = (val || '').trim();
                }
            } else {
                message[key] = result[key].map((item) => formatMessage(item));
            }
        }
    }
    return message;
};

/*!
 * 响应模版
 */
let tpl = ['<xml>',
    '<ToUserName><![CDATA[<%-toUsername%>]]></ToUserName>',
    '<FromUserName><![CDATA[<%-fromUsername%>]]></FromUserName>',
    '<CreateTime><%=createTime%></CreateTime>',
    '<MsgType><![CDATA[<%=msgType%>]]></MsgType>',
    '<% if (msgType === "news") { %>',
    '<ArticleCount><%=content.length%></ArticleCount>',
    '<Articles>',
    '<% content.forEach(function(item){ %>',
    '<item>',
    '<Title><![CDATA[<%-item.title%>]]></Title>',
    '<Description><![CDATA[<%-item.description%>]]></Description>',
    '<PicUrl><![CDATA[<%-item.picUrl || item.picurl || item.pic || item.thumb_url %>]]></PicUrl>',
    '<Url><![CDATA[<%-item.url%>]]></Url>',
    '</item>',
    '<% }); %>',
    '</Articles>',
    '<% } else if (msgType === "music") { %>',
    '<Music>',
    '<Title><![CDATA[<%-content.title%>]]></Title>',
    '<Description><![CDATA[<%-content.description%>]]></Description>',
    '<MusicUrl><![CDATA[<%-content.musicUrl || content.url %>]]></MusicUrl>',
    '<HQMusicUrl><![CDATA[<%-content.hqMusicUrl || content.hqUrl %>]]></HQMusicUrl>',
    '</Music>',
    '<% } else if (msgType === "voice") { %>',
    '<Voice>',
    '<MediaId><![CDATA[<%-content.mediaId%>]]></MediaId>',
    '</Voice>',
    '<% } else if (msgType === "image") { %>',
    '<Image>',
    '<MediaId><![CDATA[<%-content.mediaId%>]]></MediaId>',
    '</Image>',
    '<% } else if (msgType === "video") { %>',
    '<Video>',
    '<MediaId><![CDATA[<%-content.mediaId%>]]></MediaId>',
    '<Title><![CDATA[<%-content.title%>]]></Title>',
    '<Description><![CDATA[<%-content.description%>]]></Description>',
    '</Video>',
    '<% } else if (msgType === "transfer_customer_service") { %>',
    '<% if (content && content.kfAccount) { %>',
    '<TransInfo>',
    '<KfAccount><![CDATA[<%-content.kfAccount%>]]></KfAccount>',
    '</TransInfo>',
    '<% } %>',
    '<% } else { %>',
    '<Content><![CDATA[<%-content%>]]></Content>',
    '<% } %>',
    '</xml>'].join('');

/*!
 * 编译过后的模版
 */
let compiled = ejs.compile(tpl);

let wrapTpl = '<xml>' +
    '<Encrypt><![CDATA[<%-encrypt%>]]></Encrypt>' +
    '<MsgSignature><![CDATA[<%-signature%>]]></MsgSignature>' +
    '<TimeStamp><%-timestamp%></TimeStamp>' +
    '<Nonce><![CDATA[<%-nonce%>]]></Nonce>' +
    '</xml>';

let encryptWrap = ejs.compile(wrapTpl);

/*!
 * 将内容回复给微信的封装方法
 */
let reply = (content, fromUsername, toUsername) => {
    let info = {};
    let type = 'text';
    info.content = content || '';
    if (Array.isArray(content)) {
        type = 'news';
    } else if (typeof content === 'object') {
        if (content.hasOwnProperty('type')) {
            if (content.type === 'customerService') {
                return reply2CustomerService(fromUsername, toUsername, content.kfAccount);
            }
            type = content.type;
            info.content = content.content;
        } else {
            type = 'music';
        }
    }
    info.msgType = type;
    info.createTime = new Date().getTime();
    info.toUsername = toUsername;
    info.fromUsername = fromUsername;
    return compiled(info);
};

let reply2CustomerService = (fromUsername, toUsername, kfAccount) => {
    let info = {};
    info.msgType = 'transfer_customer_service';
    info.createTime = new Date().getTime();
    info.toUsername = toUsername;
    info.fromUsername = fromUsername;
    info.content = {};
    if (typeof kfAccount === 'string') {
        info.content.kfAccount = kfAccount;
    }
    return compiled(info);
};
