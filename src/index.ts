/// <reference path="../typings/index.d.ts" />

import { World } from "./world";

// Create the world
let world = new World();

let startLoop = function(f) {
    requestAnimationFrame(function() { startLoop(f); });
    f();
};

startLoop(function() {
    world.update();
    world.render();
});
