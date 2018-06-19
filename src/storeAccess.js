/**
 * Vuex Easy Access plugin
 * Unified syntax with simple set() and get() store access + auto generate mutations!
 *
 * @author     Luca Ban
 * @contact    https://lucaban.com
 */

import { setDeepValue, getDeepValue, popDeepValue, pushDeepValue, spliceDeepValue } from './objectDeepValueUtils'
import { isObject, isArray } from 'is-what'

/**
 * Creates the mutations for each property of the object passed recursively
 *
 * @param   {object} propParent an Object of which all props will get a mutation
 * @param   {string} path       the path taken until the current propParent instance
 *
 * @returns {object}            all mutations for each property.
 */
function makeMutationsForAllProps(propParent, path) {
  if (!isObject(propParent)) return {}
  return Object.keys(propParent)
  .reduce((mutations, prop) => {
    let propPath = (!path)
      ? prop
      : path + '.' + prop
    let name = 'SET_' + propPath.toUpperCase()
    mutations[name] = (state, newVal) => {
      return setDeepValue(state, propPath, newVal)
    }
    let propValue = propParent[prop]
    // If the prop is an object, make the children setters as well
    if (isObject(propValue)) {
      let childrenMutations = makeMutationsForAllProps(propValue, propPath)
      mutations = {...mutations, ...childrenMutations}
    }
    // If the prop is an array, make array mutations as well
    if (isArray(propValue)) {
      let pop = 'POP_' + propPath.toUpperCase()
      mutations[pop] = (state) => {
        return popDeepValue(state, propPath)
      }
      let push = 'PUSH_' + propPath.toUpperCase()
      mutations[push] = (state, value) => {
        return pushDeepValue(state, propPath, value)
      }
      let splice = 'SPLICE_' + propPath.toUpperCase()
      mutations[splice] = (state, value, index, deleteCount) => {
        return spliceDeepValue(state, propPath, value, index, deleteCount)
      }
    }
    return mutations
  }, {})
}

/**
 * Creates all mutations for the state of a module.
 * Usage:
 * commit('module/path/SET_PATH.TO.PROP', newValue)
 * Import method:
 * mutations {
 *   ...defaultMutations (initialState)
 * }
 *
 * @param   {object} initialState   the initial state of a module
 *
 * @returns {object}                all mutations for the state
 */
function defaultMutations (initialState) {
  return makeMutationsForAllProps(initialState)
}

/**
 * Creates a setter function in the store to set any state value
 * Usage:
 * `set('module/path/path.to.prop', newValue)`
 * it will check first for existence of: `dispatch('module/path/setPath.to.prop')`
 * if non existant it will execute: `commit('module/path/SET_PATH.TO.PROP', newValue)`
 * Import method:
 * `store.set = (path, payload) => { return defaultSetter(path, payload, store) }`
 *
 * @param   {string}   path     the path of the prop to set eg. 'info/user/favColours.primary'
 * @param   {*}        payload  the payload to set the prop to
 * @param   {object}   store    the store to attach
 *
 * @returns {function}          dispatch or commit
 */
function defaultSetter (path, payload, store) {
  // path = 'info/user/favColours.primary'
  const pArr = path.split('/')
  // ['info', 'user', 'favColours.primary']
  const props = pArr.pop()
  // 'favColours.primary'
  const modulePath = (pArr.length)
    ? pArr.join('/') + '/'
    : ''
  // 'info/user'
  const actionName = 'set' + props[0].toUpperCase() + props.substring(1)
  // 'setFavColours.primary'
  const actionPath = modulePath + actionName
  // 'info/user/setFavColours.primary'
  const action = store._actions[actionPath]
  if (action) {
    return store.dispatch(actionPath, payload)
  }
  const mutationPath = modulePath + 'SET_' + props.toUpperCase()
  return store.commit(mutationPath, payload)
}

/**
 * Creates a getter function in the store to set any state value
 * Usage:
 * `get('module/path/path.to.prop')`
 * it will check first for existence of: `getters['module/path/path.to.prop']`
 * if non existant it will return: `state.module.path.path.to.prop`
 * Import method:
 * `store.get = (path) => { return defaultGetter(path, store) }`
 *
 * @param   {string}   path     the path of the prop to get eg. 'info/user/favColours.primary'
 * @param   {object}   store    the store to attach
 *
 * @returns {function}          getter or state
 */
function defaultGetter (path, store) {
  const getterExists = store.getters.hasOwnProperty(path)
  if (getterExists) return store.getters[path]
  return getDeepValue(store.state, path)
}

export default { defaultMutations, defaultSetter, defaultGetter }