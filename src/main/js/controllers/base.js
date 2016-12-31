
'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */

class BaseController {

    constructor(){

    }

    get view() {
        let thisObject = {
            partials: {
                header: "../partials/header",
                footer: "../partials/footer",
                before: "../partials/before",
                after:  "../partials/after"
            },
            extend: (object) => {
                let properties = Object.keys(object);
                for(let i = 0; i < properties.length; i++){
                    thisObject[properties[i]] = object[properties[i]];
                }
                return thisObject;
            }
        };
        return thisObject;
    }
}

export default BaseController;
