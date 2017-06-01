(function(root){
"use strict";
/**
* This library is a little piece that I created based on the current patterns of information 
* management, but based 100% on promises
* @method middleware(fn) - defines a middleware
* @method emit(action)   - dispatch action
* @method off(fn)        - unsubscribe to store
* @method on(fn)         - subscribe to store
* @method get(str)       - get state 
**/   
function Promy(state = {},actions){
    this.state         = state
    this.childs        = {} // child
    this.actions       = {} // actions
    this.subscribers   = [] // subscribe
    this.middlewares   = [] // middleware
    this.action(actions)
}
Promy.prototype = {
    $toPromise(value){
        return value instanceof Promise ? value: Promise.resolve(value);
    },
    $cycle(state,list,action){
        return state.then((state)=>{
            var cursor = list.shift();
            if(cursor){
                return cursor(state,action,(state,action)=>this.$cycle(this.$toPromise(state),list.slice(),action))
            }   
        })
    },
    $dispatch(action,opts){
        return new Promise(
            (resolve,reject)=>{
                var mdd = this.middlewares.concat([
                    (state,action,next)=>{
                        var fn  = this.actions[action.type] || this.actions.default;
                        return next(
                            fn ? fn(state,action) : state,
                            action
                        );
                    },
                    (state,action)=>this.$dispatchChilds(state,action,opts)
                ]),
                cycle = this.$cycle(
                    this.$toPromise(this.state),
                    mdd,action
                );
                cycle.then((state)=>{
                    this.state = state;
                    this.$dispatchSubscribers(state,action,opts);
                    resolve(state);
                })
                cycle.catch(reject)
            }
        )
    },
    $dispatchSubscribers(state,action,opts={}){
        this.subscribers.map((fn)=>{
            try{
                fn(state,action,opts);
            }catch(e){
                /**
                debug error 
                **/
            }
        })
    },
    $dispatchChilds(state,action,opts){
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
    get child(){
       return (prop,store)=>{
            this.state[prop]  = store.state;
            this.childs[prop] = store;
            store.subscribe((state,action,opts)=>{
                this.state[prop]  = state;
                if(opts.skipStore != store)this.$dispatchSubscribers(this.state,action);
            })
            return this;
       }
    },
    get action(){
        return (actions,fn)=>{
            switch(typeof actions){
                case 'object':
                    Object.keys(actions).map((action)=>this.action(action,actions[action]))
                break;
                case 'string':
                    this.actions[actions] = fn;
                break;
                case 'function':
                    this.actions.default  = actions;
                break;
            }
            return this;
        }    
    },
    get middleware(){
        return (fn)=>{
            this.middlewares = this.middlewares.concat(fn);
            return this;
        }    
    },
    get dispatch(){
        return (action,opts)=>{
            if(action instanceof Function){
                return this.dispatch(action(this.state));
            }else if(action instanceof Promise){
                return action.then((action)=>this.dispatch(action));
            }else{
                try{
                    action.type;
                    return this.$dispatch(action,opts);
                }catch(e){
                    console.error('Error in emit Action\nAction type is undefined\n',e);
                }
            }
        }
    },
    get get(){
        return ()=>this.state;    
    },
    get unsubscribe(){
        return (fn)=>{
            var pos = this.subscribers.indexOf(fn);
            pos > -1 && this.onts.splice(pos,1);
            return this;
        }    
    },
    get subscribe(){
        return (fn)=>{
            fn && this.subscribers.push(fn);
            return this;
        }    
    }
}
    
typeof module !== 'undefined' && module.exports ? 
                 (module.exports  = Promy) : 
                 (root.Promy      = Promy)
    
})(this)