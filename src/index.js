import { bindActionCreators } from 'redux';

function resolve(obj, path) {
    let i, len;

    for (i = 0, path = path.split('.'), len = path.length; i < len; i++) {
        if (!obj || typeof obj !== 'object') return undefined;

        obj = obj[path[i]];
    }

    return obj;
}

function splitObject(object, prefix = '', creators = {}, initialState = {}, methods = {}) {
    Object.getOwnPropertyNames(object).forEach(key => {
        if (typeof object[key] == 'function') {
            if (object[key].creator) {
                creators[key] = object[key];
            } else {
                creators[key] = function() {
                    return {
                        type: prefix + key,
                        params: [].slice.call(arguments)
                    }
                };
            }

            methods[key] = object[key];
        } else if (typeof object[key] == 'object' && object[key] != null && !(object[key] instanceof Array) && !(object[key].toList)) { // test for immutable js
            ({ creators: creators[key], initialState: initialState[key], methods: methods[key] } =
                splitObject(object[key], prefix + key + '.'));
        } else
            initialState[key] = object[key];
    });

    const prototype = Object.getPrototypeOf(object);

    if (prototype && prototype != Object.prototype)
        splitObject(prototype, prefix, creators, initialState, methods);

    return {
        creators, initialState, methods
    };
}

export function bind(actionCreators, dispatch) {
    const r = {};

    Object.keys(actionCreators).forEach(key => {
        if (typeof actionCreators[key] == 'function')
            r[key] = bindActionCreators(actionCreators[key], dispatch);
        else if (typeof actionCreators[key] == 'object')
            r[key] = bind(actionCreators[key], dispatch);
    });

    return r;
}

export function split(object) {
    const { initialState, creators, methods } = splitObject(object);

    function reducer(state = initialState, actionCall) {
        const { type, params } = actionCall;

        let actionImpl = resolve(object, type);

        if (actionImpl === undefined) actionImpl = () => {};

        const stateWithImpl = Object.assign({}, methods, state);
        const stateUpdate = actionImpl.apply(stateWithImpl, params);

        if (!stateUpdate || Object.keys(stateUpdate).length == 0) return state;

        return Object.assign({}, state, stateUpdate);
    }

    return {
        actionCreators: creators,
        reducer
    };
}

/**
 * Mark action as creator, so it won't be transformed by buildActionCreators
 */
export function creator(target, name = undefined, descriptor = undefined) {
    const action = descriptor ? descriptor.value : target;

    action.creator = true;
    return action;
}

// Side effects
const sideEffects = [];

export function sideEffect(f) {
    sideEffects.push(f);
}

export function withSideEffects(next) {
    return (reducer, initialState) => {
        let store = next(reducer, initialState);

        store.subscribe(() => {
            const o = Object.assign({}, store.getState());

            const effects = sideEffects.splice(0);
            effects.forEach(f => f.apply(o, [store.dispatch]));
        });

        return store;
    };
}