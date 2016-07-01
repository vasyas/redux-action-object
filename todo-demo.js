import React from 'react';
import { render } from 'react-dom';
import { createStore, compose } from 'redux';
import { Provider, connect } from 'react-redux';

import * as actionObject from './src/actionObject';


// utils

function classnames() {
  let classes = [];

  for (let i = 0; i < arguments.length; i++) {
    let arg = arguments[i];
    if (!arg) continue;

    let argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(arg);
    } else if (Array.isArray(arg)) {
      classes.push(classNames.apply(null, arg));
    } else if (argType === 'object') {
      for (let key in arg) {
        if (arg.hasOwnProperty(key) && arg[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}


// model

class TodoModel {
  todos = [{
    text: 'Use Redux',
    completed: false,
    id: 0
  }];

  add(text) {
    actionObject.sideEffect(function() {
      console.log('Saving TODOs side effect');

      localStorage.todos = JSON.stringify(this.todos);
    });

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

  loadTodos() {
    actionObject.sideEffect(function() { // no need to pass dispatch, b/c this contains bound action creators
      console.log('Loading TODOs side effect');

      actions.setTodos(localStorage.todos ? JSON.parse(localStorage.todos) : []);
    });
  }

  setTodos(todos) {
    return { todos };
  }

  deleteTodo(id) {
    return {
      todos: this.todos.filter(todo => todo.id != id)
    }
  }

  edit(id, text) {
    return {
      todos: this.todos.map(todo =>
          todo.id === id ?
              Object.assign({}, todo, {text}) :
              todo
      )
    }
  }

  complete(id) {
    return {
      todos: this.todos.map(todo =>
          todo.id === id ?
              Object.assign({}, todo, {completed: !todo.completed}) :
              todo
      )
    }
  }
}

// UI

@connect(state => ({ todos: state.todos }))
class App extends React.Component {
  render() {
    const { todos } = this.props;
    return (
        <div>
          <Header />
          <MainSection todos={todos} />
        </div>
    )
  }
}

class Header extends React.Component {
  handleSave(text) {
    if (text.length !== 0) {
      actions.add(text);
    }
  }

  render() {
    return (
        <header className="header">
          <h1>todos</h1>
          <TodoTextInput newTodo
                         onSave={this.handleSave.bind(this)}
                         placeholder="What needs to be done?" />
        </header>
    )
  }
}

class TodoTextInput extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      text: this.props.text || ''
    }
  }

  handleSubmit(e) {
    const text = e.target.value.trim();
    if (e.which === 13) {
      this.props.onSave(text);
      if (this.props.newTodo) {
        this.setState({ text: '' });
      }
    }
  }

  handleChange(e) {
    this.setState({ text: e.target.value });
  }

  handleBlur(e) {
    if (!this.props.newTodo) {
      this.props.onSave(e.target.value);
    }
  }

  render() {
    return (
        <input className={
        classnames({
          edit: this.props.editing,
          'new-todo': this.props.newTodo
        })}
               type="text"
               placeholder={this.props.placeholder}
               autoFocus="true"
               value={this.state.text}
               onBlur={this.handleBlur.bind(this)}
               onChange={this.handleChange.bind(this)}
               onKeyDown={this.handleSubmit.bind(this)} />
    )
  }
}

class MainSection extends React.Component {
  renderFooter(completedCount) {
    const { todos } = this.props;
    const activeCount = todos.length - completedCount;

    if (todos.length) {
      return (
          <Footer completedCount={completedCount}
                  activeCount={activeCount}
          />
      )
    }
  }

  render() {
    const { todos } = this.props;

    const filteredTodos = todos;
    const completedCount = todos.reduce((count, todo) =>
            todo.completed ? count + 1 : count,
        0
    );

    return (
        <section className="main">
          <ul className="todo-list">
            {filteredTodos.map(todo =>
                <TodoItem key={todo.id} todo={todo} {...actions} />
            )}
          </ul>
          {this.renderFooter(completedCount)}
        </section>
    )
  }
}

class TodoItem extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      editing: false
    }
  }

  handleDoubleClick() {
    this.setState({ editing: true })
  }

  handleSave(id, text) {
    if (text.length === 0)
      actions.deleteTodo(id);
    else
      actions.edit(id, text);

    this.setState({ editing: false });
  }

  render() {
    const { todo } = this.props;

    let element;

    if (this.state.editing) {
      element = (
          <TodoTextInput text={todo.text}
                         editing={this.state.editing}
                         onSave={(text) => this.handleSave(todo.id, text)} />
      )
    } else {
      element = (
          <div className="view">
            <input className="toggle"
                   type="checkbox"
                   checked={todo.completed}
                   onChange={() => actions.complete(todo.id)} />
            <label onDoubleClick={this.handleDoubleClick.bind(this)}>
              {todo.text}
            </label>
            <button className="destroy"
                    onClick={() => actions.deleteTodo(todo.id)} />
          </div>
      )
    }

    return (
        <li className={classnames({
        completed: todo.completed,
        editing: this.state.editing
      })}>
          {element}
        </li>
    )
  }
}

class Footer extends React.Component {
  renderTodoCount() {
    const { activeCount } = this.props
    const itemWord = activeCount === 1 ? 'item' : 'items'

    return (
        <span className="todo-count">
        <strong>{activeCount || 'No'}</strong> {itemWord} left
      </span>
    )
  }

  render() {
    return (
        <footer className="footer">
          {this.renderTodoCount()}
        </footer>
    )
  }
}

// bootstrap
const { reducer, actionCreators } = actionObject.split(new TodoModel());

const store = compose(
    actionObject.withSideEffects
)(createStore)(reducer);

const actions:TodoModel = actionObject.bind(actionCreators, store.dispatch);

actions.loadTodos();

let stylesLink = document.head.appendChild(document.createElement('link'));
stylesLink.rel = 'stylesheet';
stylesLink.href = 'https://rawgit.com/tastejs/todomvc-app-css/master/index.css';

let container = document.body.appendChild(document.createElement('div'));

render(
    <Provider store={store}>
      <App />
    </Provider>,
    container
);