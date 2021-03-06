(function(root){
"use strict";
/**
 * Determines the type of a variable
 * @param {*} value 
 */
function type(value){
    return typeof value;
}
/**
 * @method $set(name,callback)     - Allows to generate new middleware for the cyclo
 * @method dispatch(action)        - dispatch action
 * @method unsubscribe(callback)   - unsubscribe to store
 * @method subscribe(callback)     - subscribe to store
 */
function PromyCycle(method){
    if(!(this instanceof PromyCycle))return new PromyCycle(method);
    this.middlewares = [];
    this.subscribers = [];
    this.$set(PromyCycle.methods);
    method && this.$set(PromyCycle.methods);
}
PromyCycle.prototype = {
    /**
     * Check if value is a promise if it does not make it a
     * @param  {*} value 
     * @return {Promise} 
     */
    $toPromise(value){
        return value instanceof Promise ? value: Promise.resolve(value);
    },
    /**
     * 
     * @param {Promise} promise     - Generates a cycle through a promise
     * @param {Array}   middlewares - Array of functions that runs when invoking the promise
     * @param {Object}  cycle       - Object generated by dispatch
     */
    $cycle(promise,middlewares,cycle){
        return promise.then((argument)=>{
                var cursor = middlewares.shift()
                if(cursor && cycle.keepOn){
                    return new Promise(($resolve,$reject)=>{
                        /**
                         * Creates a state that can only be mutated within the promise
                         */
                        var status  = 'pending',
                        /**
                         * Allows to resolve the promise and to vary the state
                         * @param {*}
                         */
                        resolve = (argument)=>{
                            if(status == 'pending'){
                                status = 'resolved';
                                $resolve(argument);
                            }
                        },
                        /**
                         * Allows the promise to be rejected and the status changed
                         * @param {*}
                         */
                        reject = (argument)=>{
                            if(status == 'pending'){
                                status = 'rejected';
                                $reject(argument);
                            }
                        },
                        /**
                         * Let's pass the next promise
                         * @param {*}
                         */
                        next  = (argument)=>this.$cycle(
                                this.$toPromise(argument),
                                middlewares.slice(),
                                cycle
                        ),
                        /**
                         * Run next, solve and reject
                         * @param {*}
                         */
                        follow = (argument)=>next(argument).then(resolve).catch(reject),
                        /**
                         * Give access to the middleware function created by means of the promise
                         */
                        response = cursor({
                                next,
                                cycle,
                                follow,
                                reject,
                                resolve,
                                argument,
                                get status(){return status},
                        })
                        /**
                         * If the cursor has an answer the promise will be solved instantly
                         */
                        response !== undefined &&  resolve(response);
                    })
                }
                this.$dispatchSubscribers('next',argument)
                return argument;
                
        })
    },
    /**
     * Dispatches the subscriber based on a type
     * @param {String} type - done, error or next
     * @param {*}  argument 
     */
    $dispatchSubscribers(type,argument){
        this.subscribers.map(subscribe=>{
            try{
                subscribe[type] && subscribe[type](argument);
            }catch(e){
                /**
                debug error 
                **/
            }
        })
    },
    get dispatch(){
        /**
         * Allows to construct an instance of the cycle, 
         * creating the promise for the one based on the 
         * argument and in turn created the cyclo object
         * @param {*}
         */
        return (argument)=>{
            var cycle = {get status(){return status},get time(){return Date.now() - time},keepOn : true},time = Date.now(),status='pending';
            cycle.promise = new Promise((resolve,reject)=>{
                cycle.resolve = (argument)=>{
                    if(status == 'pending'){
                        status = 'resolved';
                        resolve(argument)
                        this.$dispatchSubscribers('done',argument);
                    }
                }
                cycle.reject  = (argument)=>{
                    if(status == 'pending'){
                        status = 'rejected';
                        reject(argument)
                        this.$dispatchSubscribers('error',argument);
                    }
                }
            })
            this.$cycle(this.$toPromise(argument),this.middlewares.slice(),cycle)
                .then(cycle.resolve).catch(cycle.reject)
            return cycle.promise;
        }
    },
    $set(name,callback){
        if(name){
            if(type(name) != 'string'){
                for(var index in name)this.$set(index,name[index]);
                return this;
            }
            this[name] = (argument,option)=>{
                var context  = {};
                this.middlewares.push((control)=>callback.call(context,control,argument,option))
                return this;
            }
        }
        return this;
    },
    get subscribe(){
        return (done,error,next)=>{
            this.subscribers.push({done,error,next})
            return this;
        }
    },
    get unsubscribe(){
        return (done,error,next)=>{
            this.subscribers = this.subscribers.filter(subscribe=>!(
                done  && subscribe.done  == done  ? true : 
                error && subscribe.error == error ? true :
                next  && subscribe.next  == next  ? true : false
            ))
            return this;
        }
    }
}
PromyCycle.methods = {
    delay({follow,argument},time){
        setTimeout(()=>follow(argument),time)
    },
    timeout({follow,resolve,argument,cycle},time,option){
        follow(argument)
        setTimeout(()=>{
            cycle.keepOn = false;
            cycle.resolve(option||argument);
        },time)
    },
    next({argument,follow},callback){
        follow(callback(argument))
    },
    line({follow,argument,cycle},line){
        this.line = this.line == undefined?line:this.line;
        if(this.line>0){
            var escape;
            var free  = ()=>{
                if(!escape){
                    this.line++;
                    escape = true;
                }
            }
            follow(argument).then(free)
            cycle.promise.then(free)
            this.line--
        }
    },
    bind({follow,argument},callback){
        callback(argument);
        follow(argument);
    },
    all({follow,argument},list){
        Promise.all(list.map((item)=>item instanceof Function ? item(argument) : item)).then(argument=>follow(argument))
    },
    middleware(control,callback){
        return callback.call(this,control,control.argument);
    },
    when({follow,argument},option){
        (option instanceof Function ? option(argument) : option) && follow(argument);
    }
}

typeof module !== 'undefined' && module.exports ? 
                 (module.exports  = PromyCycle) : 
                 (root.PromyCycle = PromyCycle)
    
})(this)