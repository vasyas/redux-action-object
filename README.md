redux-action-object
=============

Defining your Redux reducers and actions using ES6 class syntax.

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
const { reducer, actionCreators } = actionObject.split(new TodoModel());
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
* Switch in reducer
* Action type constants
* Action creators

So when you add a new action or modify existing one you need to make changes in at least 3 different places.

**Redux-action-object** helps this by enabling you to define actions and reducers in the same code snippets, using ES6 classes.