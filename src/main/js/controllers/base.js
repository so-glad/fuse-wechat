
'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */

class BaseController {

    get context() {
        return this._context;
    };

    set context(context) {
        this._context = context;
    }

    ctx(context){
        this._context = context;
        return this;
    }

    constructor(ctx){
        this._context = ctx;
    }
}

export default BaseController;
