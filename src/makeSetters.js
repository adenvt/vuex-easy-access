import { getKeysFromPath, setDeepValue, getDeepRef } from './objectDeepValueUtils'
import { isObject, isString } from 'is-what'
import defaultConf from './defaultConfig'
import error from './errors'

/**
 * Creates a setter function in the store to set any state value
 * Usage:
 * `set('module/path/path.to.prop', newValue)`
 * it will check first for existence of: `dispatch('module/path/path.to.prop')`
 * if non existant it will execute: `commit('module/path/path.to.prop', newValue)`
 * Import method:
 * `store.set = (path, payload) => { return defaultSetter(path, payload, store, conf) }`
 *
 * @param   {string}   path     the path of the prop to set eg. 'info/user/favColours.primary'
 * @param   {*}        payload  the payload to set the prop to
 * @param   {object}   store    the store to attach
 * @param   {object}   conf     user config
 *
 * @returns {function}          dispatch or commit
 */
function defaultSetter (path, payload, store, conf = {}) {
  conf = Object.assign({}, defaultConf, conf) // 'info/user/favColours.primary'
  const pArr = path.split('/')                // ['info', 'user', 'favColours.primary']
  const props = pArr.pop()                    // 'favColours.primary'
  const modulePath = (pArr.length)
    ? pArr.join('/') + '/'                    // 'info/user/'
    : ''
  const actionName = (conf.pattern === 'traditional')
    ? 'set' + props[0].toUpperCase() + props.substring(1) // 'setFavColours.primary'
    : props                                               // 'favColours.primary'
  // Check if an action exists, if it does, trigger that and return early!
  const actionPath = modulePath + actionName
  const actionExists = store._actions[actionPath]
  if (actionExists) {
    return store.dispatch(actionPath, payload)
  }
  // [vuex-easy-firestore] check if it's a firestore module
  const _module = store._modulesNamespaceMap[modulePath]
  const firestoreConf = (!_module) ? null : _module.state._conf
  if (conf.vuexEasyFirestore && firestoreConf) {
    // 'info/user/set', {favColours: {primary: payload}}'
    let newPayload = {}
    // if (!props) trigger easy-firestore 'set' with the payload
    if (!props) newPayload = payload
    // if (props) re-nest the props as part of the payload:
    // eg. ('/sub.prop', payload) becomes →  {sub: {prop: payload}}
    if (props) {
      props.split('.')
        .reduce((carry, _prop, index, array) => {
          const container = (index === array.length - 1)
            ? payload
            : {}
          if (_prop === '*' && payload.id) _prop = payload.id
          carry[_prop] = container
          return container
        }, newPayload)
    }
    const firestoreActionPath = modulePath + 'set'
    const firestoreActionExists = store._actions[firestoreActionPath]
    if (firestoreActionExists) {
      return store.dispatch(firestoreActionPath, newPayload)
    }
  }
  // Trigger the mutation!
  const mutationName = (conf.pattern === 'traditional')
    ? 'SET_' + props.toUpperCase() // 'SET_FAVCOLOURS.PRIMARY'
    : props                        // 'favColours.primary'
  const mutationPath = modulePath + mutationName
  const mutationExists = store._mutations[mutationPath]
  if (mutationExists) {
    return store.commit(mutationPath, payload)
  }
  error('missingSetterMutation', conf, mutationPath, mutationName, props)
}

/**
 * Creates a delete function in the store to delete any prop from a value
 * Usage:
 * `delete('module/path/path.to.prop', id)` will delete prop[id]
 * `delete('module/path/path.to.prop.*', {id})` will delete prop[id]
 * it will check first for existence of: `dispatch('module/path/-path.to.prop')` or `dispatch('module/path/-path.to.prop.*')`
 * if non existant it will execute: `commit('module/path/-path.to.prop')` or `commit('module/path/-path.to.prop.*')`
 * Import method:
 * `store.delete = (path, payload) => { return defaultDeletor(path, payload, store, conf) }`
 *
 * @param   {string}   path     the path of the prop to delete eg. 'info/user/favColours.primary'
 * @param   {*}        payload  either nothing or an id or {id}
 * @param   {object}   store    the store to attach
 * @param   {object}   conf     user config
 *
 * @returns {function}          dispatch or commit
 */
function defaultDeletor (path, payload, store, conf = {}) {
  conf = Object.assign({}, defaultConf, conf) // 'info/user/favColours.primary'
  const pArr = path.split('/')                // ['info', 'user', 'favColours.primary']
  const props = pArr.pop()                    // 'favColours.primary'
  const modulePath = (pArr.length)
    ? pArr.join('/') + '/'                    // 'info/user/'
    : ''
  const actionName = (conf.pattern === 'traditional')
    ? 'delete' + props[0].toUpperCase() + props.substring(1) // 'deleteFavColours.primary'
    : '-' + props                                            // '-favColours.primary'
  // Check if an action exists, if it does, trigger that and return early!
  const actionPath = modulePath + actionName
  const actionExists = store._actions[actionPath]
  if (actionExists) {
    return store.dispatch(actionPath, payload)
  }
  // [vuex-easy-firestore] check if it's a firestore module
  const _module = store._modulesNamespaceMap[modulePath]
  const firestoreConf = (!_module) ? null : _module.state._conf
  if (conf.vuexEasyFirestore && firestoreConf) {
    let target
    // DOC: 'info/user/favColours', 'primary'
    // COLLECTION: 'items', '123'
    if (isString(payload)) {
      target = payload
    }
    // DOC: 'info/user/favColours.*', {id: 'primary'}
    // COLLECTION: 'items/*', {id: '123'}
    if (isObject(payload) && payload.id) {
      target = payload.id
    }
    if (target) return store.dispatch(modulePath + 'delete', target)
  }
  // Trigger the mutation!
  const mutationName = (conf.pattern === 'traditional')
    ? 'DELETE_' + props.toUpperCase() // 'DELETE_FAVCOLOURS.PRIMARY'
    : '-' + props                     // '-favColours.primary'
  const mutationPath = modulePath + mutationName
  const mutationExists = store._mutations[mutationPath]
  if (mutationExists) {
    return store.commit(mutationPath, payload)
  }
  error('missingDeleteMutation', conf, mutationPath, mutationName, props)
}

/**
 * Creates a special 'setter-module' to be registered as a child of a module. This 'setter-module' will have the 'set' namespace (by default) and have one setter action per state prop in the parent module. The setter action's name will be the state prop name.
 *
 * @param {object} targetState   parent module's state object
 * @param {string} [moduleNS=''] parent module's namespace, must end in '/'
 * @param {object} store         vuex store
 * @param {object} conf          user config
 * @returns a special 'setter-module' to be registered as child of target module.
 */
function createSetterModule (targetState, moduleNS = '', store, conf = {}) {
  conf = Object.assign({}, defaultConf, conf)
  function getSetters (_targetState, _propPath = '') {
    return Object.keys(_targetState).reduce((carry, stateProp) => {
      // Get the path info up until this point
      const propPath = (_propPath)
        ? _propPath + '.' + stateProp
        : stateProp
      const fullPath = moduleNS + propPath
      // Avoid making setters for private props
      if (conf.ignorePrivateProps && stateProp[0] === '_') return carry
      if (conf.ignoreProps.includes(fullPath)) return carry
      // Avoid making setters for props which are an entire module on its own
      if (store._modulesNamespaceMap[fullPath + '/']) return carry
      // All good, make the action!
      carry[propPath] = (context, payload) => {
        return defaultSetter(fullPath, payload, store, conf)
      }
      // Get the value of the prop
      let propValue = _targetState[stateProp]
      // let's do it's children as well!
      if (isObject(propValue) && Object.keys(propValue).length) {
        const childrenSetters = getSetters(propValue, propPath)
        Object.assign(carry, childrenSetters)
      }
      // let's create a wildcard setter
      if (isObject(propValue) && !Object.keys(propValue).length) {
        carry[propPath + '.*'] = (context, payload) => {
          return defaultSetter(fullPath + '.*', payload, store, conf)
        }
      }
      return carry
    }, {})
  }
  const setters = getSetters(targetState)
  return {actions: setters, namespaced: true}
}

/**
 * Creates a special 'delete-module' to be registered as a child of a module. This 'delete-module' will have the 'delete' namespace (by default) and have one delete action per state prop in the parent module which holds an empty object. The delete action's name will be the state prop name + `.*`.
 *
 * @param {object} targetState   parent module's state object
 * @param {string} [moduleNS=''] parent module's namespace, must end in '/'
 * @param {object} store         vuex store
 * @param {object} conf          user config
 * @returns a special 'delete-module' to be registered as child of target module.
 */
function createDeleteModule (targetState, moduleNS = '', store, conf = {}) {
  conf = Object.assign({}, defaultConf, conf)
  function getDeletors (_targetState, _propPath = '') {
    return Object.keys(_targetState).reduce((carry, stateProp) => {
      // Get the path info up until this point
      const propPath = (_propPath)
        ? _propPath + '.' + stateProp
        : stateProp
      const fullPath = moduleNS + propPath
      // Avoid making deletor for private props
      if (conf.ignorePrivateProps && stateProp[0] === '_') return carry
      if (conf.ignoreProps.includes(fullPath)) return carry
      // Avoid making deletor for props which are an entire module on its own
      if (store._modulesNamespaceMap[fullPath + '/']) return carry
      // Get the value of the prop
      let propValue = _targetState[stateProp]
      // let's create the deletors
      if (isObject(propValue) && !Object.keys(propValue).length) {
        carry[propPath] = (context, payload) => {
          return defaultDeletor(fullPath, payload, store, conf)
        }
        carry[propPath + '.*'] = (context, payload) => {
          return defaultDeletor(fullPath + '.*', payload, store, conf)
        }
      }
      // let's do it's children as well!
      if (isObject(propValue) && Object.keys(propValue).length) {
        const childrenDeletors = getDeletors(propValue, propPath)
        Object.assign(carry, childrenDeletors)
      }
      return carry
    }, {})
  }
  const deletors = getDeletors(targetState)
  return {actions: deletors, namespaced: true}
}

function generateSetterModules (store, conf = {}) {
  const modules = store._modulesNamespaceMap
  conf = Object.assign({}, defaultConf, conf)
  Object.keys(modules).forEach(moduleNS => {
    const _module = modules[moduleNS]
    const moduleName = getKeysFromPath(moduleNS + conf.setter)
    const setterModule = createSetterModule(_module.state, moduleNS, store, conf)
    store.registerModule(moduleName, setterModule)
    const deleteModule = createDeleteModule(_module.state, moduleNS, store, conf)
    const deleteModuleName = getKeysFromPath(moduleNS + conf.deletor)
    store.registerModule(deleteModuleName, deleteModule)
  })
  const rootModuleName = conf.setter
  const rootSetterModule = createSetterModule(store.state, '', store, conf)
  store.registerModule(rootModuleName, rootSetterModule)
  const rootDeleteModuleName = conf.deletor
  const rootDeleteModule = createDeleteModule(store.state, '', store, conf)
  store.registerModule(rootDeleteModuleName, rootDeleteModule)
}

export { defaultSetter, defaultDeletor, generateSetterModules }
