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
* This library is a little piece that I created based on the current patterns of information 
* management, but based 100% on promises
* @method middleware(callback)    - defines a middleware
* @method dispatch(action)  - dispatch action
* @method unsubscribe(callback)   - unsubscribe to store
* @method subscribe(callback)     - subscribe to store
* @method child(PromyStore)     - subscribe to store
* @return {PromyStore}        instancia del prototipo
**/   
function PromyStore(state = {},config={autorun:false}){

    if(!(this instanceof PromyStore))return new PromyStore(state,config);

    this.state         = state
    this.childs        = {} // child
    this.actions       = {} // actions
    this.subscribers   = [] // subscribe
    this.middlewares   = [] // middleware 
    this.config        = config;
}
PromyStore.prototype = {
    /**
     * 
     * @param  {*} value - transform if not promise to promise
     */
    $toPromise(value){
        return value instanceof Promise ? value: Promise.resolve(value);
    },
    /**
     * Defines a cycle of middlewares
     * @param {*}      state   - estado de la instancia
     * @param {Array}  list    - lista de middleware
     * @param {Object} action  - accion
     */
    $cycle(state,middlewares,action){
        return state.then((state)=>{
            var cursor = middlewares.shift();
            if(cursor) return cursor(
                state,
                action,
                (state,action)=>{
                    this.$dispatchSubscribers('next',state,action);
                    return this.$cycle(this.$toPromise(state),middlewares.slice(),action);
                }
            )
            return state;
        })
    },
    /**
     * 
     * @param {*} action    - change command for store
     * @param {Object} option - communication option with subscriber 
     */
    $dispatch(action,option){
        return new Promise(
            (resolve,reject)=>{
                // A cycle middleware is added to dispatch the store children
                this.$cycle(
                    this.$toPromise(this.state),
                    this.middlewares.concat([
                        (state,action,next)=>{
                            var callback  = this.actions[action.type] || this.actions.default;
                            return next(
                                callback ? callback(state,action) : state,
                                action
                            );
                        },
                        (state,action)=>this.$dispatchChilds(state,action,option)
                    ]),
                    action
                ).then((state)=>{
                    this.state = state;
                    /**
                     * Dispatches store subscribers
                     * Inherits the option parameter for the subscribed 
                     * context subscriber to prevent propagation loop
                     */
                    resolve(state);
                    this.$dispatchSubscribers('done',state,action,option);
                }).catch((error)=>{
                    reject(error);
                    this.$dispatchSubscribers('error',error,action);
                })
            }
        )
    },
    /**
     * Dispatch subscribers to the store
     * @param {*} state 
     * @param {*} action 
     * @param {*} option 
     */
    $dispatchSubscribers(type,state,action,option={}){
        this.subscribers.map((subscribe)=>{
            try{
                subscribe[type] && subscribe[type](state,action,option);
            }catch(e){
                /**
                debug error 
                **/
            }
        })
    },
    /**
     * Dispatches subscribed children to the store
     * @param {*} state 
     * @param {*} action 
     * @param {*} option 
     */
    $dispatchChilds(state,action,option){
        var childs = this.childs,
            index  = Object.keys(childs);
        return  Promise.all(
            index.map((child)=>{
                return childs[child].dispatch(action,{skipStore : childs[child]})
                                    .then((childState)=>{
                                        state[child] = childState;
                                    })
            })
        ).then(()=>state)
    },
    /**
     * 
     * @param {*} callback 
     */
    $autorun(callback){
        this.config.autorun && callback(this.state,{type:'autorun'});
        return callback;
    },
    /**
     * Allows to generate a substate based on a new instance of PromyStore 
     * He will listen to all the dispatcher of the father and dispatch the subcripts 
     * Both the father and his children
     */
    get child(){
       return (property,store)=>{
            this.state[property]  = store.state;
            this.childs[property] = store;
            store.subscribe((state,action,option={})=>{
                this.state[property]  = state;
                if(option.skipStore != store)this.$dispatchSubscribers(this.state,action);
            })
            return this;
       }
    },
    /**
     * Returns a function that allows you to create actions
     */
    get action(){
        /**
         * @param  {Object|String|Function} actions - Defines actions or action, If it is a function it will default to default action
         * @param  {Function} callback - Is executed when launching an action type and it has direct registration
         * @return {PromyStore}
         */
        return (actions,callback)=>{
            switch(type(actions)){
                case 'object':
                    for(var index in actions)this.action(index,actions[index]);
                break;
                case 'string':
                    this.actions[actions] = callback;
                break;
                case 'function':
                    this.actions.default  = actions;
                break;
            }
            return this;
        }    
    },
    /**
     * Lets you register middlewares
     */
    get middleware(){
        /**
         * @param {Function} callback - This middleware receives 3 parameters state, action and next
         */
        return (callback)=>{
            this.middlewares = this.middlewares.concat(callback);
            return this;
        }    
    },
    /**
     * Send a specific action
     */
    get dispatch(){
        /**
         * @param  {Object} action  - The action must always have a type
         * @param  {Object} [option]- Option will be sent to the subscriber
         * @return {Promise}
         */
        return (action,option)=>{
            if(action instanceof Function){
                return this.dispatch(action(this.state));
            }else if(action instanceof Promise){
                return action.then((action)=>this.dispatch(action));
            }else{
                try{
                    action.type;
                    return this.$dispatch(action,option);
                }catch(e){
                    console.error('Error in emit Action\nAction type is undefined\n',e);
                }
            }
        }
    },
    /**
     * Allows you to know the state of the store
     */
    get getState(){
        return ()=>this.state;    
    },
    /**
     * Delete store record
     */
    get unsubscribe(){
        return (done,error,next)=>{
            this.subscribers = this.subscribers.filter(subscribe=>!(
                done  && subscribe.done  == done  ? true : 
                error && subscribe.error == error ? true :
                next  && subscribe.next  == next  ? true : false
            ))
            return this;
        }
    },
    /**
     * Allows to register before the changes of the store
     */
    get subscribe(){
        /**
         * @param {Function} done  - Is issued at the end of the store cycle correctly
         * @param {Function} error - Is issued at the end of the store cycle by an error
         * @param {Function} next  - Is emitted when passing from one cycle to another
         */
        return (done,error,next)=>{
            this.$autorun(done);
            this.subscribers.push({done,error,next});
            return this;
        }    
    }
}
    
typeof module !== 'undefined' && module.exports ? 
                 (module.exports  = PromyStore) : 
                 (root.PromyStore = PromyStore)
    
})(this)