## Upperux

[Escrito por Matias Trujillo  Olivares](http://www.upp.cl)	

Sumamente ligero

| formato       | tamaño    |
| ------------- | --------- |
| Uncompress    | 3.74kb    |

Permite gestionar estados asíncronos dentro de una aplicación aprovechando el estándar de las promesas

#### Primeros pasos

Primero quiero recordar que cree Upperux entendiendo que todo evento generado dentro de una aplicación en su mayoría son **ASINCRONO** (Llamadas al servidor, eventos del cliente, animaciones e intervalos de tiempo). para ello Upperux ofrece una interfaz simple, compuesta por 4 métodos de interacción para gestionar esta asincronia.

* **action**      : permite definir las acciones del store
* **middleware**  : permite definir middleware que se ejecutan al lanzar una acción
* **dispatch**    : permite emitir acciones al store
* **subscribe**   : permite subscrivirce ante los cambios del store
* **unsubscribe** : permite eliminar la subcripcion a los cambios del store

#### Implementando Upperux

Este ejemplo manifiesta un manejo de store simple basado en un contador.

```javascript
var store = new Upperux(0);

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

#### Middleware

El potencial de Upperux, es el manejo de middleware, mediante promesas, estos pueden cambiar el estado del store y el action. A su vez pueden escuchar el retorno del ciclo.

Lo ideal es que este estado y el action sean **inmutables** ante el ciclo de ejecución.

#### Action

Permiten gestionar un cambio de estado en base a un tipo específico de acción, si por defecto el action no se encuentra definido se emitirá el action **default**

