'use strict';

const dateformat = require('dateformat');
const stackTrace = require('stack-trace');

const DATE_FORMAT_ISO8601 = "yyyy-mm-dd'T'HH:MM:ss'Z'";
const DATE_FORMAT_RFC1123 = "ddd, dd mmm yyyy HH:MM:ss 'GMT'";

const BASE64_CHARS_PATTERN = /[^A-Z0-9+\/=]/i;

/**
 * Collection of utility methods.
 */
class GeneralUtils {

    //noinspection JSUnusedGlobalSymbols
    /**
     * Concatenate the url to the suffix - making sure there are no double slashes
     *
     * @param {String} url - The left side of the URL.
     * @param {String} suffix - the right side.
     * @return {String} the URL
     **/
    static urlConcat(url, suffix) {
        let left = url;
        if (url.lastIndexOf("/") === (url.length - 1)) {
            left = url.slice(0, url.length - 1);
        }

        if (suffix.indexOf("/") === 0) {
            return left + suffix;
        }

        return left + "/" + suffix;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Convert object into json string
     *
     * @param {Object} o
     * @return {String}
     */
    static toJson(o) {
        return JSON.stringify(o);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Mixin methods from one object into another.
     * Follow the prototype chain and apply form root to current - but skip the top (Object)
     *
     * @param {Object} to The object to which methods will be added
     * @param {Object} from The object from which methods will be copied
     */
    static mixin(to, from) {
        let index, protos = [], proto = from;
        while (!!proto) {
            protos.push(Object.getOwnPropertyNames(proto));
            proto = Object.getPrototypeOf(proto);
        }

        for (index = protos.length - 2; index >= 0; index--) {
            protos[index].forEach(function(method) {
                if (!to[method] && typeof from[method] === 'function' && method !== 'constructor') {
                    _mixin(to, from, method);
                }
            });
        }
    };

    /**
     * Generate GUID
     *
     * @return {String}
     */
    static guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            // noinspection MagicNumberJS, NonShortCircuitBooleanExpressionJS
            const r = Math.random() * 16 | 0;
            // noinspection MagicNumberJS, NonShortCircuitBooleanExpressionJS
            const v = (c === 'x') ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Clone object
     *
     * @param {Date|Array|Object} obj
     * @return {*}
     */
    static clone(obj) {
        // noinspection EqualityComparisonWithCoercionJS
        if (obj == null || typeof obj !== "object") {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return Array.from(obj);
        }

        if (obj instanceof Object) {
            const copy = obj.constructor();
            for (const attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = GeneralUtils.clone(obj[attr]);
                }
            }
            return copy;
        }

        throw new Error("Unable to copy object! Its type isn't supported.");
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Creates a property with default configuration (writable, enumerable, configurable).
     *
     * @param {Object} obj The object to create the property on.
     * @param {String} name The name of the property
     * @param {Function} getFunc The getter of the property
     * @param {Function} setFunc The setter of the property
     */
    static definePropertyWithDefaultConfig(obj, name, getFunc, setFunc) {
        Object.defineProperty(obj, name, {
            enumerable: true,
            configurable: true,
            get: getFunc,
            set: setFunc
        });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Creates a property with default configuration (writable, enumerable, configurable) and default getter/setter.
     *
     * @param {Object} obj The object to create the property on.
     * @param {String} name The name of the property
     */
    static defineStandardProperty(obj, name) {
        const getFunc = function get () { return this[`_${name}`]; };
        const setFunc = function set (v) { this[`_${name}`] = v; };
        GeneralUtils.definePropertyWithDefaultConfig(obj, name, getFunc, setFunc);
    };

    /**
     * Waits a specified amount of time before resolving the returned promise.
     *
     * @param {int} ms The amount of time to sleep in milliseconds.
     * @param {PromiseFactory} promiseFactory
     * @return {Promise} A promise which is resolved when sleep is done.
     */
    static sleep(ms, promiseFactory) {
        return promiseFactory.makePromise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    };

    /**
     * Convert a Date object to a ISO-8601 date string
     *
     * @param {Date} [date] Date which will be converted
     * @return {String} String formatted as ISO-8601 (yyyy-MM-dd'T'HH:mm:ss'Z')
     */
    static getIso8601Data(date = new Date()) {
        return dateformat(date, DATE_FORMAT_ISO8601);
    };

    /**
     * Convert a Date object to a RFC-1123 date string
     *
     * @param {Date} [date] Date which will be converted
     * @return {String} String formatted as RFC-1123 (E, dd MMM yyyy HH:mm:ss 'GMT')
     */
    static getRfc1123Date(date = new Date()) {
        return dateformat(date, DATE_FORMAT_RFC1123);
    };

    /**
     * Convert object(s) to a string
     *
     * @param {*} args
     * @return {String}
     */
    static stringify(...args) {
        return args.map(function (arg) {
            if (typeof arg === 'object') {
                return GeneralUtils.toJson(arg);
            }

            return arg;
        }).join(" ");
    };

    /**
     * @return {int}
     */
    static currentTimeMillis() {
        return (new Date).getTime();
    }

    /**
     * @param value
     * @return {boolean}
     */
    static isString(value) {
        return typeof value === 'string' || value instanceof String;
    }

    /**
     * @param value
     * @return {boolean}
     */
    static isNumber(value) {
        return typeof value === 'number' || value instanceof Number;
    }

    /**
     * @param value
     * @return {boolean}
     */
    static isBoolean(value) {
        return typeof value === 'boolean' || value instanceof Boolean;
    }

    /**
     * @param value
     * @return {boolean}
     */
    static isBuffer(value) {
        return value != null && !!value.constructor && typeof value.constructor.isBuffer === 'function' && value.constructor.isBuffer(value);
    }

    static isBase64(str) {
        if (!GeneralUtils.isString(str)) {
            return false;
        }

        const len = str.length;
        if (!len || len % 4 !== 0 || BASE64_CHARS_PATTERN.test(str)) {
            return false;
        }

        const firstPaddingChar = str.indexOf('=');
        return firstPaddingChar === -1 || firstPaddingChar === len - 1 || (firstPaddingChar === len - 2 && str[len - 1] === '=');
    }

    /**
     * @typedef {Object} CallSite
     * @property {function} getTypeName returns the type of this as a string.
     * @property {function} getFunctionName returns the name of the current function, typically its name property.
     * @property {function} getMethodName returns the name of the property of this or one of its prototypes that holds the current function
     * @property {function} getFileName if this function was defined in a script returns the name of the script
     * @property {function} getLineNumber if this function was defined in a script returns the current line number
     * @property {function} getColumnNumber if this function was defined in a script returns the current column number
     * @property {function} isNative is this call in native V8 code?
     *
     * @return {Array.<CallSite>}
     */
    static getStackTrace() {
        return stackTrace.get();
    }
}

/**
 * @private
 * @param {Object} to
 * @param {Object} from
 * @param {string} fnName
 */
function _mixin(to, from, fnName) {
    to[fnName] = function () {
        return from[fnName].apply(from, arguments);
    };
}

module.exports = GeneralUtils;
