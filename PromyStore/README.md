## PromyState

[Escrito por Matias Trujillo  Olivares](http://www.upp.cl)	

Sumamente ligero

| formato    | tamaño |
| ---------- | ------ |
| Uncompress | 3.74kb |

Permite gestionar estados asíncronos dentro de una aplicación aprovechando el potencial de las **promesas** y las ideas de  **Redux** sobre **Flux**

#### Primeros pasos

Primero quiero recordar que cree PromyState entendiendo que todo evento generado dentro de una aplicación en su mayoría son **ASINCRONO** (Llamadas al servidor, eventos del cliente, animaciones e intervalos de tiempo). para ello PromyState ofrece una interfaz simple, compuesta por 4 métodos de interacción para gestionar esta asincronia.

* **action**      : permite definir las acciones del store
* **middleware**  : permite definir middleware que se ejecutan al lanzar una acción
* **dispatch**    : permite emitir acciones al store
* **subscribe**   : permite subscrivirce ante los cambios del store
* **unsubscribe** : permite eliminar la subcripcion a los cambios del store
* **child** : Permite generar un hijo que emite al padre cambios propies de su estado.

#### Implementando PromyState ejemplo 1

Este ejemplo manifiesta un manejo de store simple basado en un contador.

```javascript
var store = new PromyState(0);

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
#### Explicando el ejemplo 1

#### Constructor PromyState
Este permite instanciar un store, este posee un estado propio y a su vez se puede controlar el estado del médiate acciones.

* @param {Object}  - es el estado inicial del store


* @param {Object}  - Opcional, acciones iniciales del store 

#### Middleware

Este método perteneciente al store permite definirun middleware para el mismo store, este recibe una función, que al serejecutada por el store le entregara 3 parámetros 

* @param {Object} - es estado del store
* @param {Object} - el action  emitido por el dispatch
* @param {Function} - función que permite continuar el proceso

#### Action

Permiten gestionar un cambio de estado en base a un tipo específico de acción, si por defecto el action no se encuentra definido se emitirá el action **default**

#### Child

Permite generar propiedades pertenecientes al store, pero estas son a su vez sub instancias de **PromyState**, similar a como opera **combinerReduce** en redux, pero este es **asincrono**

#### Subscribe

Permite suscribirse a los estados del store, este recibe una función que al ser ejecutada recibirá 2 parámetros el estado del store y el actino que modifico el estado.