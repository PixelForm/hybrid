# Event delegation
Another Javascript event delegaton library.
Though there are alot of event delegation libraries out there whic seem to be alot simpler,
this library attempts to solve the problem of having random events flying around and making
teamwork alot easier.

## How it works
With this library you create something called actions. Actions are just like
a namespace for your handlers. You can register multiple handlers on the same action.

An action works as follows:
1. You register your action.
2. Your team members register their actions too.
3. You choose which events to delegate and bind the global handler.
4. You add your events to your markup.

## Getting started
There are two ways you can get started with this library:

### Install using NPM
```
npm i @pixelform/events
```
### install locally
Download the script from `dist/events.min.js` and include it in your project.
You can reference the library from the global scope.

## Usage

```javascript
// In Node.js with es6 imports
import { delegate, bind, register } from '@pixelform/events';

// Or in Node.js with commonjs require
const { delegate, bind, register } = require('@pixelform/events')

// Or in the browser from global window object
const { delegate, bind, register } = window.hyper

// Specify which events we care about
delegate(['click'])

// Bind the global listener to an element. Defaults to document
bind()

function handler(event) {
    console.log(event)
}

register('eventname', handler)
```