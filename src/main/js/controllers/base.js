
'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */

class BaseController {

    get context() {
        return this._context;
    };

    constructor(ctx){
        this._context = ctx;
    }
}

export default BaseController;
