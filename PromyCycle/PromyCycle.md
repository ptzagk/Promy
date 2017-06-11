## PromyCycle

It is a library for asynchronous management, it will be useful for the control of calls to the server, worker or others It has by default a series of frequently used utilities at the moment of managing processing asynchronous

#### Example

```javascript
/**
* Instance to PromyCycle
*/
var cycle = PromyCycle(); 

cycle
/**
* Limit the number of cycle of execution
*/
.line(1)
/**
* Controls continuity based on an analysis of the argument
*/
.when((argument)=>argument)
/**
* Defines a maximum waiting time for the cycle
*/
.timeout(300)
/**
* Wait x time before moving to the next checkpoint
*/
.delay(300)
/**
* Allows you to control the cycle
*/
.middleware(({next,resolve},argument)=>{
  Promise
    .all([
    next(argument),
    next(argument),
    next(argument),
  ])
    .then(resolve)
})
/**
* Control cycle feedback
*/
.next(()=>{
  return {for:'next'}
})
/**
* Read the cycle return but is not expected by the
*/
.bind((argument)=>{
  console.log(argument)
})
/**
* Subscribe to cyclo if this ends
*/ 
.subscribe(()=>{
  console.log('done');
})
/**
* Triggers the execution of the cycle
* This returns a promise that is resolved 
* at the end of the cycle
*/ 
.dispatch({
  name : 'matias'
})
.then(()=>{
  console.log('end');
})
```

#### Explanation

##### .line(<number>)

Allows to control the amount of asynchronous processes in execution, these in turn is released only in case the cycle has finished

##### .when(<function|boolean>)

Allows to control the continuity of the cyclo returning if it continues or not through a boolean, if this is true will receive the same argument that has received **when**, if false the cyclo is solved with the argument resivido also by **when**

##### .timeout(<time>[,<*>])

Allows to end the cycle based on a time control, this to executece resolves the cycle and returns the last argument resisted by **timeout** or the second parameter resivido when creating the **timeout**	

##### .middleware(<function>)

Allows to manage a total control over the asynchronous cycle, through the use of properties and methods of the first argument

- **.next(<*>)** : Allows to execute the continuity of the cyclo, this in turn returns a promise

- **.resolve(<*>)** : Solve the middleware

- **.reject(<*>)**:Issues an error

- **.follow(<*>)**:  Triggers next solve and reject in chain

- **.argument** : Reads the argument delivered to the middleware, This is also delivered to the middleware as second parameter

- **.status** : Allows you to know the state of the middleware (Pending, Resolved, Rejected)

  ​

##### .next(<function>)

Is executed as a return control point, has the functionality of then within a promise

##### .bind(<function>)

Run as a listener for the cycle, but does not interfere with the

##### .subscribe(<done function>[,<error function>[,<next function>]])

Subscribe to the cycle process in the following cases

- **done** : Is executed at the end of the cycle
- **error**: Executes when it emits an error on the part of the cycle
- **next** : Is executed when passing from process to process within cyclo

You can use **unsubscribe** to remove the listener

##### .dispatch(<*>)

Triggers the execution of the cycle, this in turn returns a promise to know if it has ended or to throw an error