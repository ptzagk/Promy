## PromyStore

[Escrito por Matias Trujillo  Olivares](http://www.upp.cl)	


Allows you to manage asynchronous states within an application by leveraging the potential of **promises** and **Redux** ideas on **Flux**. This tool perfectly complements [PromyCycle](../PromyCycle)	

#### First steps

First I want to remember that you create PromyStore by understanding that all events generated within an application are mostly **ASYNCHRONIZED** (Server calls, client events, animations and time intervals). For this, PromyStore offers a simple interface, composed of 4 interaction methods to manage this asynchrony.

* **action**      : Allows you to define store actions
* **middleware**  : Define middleware that runs when launching an action
* **dispatch**    : Allows to issue shares to the store
* **subscribe**   : Subscribe to store changes
* **unsubscribe** : Allows you to unsubscribe from store changes
* **child** : It allows you to generate a child that issues the father changes of his own state.

#### Implementing PromyStore Example 1

This example demonstrates a simple storage based on a counter.

```javascript
var store = new PromyStore(0);

store.middleware((store,action,next)=>{
  console.log(action)
  return next(store,action);
})

store.action({
  ADD(state,{value}){
    return state + value;
  },
  RES(state,{value}){
    return state - value;
  }
})

store.subscribe((state)=>{
  document.querySelector('#view-total').textContent = state;
})

```
#### Explaining Example 1

#### Middleware

This method pertaining to the store allows to define a middleware for the same store, this one receives a function, that to the sold by the store will give 3 parameters

* @param {Object} - It's store status
* @param {Object} - The action issued by the dispatcher
* @param {Function} - Function that allows to continue the process, this returns a promise

#### Action

They allow to manage a state change based on a specific type of action, if by default the action is not defined, the action will be issued ** default **

#### Child

It allows to generate properties belonging to the store, but these are in turn sub instances of **PromyStore**, similar to how it operates **combinerReduce** in redux, but this is **asynchronous**

#### Subscribe

It allows to subscribe to the states of the store, this receives a function that when executed will receive 2 parameters store state and actin modifying the state.