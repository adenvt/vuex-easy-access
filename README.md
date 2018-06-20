# Vuex Easy Access

The Vuex Easy Access plugin does two things:
1. Add a global getter/setter for each state property
2. Automatically generate mutations for each state property

### Table of contents

<!-- TOC -->

- [Motivation](#motivation)
- [Feedback](#feedback)
- [Installation](#installation)
- [1. Add a global getter/setter for each state property](#1-add-a-global-gettersetter-for-each-state-property)
    - [What you can do](#what-you-can-do)
    - [Why this is awesome](#why-this-is-awesome)
    - [Usage](#usage)
- [2. Automatically generate mutations for each state property](#2-automatically-generate-mutations-for-each-state-property)
    - [What's all this then?](#whats-all-this-then)
    - [Usage](#usage-1)
    - [Bonus: Array mutations!](#bonus-array-mutations)
- [Build from source](#build-from-source)

<!-- /TOC -->

## Motivation

There are several vuex plugins available making boilerplating etc easier for you. I felt most of them are overkill and wanted something small and simple.

## Feedback

Do you have questions, comments, suggestions or feedback? Feel free to open an issue! ♥

## Installation

```
npm i --save vuex-easy-access
```

## 1. Add a global getter/setter for each state property

### What you can do

You can access and set anything in your store through `get()` and `set()` methods:
- `get(path)` will automatically look for a getter, if none it will return the state
- `set(path, val)` will automatically look for an action, if none it will make a mutation

The `path` syntax is: `module/submodule/stateVal.subProp`.<br>
`/` for modules and `.` for sub properties when the state value is an object.

### Why this is awesome

In the example below we'll see why the `get()` and `set()` methods are helpful.

You have an app where users have themes and can set colors per theme.<br>
The module path is: user/theme<br>
The state: `colors: {primary: 'blue', secondary: 'white'}`

Simple usage allows:
- Set primary color: `this.$store.set('user/theme/colors.primary', '#265EF6')`
- Get primary color: `this.$store.get('user/theme/colors.primary')`

First of all, we see a nice streamlined syntax to get and set values. (unlike vuex's default syntax mess)

#### Scenario 1
Say that in the future we want to make sure when we get the primary color it will translate to a readable color name. For this let's set up a getter:
```js
// in the user/theme module
getters: {
  'colors.primary': (state) => {
    return hexToReadableColor(state.colors.primary)
  }
}
```
Now automatically in your whole app where you used `get('user/theme/colors.primary')` it will start using this getter instead!

The `get()` method of Vuex Easy Access first checks if a getter with the syntax like above exists. If it does it will return the getter, if not it will just return the state property: `state.user.theme.colors.primary`.

#### Scenario 2
Now we want to make an api call to the server every time the user updates this value. We would want to set up an action in our same module:
```js
// in the user/theme module
actions: {
  'setColors.primary': ({state, commit, dispatch}, newColor) => {
    dispatch('patchToServer', state.colors.primary, {root: true})
    return commit('SET_COLORS.PRIMARY', newColor)
  }
}
```
Now inside your entire app, whenever `set('user/theme/colors.primary')` is called, the action above will be triggered and the color is synced to the server.

The `set()` method of Vuex Easy Access checks to see if an action with the syntax `setProp` exist. If it exists it will dispatch this action, if not it will just make a default mutation: `commit('user/theme/SET_COLORS.PRIMARY', newColor)`

### Usage
```js
import { defaultSetter, defaultGetter } from 'vuex-easy-access'

const store = new Vuex.Store(initialStore)

store.set = (path, payload) => { return defaultSetter(path, payload, store) }
store.get = (path) => { return defaultGetter(path, store) }
```

## 2. Automatically generate mutations for each state property

### What's all this then?

Since a vuex store is really easy to debug based on the commit history, it's best practice to have one single mutation for each property in the store.

But do you know the pain of setting up one single mutation for each single state property in your store? If you do, be rejoiced! (If you don't then you might be secretly mutating the store directly? That is not safe to try at home really...)

Vuex Easy Access creates one mutation for every single property in your store! All AUTOMATICALLY!

#### What really happens?

In line with the examples above:<br>
The module path is: user/theme<br>
The state: `colors: {primary: 'blue', secondary: 'white'}`

Vuex Easy Access will then automatically generate these mutations:
```js
store.commit('user/theme/SET_COLORS', newValue)
store.commit('user/theme/SET_COLORS.PRIMARY', newValue)
store.commit('user/theme/SET_COLORS.SECONDARY', newValue)
```
And Vuex Easy Access does all this in just 2 lines. Say goodbye to boilerplating. Don't let it be a roadblock in order to do best practices!

### Usage
```js
import { defaultMutations } from 'vuex-easy-access'
// in the module's mutations:
mutations: {
  ...defaultMutations (initialState)
  // pass your initialState
}
```

### Bonus: Array mutations!

Yes, yes, I know. The fun just doesn't end. We also have them array mutations set for you!<br>
state: `pokemon: []`
Will become:
```js
// you caught a new pokemon:
store.commit('PUSH_POKEMON', newPokemon)
// you don't need that last pokemon anymore:
store.commit('POP_POKEMON')
// you change your first pokemon for a new one
store.commit('SPLICE_POKEMON', 0, 1, newPokemon)
```
All these mutations are set up for you, automatically. You only need to write your state.

## Build from source

```bash
npm run build
```

Happy Vuexing!<br>
-Luca Ban
