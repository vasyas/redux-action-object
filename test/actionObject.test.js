import * as actionObject from '../src/actionObject';
import { compose, createStore } from 'redux';
import { expect } from 'chai';
import { describe, it } from 'mocha';

function createSampleStore(object, ...enhancers) {
  const { reducer, actionCreators } = actionObject.split(object);

  const store = compose(
      ...enhancers
  )(createStore)(reducer);

  const boundActions = actionObject.bind(actionCreators, store.dispatch);

  return {
    actions: boundActions,
    store
  }
}

describe('ActionObject test', function() {
  it('deep methods', function() {
    const { store, actions } = createSampleStore({
      a: 1,
      topLevel: val => ({a: val}), // current state is passed as this
      nested: {
        inner: val => ({a: val})
      }
    });

    expect(store.getState().a).to.eql(1);

    actions.topLevel(2);
    expect(store.getState().a).to.eql(2);

    actions.nested.inner(3);
    expect(store.getState().a).to.eql(3);
  });

  it('Passes this', function() {
    const { store, actions } = createSampleStore({
      a: false,
      someAction: () => ({a: !this.a})
    });

    expect(store.getState().a).to.eql(false);

    actions.someAction();
    expect(store.getState().a).to.eql(true);
  });

  it('passes action impl', function() {
    const { store, actions } = createSampleStore({
      a: false,
      someAction: () => ({a: !this.a}),
      someOtherAction: function() { return this.someAction(); }
    });

    expect(store.getState().a).to.eql(false);

    actions.someOtherAction();
    expect(store.getState().a).to.eql(true);
  });

  it('handle arrays in state', function() {
    const { store } = createSampleStore({
      a: [1, 2, 3]
    });

    expect(store.getState().a).to.eql([1, 2, 3]);
  });

  it('Retain state', function() {
    const { store, actions } = createSampleStore({
      a: 1,
      noChange1: function() { },
      noChange2: () => ({ })
    });

    const state = store.getState();

    actions.noChange1();
    expect(store.getState()).to.equal(state);

    actions.noChange2();
    expect(store.getState()).to.equal(state);
  });

  it('walk prototypes', function() {
    class Base {
      base() {
      }
    }

    const { actions } = createSampleStore(new class extends Base {
      derived() {
      }
    });

    expect(actions.derived).to.not.be.undefined;
    expect(actions.base).to.not.be.undefined;
  });

  it('dispatch side effects', function() {
    const { store, actions } = createSampleStore(new class {
      a = 1;

      action() {
        actionObject.sideEffect(function() {
          expect(this.a).to.equal(5);
        });

        return {a: 5};
      }
    }, actionObject.withSideEffects);

    actions.action();

    expect(store.getState().a).to.equal(5);
  });
});