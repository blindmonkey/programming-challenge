/// <reference path="../typings/index.d.ts" />

import { World } from "./world";

// Create the world
let world = new World();

function startLoop(f) {
    requestAnimationFrame(() => startLoop(f));
    f();
};

startLoop(() => {
    world.update();
    world.render();
});
