## Prereqs

Install [Node.js 4.5.0](https://nodejs.org/en/). This will also install `npm` as a global command.

## Setup

 1. Requires [Node.js](https://nodejs.org/dist/v6.10.1/node-v6.10.1.pkg)
 2. Fork the repo
 3. Clone the repo and install it's dependencies:
```
git clone https://github.com/<your-github-username>/programming-challenge
cd programming-challenge
npm install
```
 4. See [Usage](#usage) section below for how to build/test your code.
 5. Once you feel ready, you should create a Pull Request against [francoislaberge/programming-challenge](https://github.com/francoislaberge/programming-challenge)
 6. Send an email to your main Jibo hiring manager.
 7. They will then review your pull request and potentially ask for some changes

## Usage

### Basic Usage

 1. Make changes to the code
 2. Build the project and keep watching for code changes, by running:

        npm run watch

 3. Run the app

        npm run exe

 4. Change your code, make sure there are no errors in the terminal
 5. Reload your code Command/Control+R (or use the menu: View -> Reload)
 6. Debug code via View -> Toggle DevTools

### Commands

#### `npm run build`
Builds the code.

#### `npm run watch`
Builds the code then watches for changes and automatically rebuilds the project.

#### `npm start`
Same as `npm run watch`;

#### `npm run clean`
Deletes all files generated when building/watching your code.

## Executing

Run the command `electron main.js` to run the project.

## The Challenge

Consider a checkerboard of unknown size. On each square is an arrow that randomly points either up, down,
left, or right. A checker is placed on a random square. Each turn the checker moves one square in the direction
of the arrow. Visualize an algorithm that determines if the checker moves off the edge of the board or ends up in a cycle.

  - Include UI controls to play, stop, and reset the game.
  - Include UI controls to change the size of the board and to shuffle the arrows.
  - Include audio to make things more interesting.
  - Add some style to make it look good.
  - Write the algorithm in constant memory space. The brute force solution is O(n) memory space.

This challenge is meant to show off code organization, quality, and cleanliness, design patterns, and the ability to learn new languages
and ecosystems. Have fun with it.

## Some important notes

This project is bootstrapped to transpile TypeScript into JavaScript. TypeScript is very much like C# or ActionScript. It is a superset of JavaScript. This means that all JavaScript is valid TypeScript. Feel free to code this in vanilla ES6 JavaScript, but having type information is very helpful especially coming from a C++/Java/C# background.

To take advantage of TypeScript's strong types and an IDE's helpful autocomplete, install the Atom Editor and install the `atom-typescript` package.

Globally install `typings`. To do this, run the command `npm install typings -g`. `typings` allows you to install type information
about external npm modules. For example, if you were to use the
external module `async`, you would `npm install async`, and the run `typings search async`. It will display the name and the source.
To install the typings (which will be put in the `typings` folder of this project) run `typings install dt~async --global`. Then the TypeScript compiler will know how to compile against the async module.

The entry point to the application is `index.html`, which in turn points immediately to `index.js`. The typescript files in `src`
are all transpiled and browserified into a single JavaScript file at the root of the project, which is `index.js`. Do not modify this file as it is auto generated. Also do not modify `main.js`, which is just a bootstrap to get electron running.

Use whatever libraries you want from the npm public repository. You can find them [here](https://www.npmjs.com/) and install them with `npm install cool-lib-i-found --save`.

Included is a minimal setup for [Pixi.js](https://github.com/pixijs/pixi.js), a 2D scene graph library that's GPU accelerated. If you've ever programmed ActionScript, it should look *very* familiar. The documentation can be found [here](https://pixijs.github.io/docs/index.html). Please use Pixi.js for all visualizations, UI, and interactions.

To debug the application goto `View -> Toggle DevTools`. This will bring up the DevTools debugger. This is the standard DevTools that comes with Chrome.


## Solution Usage Guide

First, build and run the application as described above. Within the application:

- use the "Start"/"Stop" buttons to pause and unpause the animation and movement
logic
- use the "Reset" button to reset both the arrow directions and the checker
position
- use the "Shuffle Arrows" button to rotate the arrows without moving the
checker
- use the "Switch to Constant Memory"/"Switch to Hash Map" button to control
which algorithm should be used for edge/cycle detection
- use the "Change Board Size" to change the board size to the new size specified
in the text input fields to the left of the button
- click the arrows in order to rotate them clockwise; however, only arrows that
have stopped rotating may be clicked.

Note: rotating any arrows and clicking any of the buttons (except for the
"Start" and "Stop" buttons) will reset the algorithm state, making it behave as
if the checker was just dropped onto the board. This is necessary because all
these actions change the board state, thereby invalidating any state relevant to
the algorithm.

### Limitations
Most of the limitations are centered around the fact that no accessibility hints
are used, and keyboard interactivity (e.g. switching focus via tab, pressing
enter to apply the value, etc) are not supported. Additionally, for the text
input fields, it is only possible to control the cursor via the left/right arrow
keys and not via the mouse; nor is it possible to select text.
