
'use strict';

/**
 * @author palmtale
 * @since 16/12/24.
 */

import BaseController from './base';

class IndexController extends BaseController {

    constructor(ctx){
        super(ctx);
    }

    index(){
        return this._context.render('index', {});
    }
}

export default IndexController;