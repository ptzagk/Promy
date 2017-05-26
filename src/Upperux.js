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
function Upperux(state = {},actions){
    this.state   = state;
    this.ons     = []
    this.mdd     = [];
    this.actions = {};
    this.action(actions);
}
Upperux.prototype = {
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
    $dispatch(action){
        return new Promise(
            (resolve,reject)=>{
                var from  = action.type,
                mdd = this.mdd.concat(
                    (state,action)=>this.actions[action.type] ? this.actions[action.type](state,action) : (
                        this.actions.default ? this.actions.default(state,action) : state
                    )
                ),
                cycle = this.$cycle(
                    this.$toPromise(this.state),
                    mdd,action
                );
                cycle.then((state)=>{
                    this.state = state;
                    this.ons.map((fn)=>{
                        try{
                            fn(state,from);
                        }catch(e){
                                
                        }
                    })
                    resolve(state);
                })
                cycle.catch(reject)
            }
        )
    },
    get action(){
        return (actions,fn)=>{
            if(typeof actions == 'object'){
                Object.keys(actions).map((action)=>this.action(action,actions[action]))
            }else{
                this.actions[actions] = fn;
            }    
            return this;
        }    
    },
    get middleware(){
        return (fn)=>{
            this.mdd = this.mdd.concat(fn);
            return this;
        }    
    },
    get dispatch(){
        return (action)=>{
            if(action instanceof Function){
                return this.emit(action(this.state));
            }else if(action instanceof Promise){
                return action.then((action)=>this.emit(action));
            }else{
                try{
                    action.type;
                    return this.$dispatch(action);
                }catch(e){
                    console.error('Error in emit Action\nAction type is undefined\n',e);
                }
            }
        }
    },
    get get(){
        return (str)=>{
            if(str && (!/[\(\)\`\s\t\n]+/.test(str))){
                str = str.replace(/^(\w)/,(str)=>'.'+str);
                return (new Function(`try{return this${str}}catch(e){return}`)).call(this.state);
            }
            return this.state;
        }    
    },
    get unsubscribe(){
        return (fn)=>{
            var pos = this.ons.indexOf(fn);
            pos > -1 && this.onts.splice(pos,1);
            return this;
        }    
    },
    get subscribe(){
        return (fn)=>{
            fn && this.ons.push(fn);
            return this;
        }    
    }
}
    
typeof module !== 'undefined' && module.exports ? 
                 (module.exports  = Upperux) : 
                 (root.Upperux    = Upperux)
    
})(this)