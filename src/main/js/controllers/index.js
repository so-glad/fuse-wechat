
'use strict';

/**
 * @author palmtale
 * @since 2016/12/31.
 */

import BaseController from './base';

export default class IndexController extends BaseController {

    constructor(){
        super();
    }

    index(ctx) {
        return ctx.render('index', this.view.extend({title: "SoGlad", subTitle: "Cool"}));
    }
}