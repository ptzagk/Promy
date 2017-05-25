'use strict';
(function (root) {
    function Upperux() {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var actions = arguments[1];

        this.state = state;
        this.ons = [];
        this.mdd = [];
        this.actions = {};
        this.action(actions);
    }
    Upperux.prototype = {
        action: function action(actions, fn) {
            var _this = this;
            if(typeof actions == 'object'){
                Object.keys(actions).map(function (action) {
                    return _this.action(action, actions[action]);
                });
            } else {
                this.actions[actions] = fn;
            }
            return this;
        },
        middleware: function middleware(fn) {
            this.mdd = this.mdd.concat(fn);
        },
        toPromise: function toPromise(value) {
            return value instanceof Promise ? value : Promise.resolve(value);
        },
        cycle: function cycle(state, list, action) {
            var _this2 = this;

            return state.then(function (state) {
                var cursor = list.shift();
                if (cursor) {
                    return cursor(state, action, function (state, action) {
                        return _this2.cycle(_this2.toPromise(state), list.slice(), action);
                    });
                }
            });
        },
        emit: function emit(action) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                var from = action.type,
                    mdd = _this3.mdd.concat(function (state, action) {
                    return _this3.actions[action.type] ? _this3.actions[action.type](state, action) : _this3.actions.default ? _this3.actions.default(state, action) : state;
                }),
                    cycle = _this3.cycle(_this3.toPromise(_this3.state), mdd, action);
                cycle.then(function (state) {
                    _this3.state = state;
                    _this3.ons = _this3.ons.filter(function (fn) {
                        try {
                            return !fn(state, from);
                        } catch (e) {}
                    });
                    resolve(state);
                });
                cycle.catch(reject);
            });
        },
        get: function get(str) {
            if (str && !/[\(\)\`\s\t\n]+/.test(str)) {
                str = str.replace(/^(\w)/, function (str) {
                    return '.' + str;
                });
                return new Function('\n                try{\n                    return this' + str + '\n                }catch(e){\n                    return;\n                }\n            ').call(this.state);
            }
            return this.state;
        },
        off: function off(fn) {
            var pos = this.ons.indexOf(fn);
            pos > -1 && this.onts.splice(pos, 1);
            return this;
        },
        on: function on(fn) {
            fn && this.ons.push(fn);
            return this;
        }
    };

    typeof module !== 'undefined' && module.exports ? (module.exports = Upperux) : (root.Upperux = Upperux);
})(this);