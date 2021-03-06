import { getDeepValue } from './pathUtils'
import { IInitialisedStore } from './declarations'

/**
 * Creates a getter function in the store to set any state value.
 * Usage:
 * `get('module/path/path.to.prop')`
 * it will check first for existence of: `getters['module/path/path.to.prop']`
 * if non existant it will return: `state.module.path.path.to.prop`
 * Import method:
 * `store.get = (path) => { return defaultGetter(path, store) }`
 *
 * @param {string} path the path of the prop to get eg. 'info/user/favColours.primary'
 * @param {IInitialisedStore} store the store to attach
 * @returns {*} getter or state
 */
function defaultGetter (path: string, store: IInitialisedStore): any {
  const getterExists = store.getters.hasOwnProperty(path)
  if (getterExists) return store.getters[path]
  return getDeepValue(store.state, path)
}

export { defaultGetter }
