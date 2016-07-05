redux-action-object
=============

Define your Redux actions and reducers using object literal or ES6 class syntax. Also, a handy method for working with side effects.

## Show me the code

```javascript
import * as actionObject from 'redux-action-object';

// Model
class TodoModel {
  todos = [{                    // Class properties are used as the initial state
    ...
  }];

  add(text) {                   // That's reducer
    return {
      todos: [
        ...
      ]
    }
  }
}

// Bootstrap code
const { actionCreators, reducer } = actionObject.split(new TodoModel());
const store = createStore(reducer);
const actions:TodoModel = actionObject.bind(actionCreators, store.dispatch);

// UI
@connect(state => ({ todos: state.todos }))
class TodosComponent extends React.Component {
  handleSave(text) {
    actions.add(text);          // Actions are already bound to the store
  }
}
```

## Why?

When using conventional Redux code related to actions become spread across different places:
* Switch in reducers
* Action type constants
* Action creators

So when you add a new action or modify existing one you need to make changes in at least 3 different places.

**Redux-action-object** helps this by enabling you to simoultaneously define actions and reducers in the same code constructs,
using ES6 classes.

## Usage

You start with creating a class for you model. Class may contain properties and methods. Class properties are used
to define initial state. Methods are used to define reducers and actions:


```javascript
class TodoModel {
  todos = [{
    text: 'Use Redux',
    completed: false,
    id: 0
  }];

  add(text) {
    return {
      todos: [
        ...this.todos,
        {
          id: this.todos.reduce((maxId, todo) => Math.max(todo.id, maxId), -1) + 1,
          completed: false,
          text: text
        }
      ]
    }
  }
}
```

Instance of this model class is split into Redux action creators and reducer:

```javascript
import * as actionObject from 'redux-action-object';

const { actionCreators, reducer } = actionObject.split(new TodoModel());
```

*actionCreators* is an object with property keys equals to method names in the model. Property values are Redux action
creators. Action type will be equals to method name. For the code above, actionCreators will be:

```
actionCreators = {
    add: function(...arguments) {
        return {
            type: 'add',
            params: [].slice.call(arguments)
      }}
    }
}
```

Then you create a store and bind action creators to it

```
const store = createStore(reducer);
const actions:TodoModel = actionObject.bind(actionCreators, store.dispatch);
```

Now, you are ready to use it in your components:

```
@connect(state => ({ todos: state.todos }))
class TodosComponent extends React.Component {
  handleSave(text) {
    actions.add(text);          // Actions are already bound to the store
  }
}
```

## Working with Side Effects

In order to completely define actions within classes, **redux-action-object** provides a way to define side effects within reducer code.

```javascript
import * as actionObject from 'redux-action-object';

add(text) { // reducer function
  actionObject.sideEffect(function() {
      localStorage.todos = JSON.stringify(this.todos);
  });

  return {
    todos: [
      ...
    ]
  }
}
```

Side effect function will be called after executing reducer. Whiling side effect, *this* will be pointing to actual
store state. It means that side effect can use reducer results, like in the above example.

To enable side effects you need to use *actionObject.withSideEffects* while creating Redux store:

```javascript
import * as actionObject from 'redux-action-object';

const store = compose(
    actionObject.withSideEffects,
    // your other enhancers
)(createStore)(reducer);
```

Side effects can also be used without the classes:
```javascript
function todoApp(state = initialState, action) {
  switch (action.type) {
    case ADD_TODO:
      actionObject.sideEffect(function() {
          localStorage.todos = JSON.stringify(this.todos);
      });

      return {
        todos: [
          ...
        ]
      }
    default:
      return state
  }
}
```

## More examples

#### Using object literals instead of classes ####

```javascript
let model = {
    a: false,
    someAction: () => ({ a: !this.a })
};
```

#### Nesting properties and functions with literals ####

```javascript
let model = {
  a: 1,
  b: { c: 5 },
  topLevel: val => ({ a: val, b: { c: 6 } }),
  nested: {
    inner: val => ({ a: val, b: { c: 6 } })
  }
);
```

Actions can be reference as expected:

```javascript
import * as actionObject from 'redux-action-object';

const { actionCreators, reducer } = actionObject.split(model);
const store = createStore(reducer);
const actions = actionObject.bind(actionCreators, store.dispatch);

actions.nested.inner(3);
```

## Full example

Full example is located in *todo-demo.js* file. To start it, run

```
npm start
```

and the open

```
http://localhost:3000/
```

## Contribution

Feel free to create an issue or send a PR