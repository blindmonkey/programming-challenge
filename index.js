(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jiboProgrammingChallenge = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
/**
 * A board controller that knows about `Board`s with arrows. Allows us to rotate
 * arrows within the board on update, as well as initiate the rotation of those
 * arrows.
 */
class ArrowBoardController {
    constructor(board) {
        this.board = board;
    }
    /**
     * Gets the difference of two angles represented in the form described in
     * {@see ArrowSquareType}.
     */
    getAngleDifference(angle1, angle2) {
        angle1 = angle1 % 4;
        if (angle1 < 0)
            angle1 += 4;
        angle2 = angle2 % 4;
        if (angle2 < 0)
            angle2 += 4;
        // The logic here is to support the following cases:
        // angle1 = 0.1, angle2 = 3.9
        // angle1 = 3.9, angle2 = 0.1
        return Math.min(Math.abs(angle1 - angle2), Math.abs(angle1 - (angle2 + 4)), Math.abs(angle1 - (angle2 - 4)));
    }
    /**
     * Updates the angle and velocity of all the spinning arrows on the board.
     * Returns true if any arrows are still spinning.
     */
    update() {
        let spinning = false;
        this.board.map((value, x, y) => {
            if (value != null && value.velocity !== 0) {
                // If it's a non-null square, and the arrow has spinning
                // velocity, update its angle based on its velocity.
                value.angle += value.velocity;
                // Correct the angle to be between [0, 4).
                if (value.angle < 0)
                    value.angle += 4;
                if (value.angle >= 4)
                    value.angle -= 4;
                // Dampen the velocity to achieve a slowdown effect.
                value.velocity *= 0.99;
                // Floats are hard, so we need some threshold at which we'll
                // decide that we should stop the arrow if it points in a valid
                // direction.
                let absVelocity = Math.abs(value.velocity);
                let almostStoppedVelocity = 0.02;
                let almostStopped = absVelocity < almostStoppedVelocity;
                // Represents the difference between the nearest discrete angle
                // position and the current angle position. If they are close
                // enough, and the arrow is spinning slowly enough, we stop the
                // arrow on the discrete direction.
                let angularDifference = this.getAngleDifference(value.angle, Math.round(value.angle));
                if (almostStopped && angularDifference < 0.01) {
                    // Stop the arrow from spinning and snap it to the nearest
                    // discrete angle.
                    value.velocity = 0;
                    value.angle = Math.round(value.angle) % 4;
                }
                else {
                    // If the arrow has practically stopped, and we aren't close
                    // to a discrete angle, give it a small kick in a random
                    // direction.
                    if (absVelocity < almostStoppedVelocity / 10) {
                        value.velocity += Math.random() * 0.2 - 0.1;
                    }
                    spinning = true;
                }
            }
            return value;
        });
        return spinning;
    }
    /**
     * Sets a random rotational velocity on all arrows.
     */
    initiateRotation() {
        this.board.map((value, x, y) => {
            if (value != null) {
                let velocityBase = (Math.random() - .5) / 2;
                let velocitySign = velocityBase >= 0 ? 1 : -1;
                value.velocity += velocityBase + velocitySign * 0.4;
            }
            return value;
        });
    }
}
exports.ArrowBoardController = ArrowBoardController;

},{}],2:[function(require,module,exports){
"use strict";
const board_renderer_1 = require('../board/board-renderer');
/**
 * Represents a renderer for an `ArrowBoard`. The only real benefit here is that
 * it allows us to isolate the arrow rendering function, and not couple it to
 * the board. Otherwise, we'd either have to code the `BoardRenderer` to support
 * arrows, or pass it renderSquare as a function.
 */
class ArrowBoardRenderer extends board_renderer_1.BoardRenderer {
    constructor(board) {
        super(board);
    }
    /**
     * This method contains the logic for rendering an arrow within a square.
     */
    renderSquare(square, size) {
        let container = new PIXI.Container();
        // A square must return a container and an update function (to modify
        // rendered squares). We could specify the default function here, but
        // since we should never have null squares, we would always be creating
        // a function and then throwing it away. Instead, the fallback is in the
        // return statement.
        let update = null;
        if (square != null) {
            // The full size of the arrow, end to end, with size/2 being the
            // middle.
            let arrowSize = size * 0.8;
            // The width of the shaft of the arrow.
            let arrowWidth = arrowSize * 0.35;
            // The width of the tip at the widest point.
            let arrowTipWidth = arrowSize * 0.95;
            // How far from the middle (arrowSize/2) the tip should start.
            let arrowStemLengthFromMid = 0;
            /**
             * The diagram below shows the order in which points are visited.
             * i.e. the first moveTo is 0, the first lineTo is 1, the second
             * lineTo is 2, and so on. All points are derived from the four
             * metrics above, which are in turn derived from the square size.
             *             2 +
             *               | \
             *   0           |  \
             *   +-----------+ 1 \
             *   |                \ 3
             *   |           5    /
             *   +-----------+   /
             *   6           |  /
             *               | /
             *             4 +
             */
            let graphics = new PIXI.Graphics();
            container.addChild(graphics);
            graphics.beginFill(0xFF0000);
            graphics.moveTo(-arrowSize / 2, -arrowWidth / 2);
            graphics.lineTo(arrowStemLengthFromMid, -arrowWidth / 2);
            graphics.lineTo(arrowStemLengthFromMid, -arrowTipWidth / 2);
            graphics.lineTo(arrowSize / 2, 0);
            graphics.lineTo(arrowStemLengthFromMid, arrowTipWidth / 2);
            graphics.lineTo(arrowStemLengthFromMid, arrowWidth / 2);
            graphics.lineTo(-arrowSize / 2, arrowWidth / 2);
            graphics.position.x = size / 2;
            graphics.position.y = size / 2;
            // The only control anyone has over the arrows from the model is
            // their rotation amount, so we allow updating that part.
            update = (square) => (graphics.rotation = Math.PI / 2 * square.angle);
            // Do the initial rotation assignment to match current square data.
            update(square);
        }
        return {
            container: container,
            update: update || (() => null)
        };
    }
}
exports.ArrowBoardRenderer = ArrowBoardRenderer;

},{"../board/board-renderer":3}],3:[function(require,module,exports){
"use strict";
const pixi_rect_1 = require('../renderable/shapes/pixi-rect');
const coord_utils_1 = require('../util/coord-utils');
/**
 * An abstract class that mostly knows how to render `Board`s. It's expected
 * that a subclass will override `renderSquare` to complete the implementation.
 */
class BoardRenderer {
    constructor(board) {
        this.board = board;
        this.renderedChildren = [];
        this.clickHandlers = [];
    }
    /** Registers a click event. */
    onClick(handler) {
        this.clickHandlers.push(handler);
    }
    /** Returns the size of a single square. */
    getSquareSize() { return this.squareSize; }
    /**
     * Updates the rendered graphic of a single square and returns the top-level
     * container.
     */
    update(x, y) {
        let squareSize = this.squareSize;
        let index = coord_utils_1.CoordUtils.coordToIndex(x, y, this.board.getWidth(), this.board.getHeight());
        let cached = this.renderedChildren[index];
        if (cached == null || cached.container == null) {
            // Nothing exists in the cache, so we have to render it now.
            let squareContainer = new PIXI.Container();
            // Render a black or white square.
            let squareRect = new pixi_rect_1.PIXIRect(squareSize, squareSize, {
                fillColor: x % 2 === y % 2 ? 0x000000 : 0xffffff,
                cornerRadius: 0 });
            squareContainer.addChild(squareRect);
            // Render the actual square graphic.
            let update = null;
            let renderedSquare = this.renderSquare(this.board.get(x, y), squareSize);
            if (renderedSquare != null) {
                // If something was rendered, map the update method and add the
                // container to our square's container.
                squareContainer.addChild(renderedSquare.container);
                update = renderedSquare.update;
            }
            else {
                // If nothing was rendered, we need to ensure that the update
                // method is not null.
                update = () => null;
            }
            // Register for click events.
            squareContainer.interactive = true;
            squareContainer.on('pointerdown', () => {
                for (let i = 0; i < this.clickHandlers.length; i++) {
                    this.clickHandlers[i](x, y);
                }
            });
            cached = {
                container: squareContainer,
                update: update
            };
        }
        else {
            // If rendered square already exists, update it.
            cached.update(this.board.get(x, y));
        }
        this.renderedChildren[index] = cached;
        return cached.container;
    }
    /** Updates all the squares on the board. */
    updateAll() {
        this.renderedChildren = this.renderedChildren || [];
        for (let y = 0; y < this.board.getHeight(); y++) {
            for (let x = 0; x < this.board.getWidth(); x++) {
                this.update(x, y);
            }
        }
    }
    /**
     * Clears all render cache, causing the next render call to return a fresh
     * new container.
     */
    clearRendered() {
        this.rendered = null;
        this.renderedChildren = [];
        this.squareSize = null;
    }
    /**
     * Renders the board into a view of the given size.
     */
    render(viewWidth, viewHeight) {
        if (this.rendered == null) {
            let board = this.board;
            let container = new PIXI.Container();
            this.rendered = container;
            let boardWidth = board.getWidth(), boardHeight = board.getHeight();
            let squareSize = Math.floor(Math.min(viewWidth / boardWidth, viewHeight / boardHeight));
            this.squareSize = squareSize;
            this.renderedChildren = [];
            for (let y = 0; y < boardHeight; y++) {
                for (let x = 0; x < boardWidth; x++) {
                    let squareContainer = this.update(x, y);
                    let screenX = x * squareSize, screenY = y * squareSize;
                    squareContainer.position.x = screenX;
                    squareContainer.position.y = screenY;
                    container.addChild(squareContainer);
                }
            }
        }
        return this.rendered;
    }
}
exports.BoardRenderer = BoardRenderer;
;

},{"../renderable/shapes/pixi-rect":9,"../util/coord-utils":16}],4:[function(require,module,exports){
"use strict";
const coord_utils_1 = require('../util/coord-utils');
/**
 * This class represents a board of `width`x`height` dimensions. The type of
 * things contained on the board is of the parameter `T`.
 */
class Board {
    constructor(width, height, initializer = null) {
        this.width = width;
        this.height = height;
        this.board = this.initializeBoardArray(width, height, initializer);
    }
    /**
     * Initializes an array that can internally be used for a board. Optionally
     * takes an initializer. If one is not specified, all squares are
     * initialized to null.
     */
    initializeBoardArray(width, height, initializer = null) {
        let boardArray = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                boardArray.push(initializer != null ? initializer(x, y) : null);
            }
        }
        return boardArray;
    }
    /** Returns the width of the board. */
    getWidth() { return this.width; }
    /** Returns the height of the board. */
    getHeight() { return this.height; }
    /**
     * Iterates over all coordinates, calls the given function, and updates the
     * board with the result.
     * TODO: Could be extended to optionally return a new board.
     */
    map(f) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let oldValue = this.get(x, y);
                let newValue = f(oldValue, x, y);
                this.put(newValue, x, y);
            }
        }
        return this;
    }
    /** Puts a value into the square at the given coordinate. */
    put(value, x, y) {
        let index = coord_utils_1.CoordUtils.coordToIndex(x, y, this.width, this.height);
        this.board[index] = value;
    }
    /** Gets the square at the given coordinate. */
    get(x, y) {
        let index = coord_utils_1.CoordUtils.coordToIndex(x, y, this.width, this.height, false);
        if (index == null)
            return null;
        return this.board[index];
    }
}
exports.Board = Board;

},{"../util/coord-utils":16}],5:[function(require,module,exports){
"use strict";
const audio_1 = require('../util/audio');
/**
 * A class that controls the movement of the `Checker`. Essentially, this is the
 * class that implement the logic of the cycle-detecting algorithm.
 */
class CheckerController {
    constructor(board, checker, constantMemory = false) {
        this.board = board;
        this.checker = checker;
        this.reset(constantMemory);
    }
    /**
     * Returns true if it has been identified that this checker is in a cycle.
     */
    hasDetectedCycle() { return this.detectedCycle; }
    /**
     * Returns true if the next move would move the checker off the edge of the
     * board.
     */
    hasDetectedEdge() { return this.detectedOffEdge; }
    /**
     * Resets the cycle/edge tracking, as well as the algorithm that should be
     * used
     */
    reset(constantMemory = false) {
        this.constantMemory = constantMemory;
        this.detectedCycle = false;
        this.detectedOffEdge = false;
        this.visited = {};
        this.hare = this.checker.getPosition();
    }
    /**
     * Given a position offset, sets up the checker so that it will animate to
     * the square in that direction.
     */
    move(dx, dy) {
        let position = this.checker.getPosition();
        let nx = position.x + dx, ny = position.y + dy;
        if (!this.constantMemory) {
            // The non-constant memory algorithm. Keeps a hashmap of visited
            // positions and checks whether the next position was visited.
            // The memory complexity is O(M), where M is the width * height of
            // the board.
            // There exists another algorithm, where one would keep a list of
            // all visited locations and compare against that. The memory
            // complexity of that algorithm would be O(N) where N would be the
            // number of moves made.
            let positionKey = nx + '/' + ny;
            if (this.visited[positionKey]) {
                this.detectedCycle = true;
            }
            this.visited[positionKey] = true;
        }
        else {
            // A "constant memory" algorithm. If we've made more moves than
            // there are squares on the board and have not encountered an edge,
            // then there is a cycle. The obvious trade-off here is that we
            // don't find out about the cycle until much later than otherwise.
            // let board = this.checker.getBoard();
            // if (!this.detectedOffEdge &&
            //         this.movesMade > board.getWidth() * board.getHeight()) {
            //     this.detectedCycle = true;
            // }
            // Flynn's turtle/hare algorithm.
            // For every one turtle move, we make two hare moves.
            for (let i = 0; i < 2; i++) {
                let hareSquareDirection = this.getDirectionOfBoardSquare(this.hare.x, this.hare.y);
                if (hareSquareDirection == null) {
                    this.detectedOffEdge = true;
                    break;
                }
                else {
                    this.hare.x += hareSquareDirection.dx;
                    this.hare.y += hareSquareDirection.dy;
                }
                if (this.hare.x === position.x && this.hare.y === position.y) {
                    this.detectedCycle = true;
                    break;
                }
            }
        }
        if (this.board.get(nx, ny) != null) {
            audio_1.Audio.play(audio_1.Sounds.PLOP);
            this.checker.setPosition(nx, ny);
            this.checker.setOffset(-dx, -dy);
        }
        else {
            this.detectedOffEdge = true;
        }
    }
    /**
     * Modifies the offset such that it approaches 0, which makes it appear like
     * the `Checker` is moving towards its position.
     *
     * Returns true when the checker has stopped moving.
     */
    animateTowardsPosition() {
        let friction = 0.9;
        let stopThreshold = 0.03;
        let offset = this.checker.getOffset();
        if (offset.x !== 0) {
            offset.x *= friction;
            if (Math.abs(offset.x) < stopThreshold) {
                offset.x = 0;
            }
        }
        if (offset.y !== 0) {
            offset.y *= friction;
            if (Math.abs(offset.y) < stopThreshold) {
                offset.y = 0;
            }
        }
        this.checker.setOffset(offset.x, offset.y);
        return offset.x === 0 && offset.y === 0;
    }
    /**
     * Returns a vector representing the direction that the arrow on the given
     * square is pointing. May return null if no square exists and the given
     * coordinate.
     */
    getDirectionOfBoardSquare(x, y) {
        let square = this.board.get(x, y);
        if (square != null) {
            let angle = Math.round(square.angle) % 4;
            if (angle < 0)
                angle += 4;
            let movements = [{ x: 1 }, { y: 1 }, { x: -1 }, { y: -1 }];
            let movement = movements[angle];
            return { dx: movement['x'] || 0,
                dy: movement['y'] || 0 };
        }
        return null;
    }
    /**
     * Animates the checker and schedules the next move.
     */
    update() {
        if (this.animateTowardsPosition()) {
            let position = this.checker.getPosition();
            // When the checker has stopped, move it to the next square.
            let squareDirection = this.getDirectionOfBoardSquare(position.x, position.y);
            if (squareDirection != null) {
                this.move(squareDirection.dx, squareDirection.dy);
            }
        }
    }
}
exports.CheckerController = CheckerController;

},{"../util/audio":15}],6:[function(require,module,exports){
"use strict";
/**
 * A class that is capable of rendering a checker on its board. It is expected
 * that the squareSize is passed to the render function.
 * To change the square size after the fact, `setSquareSize` may be used, and
 * the position and size of the checker will be immediately updated.
 */
class CheckerRenderer {
    constructor(checker) {
        this.checker = checker;
        this.rendered = null;
    }
    /** Sets the square size of the board this checker is on. */
    setSquareSize(newSquareSize) {
        this.squareSize = newSquareSize;
        this.rerender();
    }
    /**
     * If this renderer has rendered the checker, this will return the top-level
     * PIXI container that has it. Otherwise, it will return null.
     */
    getRendered() { return this.rendered; }
    /**
     * Builds the path used to represent the checker and positions it in the
     * middle of its container, which should be of size `squareSize`.
     */
    buildGraphics() {
        let halfSquareSize = this.squareSize / 2;
        let radius = halfSquareSize * 0.6;
        let colors = [0xDA1434, 0xFB4434];
        let g = new PIXI.Graphics();
        g.beginFill(colors[0]);
        g.drawCircle(halfSquareSize, halfSquareSize, radius);
        let innerRing = 0.2;
        let rings = Math.floor(halfSquareSize / 5);
        for (let ring = 1; ring < rings; ring++) {
            g.beginFill(colors[ring % colors.length]);
            g.drawCircle(halfSquareSize, halfSquareSize, (radius - innerRing) * (rings - ring) / rings + innerRing);
        }
        return g;
    }
    /**
     * Clears everything from the rendered container, and rerenders the
     * graphics.
     */
    rerender() {
        this.rendered.removeChildren();
        this.rendered.addChild(this.buildGraphics());
    }
    /**
     * Updates the position of the graphics based on the updated `Checker`
     * position.
     */
    update() {
        if (this.rendered != null) {
            let position = this.checker.getOffsetPosition();
            this.rendered.position.x = this.squareSize * position.x;
            this.rendered.position.y = this.squareSize * position.y;
        }
    }
    /**
     * Given a square size, renders the checker and returns an element that
     * contains it.
     */
    render(squareSize) {
        if (this.rendered == null) {
            this.squareSize = squareSize;
            this.rendered = new PIXI.Container();
            this.rendered.addChild(this.buildGraphics());
            this.update();
        }
        return this.rendered;
    }
}
exports.CheckerRenderer = CheckerRenderer;

},{}],7:[function(require,module,exports){
"use strict";
/**
 * Represents the checker at some position on the board. `x` and `y` should be
 * integers that together form the coordinate of the square on the `Board`.
 */
class Checker {
    constructor(x, y) {
        this.x = x | 0;
        this.y = y | 0;
        this.offset = { x: 0, y: 0 };
    }
    /** Returns the position of this checker. */
    getPosition() { return { x: this.x, y: this.y }; }
    /** Sets the position of this `Checker` on a `Board`. */
    setPosition(x, y) {
        this.x = x | 0;
        this.y = y | 0;
        return this;
    }
    /** Returns the floating point offset of this `Checker`. */
    getOffset() {
        return { x: this.offset.x, y: this.offset.y };
    }
    /** Sets the floating point offset of this `Checker`. */
    setOffset(dx, dy) {
        this.offset.x = dx;
        this.offset.y = dy;
        return this;
    }
    /** Returns the sum of the position and the offset. */
    getOffsetPosition() {
        return { x: this.x + this.offset.x,
            y: this.y + this.offset.y };
    }
}
exports.Checker = Checker;

},{}],8:[function(require,module,exports){
/// <reference path="../typings/index.d.ts" />
"use strict";
const world_1 = require('./world');
// Create the world
let world = new world_1.World();
let startLoop = function (f) {
    requestAnimationFrame(function () { startLoop(f); });
    f();
};
startLoop(function () {
    world.update();
    world.render();
});

},{"./world":17}],9:[function(require,module,exports){
"use strict";
/**
 * A basic rectangle that is renderable to PIXI (as opposed to a
 * PIXI.Rectangle), optionally with rounded corners.
 */
class PIXIRect extends PIXI.Graphics {
    constructor(width, height, options = null) {
        super();
        this.options = {
            cornerRadius: options && (options.cornerRadius == null ? 5 : options.cornerRadius),
            fillColor: options && options.fillColor || 0,
            strokeColor: options && options.strokeColor,
            lineWidth: options && options.lineWidth || 0,
            width: width,
            height: height
        };
        this.updateGeometry();
    }
    /**
     * Set new parameters for the fill and stroke colors.
     */
    setColors(colors) {
        if (colors.fill != null) {
            this.options.fillColor = colors.fill;
        }
        if (colors.stroke != null) {
            this.options.strokeColor = colors.stroke;
        }
        this.updateGeometry();
    }
    /**
     * Updates the path associated with this PIXI.Graphics object to accurately
     * represent the rectangle detailed by the options.
     */
    updateGeometry() {
        let options = this.options;
        let width = options.width;
        let height = options.height;
        let radius = options.cornerRadius;
        /**
         * Below is a diagram of the order in which the rectangle is rendered.
         * The numbers coincide with comments on the lines below that are used
         * to construct the geometry for the rectangle.
         *
         *     8/0 --------------- 1
         *     /                     \
         *   7                         2
         *   |                         |
         *   |                         |
         *   |                         |
         *   |                         |
         *   6                         3
         *     \                     /
         *       5 --------------- 4
         */
        // NOTE: The arcs are sometimes imprecise when rendered, and having a
        // lineTo command after them helps make them look better. These lineTo
        // commands will be numbered as N.5, where N is the number of the arc.
        this.clear();
        this.beginFill(options.fillColor);
        this.lineStyle(options.lineWidth, options.strokeColor);
        this.moveTo(radius, 0); // 0
        this.lineTo(width - radius, 0); // 1
        if (radius > 0) {
            // (2) Top-right corner.
            this.arc(width - radius, radius, radius, Math.PI / 2 * 3, Math.PI * 2);
        }
        this.lineTo(width, radius); // 2.5
        this.lineTo(width, height - radius); // 3
        if (radius > 0) {
            // (4) Bottom-right corner.
            this.arc(width - radius, height - radius, radius, 0, Math.PI / 2);
        }
        this.lineTo(width - radius, height); // 4.5
        this.lineTo(radius, height); // 5
        if (radius > 0) {
            // (6) Bottom-left corner.
            this.arc(radius, height - radius, radius, Math.PI / 2, Math.PI);
        }
        this.lineTo(0, height - radius); // 6.5
        this.lineTo(0, radius); // 7
        if (radius > 0) {
            // (8) Top-left corner.
            this.arc(radius, radius, radius, Math.PI, Math.PI / 2 * 3);
        }
    }
}
exports.PIXIRect = PIXIRect;

},{}],10:[function(require,module,exports){
"use strict";
let ButtonState = {
    HOVER: 'hover',
    DOWN: 'down',
    NORMAL: 'normal'
};
/**
 * This class encapsulates the logic for state transitions on a button. It emits
 * events when a button should change the state, with each different event
 * signifying a different state.
 */
class ButtonStateHandler {
    constructor(target) {
        this.target = target;
        this.handlers = {};
        this.mouse = { down: false, inside: false };
        this.target.interactive = true;
        this.target.buttonMode = true;
        this.target.on('pointerdown', () => this.handleMouseDown());
        this.target.on('pointerup', () => this.handleMouseUp());
        this.target.on('pointerupoutside', () => this.handleMouseUp());
        this.target.on('pointermove', (event) => this.handleMouseMove(event));
    }
    /**
     * Handler for a PIXI pointerdown event.
     */
    handleMouseDown() {
        // When we get this event, the mouse is guaranteed to be inside the
        // button.
        this.mouse.inside = true;
        this.mouse.down = true;
        this.fire(ButtonState.DOWN);
    }
    /**
     * Handler for a PIXI pointerup event.
     */
    handleMouseUp() {
        this.fire(this.mouse.inside ? ButtonState.HOVER : ButtonState.NORMAL);
        this.mouse.down = false;
    }
    /**
     * Handler for a PIXI pointermove event. This method controls the state of
     * `mouse.inside`, and possibly fires ButtonState.HOVER and
     * ButtonState.NORMAL events when the state changes.
     */
    handleMouseMove(event) {
        // Ignore the event entire if the mouse button is not down.
        let position = event.data.global;
        // Determine whether the pointer is inside the bounds of the button.
        let isPointerInside = !(position.x < this.target.position.x ||
            position.y < this.target.position.y ||
            position.x > this.target.position.x + this.target.width ||
            position.y > this.target.position.y + this.target.height);
        if (isPointerInside !== this.mouse.inside) {
            // If the "inside" state has changed, we need to raise the correct
            // events so that the button appearance can change.
            this.mouse.inside = isPointerInside;
            if (!this.mouse.down) {
                if (isPointerInside) {
                    this.fire(ButtonState.HOVER);
                }
                else {
                    this.fire(ButtonState.NORMAL);
                }
            }
        }
    }
    /** A private function to register a listener for an arbitrary event. */
    listen(event, handler) {
        if (this.handlers[event] == null) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
        return this;
    }
    /** A private function to fire the given event. */
    fire(event) {
        let handlers = this.handlers[event];
        if (handlers != null) {
            for (let i = 0; i < handlers.length; i++) {
                handlers[i]();
            }
        }
    }
    /** Registers a hover handler. */
    whenHovered(handler) {
        return this.listen(ButtonState.HOVER, handler);
    }
    /** Registers a button down handler. */
    whenDown(handler) {
        return this.listen(ButtonState.DOWN, handler);
    }
    /** Registers a button normal handler. */
    whenNormal(handler) {
        return this.listen(ButtonState.NORMAL, handler);
    }
}
exports.ButtonStateHandler = ButtonStateHandler;

},{}],11:[function(require,module,exports){
// This file contains some button colors and other style properties that look
// fairly decent. These button styles were borrowed from the Bootstrap default
// configuration.
"use strict";
// Colors of the button backgrounds, depending on the state of the button.
exports.ButtonColors = {
    SUCCESS: { normal: 0x5CB85C, hovered: 0x449D44, down: 0x398439 },
    DANGER: { normal: 0xd9534f, hovered: 0xc9302c, down: 0xac2925 },
    WARNING: { normal: 0xf0ad4e, hovered: 0xec971f, down: 0xd58512 }
};
// Colors of the button borders, depending on the state of the button.
exports.ButtonBorderColors = {
    SUCCESS: { normal: 0x4cae4c, hovered: 0x398439, down: 0x255625 },
    DANGER: { normal: 0xd43f3a, hovered: 0xac2925, down: 0x761c19 },
    WARNING: { normal: 0xeea236, hovered: 0xd58512, down: 0x985f0d }
};
// A text style that is convenient to use for the buttons.
exports.ButtonTextStyle = {
    fontFamily: 'Helvetica Neue',
    fontSize: 14,
    fill: 0xFFFFFF
};
// Common button style configuration that can be passed directly to a
// PIXIButton.
exports.ButtonStyles = {
    SUCCESS: { text: exports.ButtonTextStyle, colors: exports.ButtonColors.SUCCESS,
        border: { width: 1, colors: exports.ButtonBorderColors.SUCCESS } },
    DANGER: { text: exports.ButtonTextStyle, colors: exports.ButtonColors.DANGER,
        border: { width: 1, colors: exports.ButtonBorderColors.DANGER } },
    WARNING: { text: exports.ButtonTextStyle, colors: exports.ButtonColors.WARNING,
        border: { width: 1, colors: exports.ButtonBorderColors.WARNING } }
};
// oppa button style

},{}],12:[function(require,module,exports){
"use strict";
const pixi_rect_1 = require('../shapes/pixi-rect');
const button_state_handler_1 = require('./button-state-handler');
let accessOrDefault = function (obj, path, defaultValue) {
    for (let i = 0; i < path.length; i++) {
        obj = obj[path[i]];
        if (obj == null)
            return defaultValue;
    }
    return obj;
};
/**
 * A button component that can be added to a scene and will fire an event when
 * clicked.
 */
class PIXIButton extends PIXI.Container {
    constructor(label, width, height, style = null) {
        super();
        this.buttonWidth = width;
        this.buttonHeight = height;
        this.style = style;
        let cornerRadius = 4;
        this.padding = 5;
        this.label = label;
        this.clickHandlers = [];
        let downFillColor = accessOrDefault(style, ['colors', 'down'], 0x00AA00);
        let normalFillColor = accessOrDefault(style, ['colors', 'normal'], 0x00FF00);
        let hoverFillColor = accessOrDefault(style, ['colors', 'hovered'], 0x66FF66);
        let downBorderColor = accessOrDefault(style, ['border', 'colors', 'down'], downFillColor);
        let normalBorderColor = accessOrDefault(style, ['border', 'colors', 'normal'], normalFillColor);
        let hoverBorderColor = accessOrDefault(style, ['border', 'colors', 'hovered'], hoverFillColor);
        this.outline = new pixi_rect_1.PIXIRect(width, height, {
            cornerRadius: cornerRadius, fillColor: normalFillColor,
            strokeColor: normalBorderColor,
            lineWidth: style && style.border && style.border.width || 0 });
        this.addChild(this.outline);
        this.text = this.renderText();
        this.addChild(this.text);
        new button_state_handler_1.ButtonStateHandler(this)
            .whenNormal((() => this.outline.setColors({
            fill: normalFillColor, stroke: normalBorderColor })).bind(this))
            .whenHovered((() => this.outline.setColors({
            fill: hoverFillColor, stroke: hoverBorderColor })).bind(this))
            .whenDown((() => this.outline.setColors({
            fill: downFillColor, stroke: downBorderColor })).bind(this));
    }
    /** Renders and positions the text label of the button. */
    renderText(label) {
        label = label != null ? label : this.label;
        if (this.text != null) {
            this.text.text = label;
        }
        let text = this.text || new PIXI.Text(label, this.style && this.style.text);
        text.position.x = Math.floor(this.buttonWidth / 2 - text.width / 2);
        text.position.y = Math.floor(this.buttonHeight / 2 - text.height / 2);
        return text;
    }
    /**
     * Sets the label of the button. This automatically refreshes the view. Keep
     * in mind that the text will not be wrapped.
     */
    setLabel(newText) {
        this.text = this.renderText(newText);
        return this;
    }
    /**
     * Register a handler for a click event. Equivalent to
     * `button.on('click', ...)`, but more convenient because it returns the
     * button.
     */
    onClick(handler) {
        this.on('click', handler);
        return this;
    }
}
exports.PIXIButton = PIXIButton;

},{"../shapes/pixi-rect":9,"./button-state-handler":10}],13:[function(require,module,exports){
"use strict";
/**
 * A simple class that keeps the common options between the vertical and
 * horizontal stacks. Currently, two options are supported:
 * padding: the amount of space around the elements in the stack.
 * separation: the amount of space between the elements in the stack.
 */
class PIXIStack extends PIXI.Container {
    constructor(options) {
        super();
        this.padding = options && options.padding || 0;
        this.separation = options && options.separation || 0;
    }
}
/**
 * A horizontal stack that lays out its children when they are added. It is
 * expected that the size changes of the children (if any) do not affect the
 * positioning of the other children. Stacks from left to right.
 */
class PIXIHStack extends PIXIStack {
    constructor(options) {
        super(options);
    }
    addChild(child) {
        let lastChild = this.children.length > 0 ?
            this.children.slice(-1)[0] : null;
        let lastChildRect = lastChild == null ? null : lastChild.getBounds();
        super.addChild(child);
        child.position.x = (lastChildRect == null ? this.padding :
            (lastChildRect.right - this.getBounds().left + this.separation));
        child.position.y = this.padding;
    }
}
exports.PIXIHStack = PIXIHStack;
/**
 * A vertical stack that lays out its children when they are added. It is
 * expected that the size changes of the children (if any) do not affect the
 * positioning of the other children. Stacks from top to bottom.
 */
class PIXIVStack extends PIXIStack {
    constructor(options) {
        super(options);
    }
    addChild(child) {
        let lastChild = this.children.length > 0 ?
            this.children.slice(-1)[0] : null;
        let lastChildRect = lastChild == null ? null : lastChild.getBounds();
        super.addChild(child);
        child.position.x = this.padding;
        child.position.y = (lastChildRect == null ? this.padding :
            (lastChildRect.bottom - this.getBounds().top + this.separation));
    }
}
exports.PIXIVStack = PIXIVStack;

},{}],14:[function(require,module,exports){
"use strict";
const pixi_rect_1 = require('../shapes/pixi-rect');
/**
 * A (very) simple text input field with rudimentary focus support.
 * The following features could be supported, but are not:
 * - Multiline text
 * - Horizontal scrolling
 * - Text selection
 * - Copy paste
 * - Moving the cursor via the mouse
 * - Moving the cursor via the up and down arrows
 *
 * This component will emit a 'focus' event when it is clicked
 */
class PIXITextInput extends PIXI.Container {
    constructor(text, width, height, style = null) {
        super();
        // Initialize the properties and variables that affect visual
        // appearance.
        let cornerRadius = 4;
        this.padding = 5;
        this.text = text;
        this.focused = false;
        this.cursor = 0;
        let backgroundColor = style && style.color;
        if (backgroundColor == null)
            backgroundColor = 0xFFFFFF;
        // Initialize the graphic objects.
        this.outline = new pixi_rect_1.PIXIRect(width, height, {
            cornerRadius: cornerRadius, fillColor: backgroundColor,
            strokeColor: style && style.border && style.border.color || 0,
            lineWidth: style && style.border && style.border.width || 0 });
        this.addChild(this.outline);
        this.measureTextObject = new PIXI.Text('', style.text);
        this.textObject = new PIXI.Text(this.text, style.text);
        this.textObject.position.x = this.padding;
        this.textObject.position.y = this.padding;
        this.addChild(this.textObject);
        this.cursorObject = this.buildTextCursor();
        this.addChild(this.cursorObject);
        this.moveCursor(0);
        this.cursorObject.alpha = 0;
        // Initialize the interactivity logic.
        this.interactive = true;
        this.on('pointerdown', function () {
            // Focus on this text input.
            this.focused = true;
            this.cursorObject.alpha = 1;
            this.emit('focus');
        }.bind(this));
        this.on('unfocus', function () {
            // If something emits an unfocus event on this text input, it should
            // react.
            this.focused = false;
            this.cursorObject.alpha = 0;
        });
        document.addEventListener('keydown', function (e) {
            // Ignore keys when not focused.
            if (!this.focused)
                return;
            this.handleKeyDown(e.keyCode);
        }.bind(this));
    }
    buildTextCursor() {
        let cursorObject = new PIXI.Graphics();
        cursorObject.beginFill(0);
        cursorObject.moveTo(-1, this.padding);
        cursorObject.lineTo(-1, this.outline.height - this.padding);
        cursorObject.lineTo(0, this.outline.height - this.padding);
        cursorObject.lineTo(0, this.padding);
        return cursorObject;
    }
    handleKeyDown(keyCode) {
        if (keyCode === 37) {
            this.moveCursor(Math.max(0, this.cursor - 1));
        }
        else if (keyCode === 39) {
            this.moveCursor(Math.min(this.text.length, this.cursor + 1));
        }
        else if (keyCode === 8) {
            let firstHalf = this.text.slice(0, Math.max(0, this.cursor - 1));
            let secondHalf = this.text.slice(this.cursor);
            this.moveCursor(this.cursor - 1);
            this.updateText(firstHalf + secondHalf);
        }
        else if (keyCode === 46) {
            let firstHalf = this.text.slice(0, this.cursor);
            let secondHalf = this.text.slice(Math.min(this.text.length, this.cursor + 1));
            this.updateText(firstHalf + secondHalf);
        }
        else if (this.keyFilter == null || this.keyFilter(keyCode)) {
            let str = this.keyCodeToChar(keyCode);
            if (this.updateText(this.text.slice(0, this.cursor) + str +
                this.text.slice(this.cursor))) {
                this.moveCursor(this.cursor + 1);
            }
        }
    }
    /**
     * Updates the displayed text, unless the text is too long.
     * Returns true if the text was updated.
     */
    updateText(newText) {
        if (this.maxLength != null && newText.length > this.maxLength) {
            return false;
        }
        this.text = newText;
        this.textObject.text = newText;
        this.moveCursor(this.cursor);
        return true;
    }
    /**
     * Measures the given text.
     */
    measureText(text) {
        this.measureTextObject.text = text;
        return {
            width: this.measureTextObject.width,
            height: this.measureTextObject.height
        };
    }
    /**
     * Moves the cursor to `newPosition`, which should be between 0 and
     * this.text.length (inclusive).
     */
    moveCursor(newPosition) {
        if (newPosition < 0)
            newPosition = 0;
        if (newPosition > this.text.length)
            newPosition = this.text.length;
        let textPart = this.text.slice(0, newPosition);
        this.cursor = newPosition;
        let measuredWidth = textPart.length > 0 ?
            this.measureText(textPart).width : 0;
        this.cursorObject.position.x = measuredWidth + this.padding;
    }
    /** Gets the value of the currently entered text. */
    getText() { return this.text; }
    /** Sets the keycode converter. */
    setKeyCodeConverter(converter) {
        this.keyCodeToChar = converter;
        return this;
    }
    /** Sets the max length. */
    setMaxLength(maxLength) {
        this.maxLength = maxLength;
        return this;
    }
    /** Sets the key filter. */
    setKeyFilter(filter) {
        this.keyFilter = filter;
        return this;
    }
}
exports.PIXITextInput = PIXITextInput;

},{"../shapes/pixi-rect":9}],15:[function(require,module,exports){
"use strict";
const howler_1 = require('howler');
(function (Sounds) {
    Sounds[Sounds["PLOP"] = 0] = "PLOP";
    Sounds[Sounds["PLOP_QUIET"] = 1] = "PLOP_QUIET";
})(exports.Sounds || (exports.Sounds = {}));
var Sounds = exports.Sounds;
class Audio {
    static initialize() {
        if (Audio.sounds == null) {
            Audio.sounds = {};
            Audio.sounds[Sounds.PLOP] = new howler_1.Howl({
                // mp3 is public domain, downloaded from
                // http://soundbible.com/2067-Blop.html
                src: ['sounds/Blop-Mark_DiAngelo-79054334.mp3'],
                volume: 0.1
            });
        }
    }
    static play(sound) {
        Audio.initialize();
        let howl = Audio.sounds[sound];
        if (howl != null) {
            howl.play();
            return true;
        }
        return false;
    }
}
exports.Audio = Audio;
Audio.initialize();

},{"howler":undefined}],16:[function(require,module,exports){
"use strict";
let clamp = (num, min, max) => Math.min(max, Math.max(min, num));
class CoordUtils {
    /**
     * Given a coordinate and size (all in integers), this function will return
     * the index of that coordinate in a flat array.
     */
    static coordToIndex(x, y, width, height, shouldClamp = true) {
        x = x | 0;
        y = y | 0;
        if (shouldClamp) {
            x = clamp(x, 0, width - 1);
            y = clamp(y, 0, height - 1);
        }
        else if (x < 0 || y < 0 || x >= width || y >= height) {
            return null;
        }
        return y * width + x;
    }
    /**
     * Given an index and size, this function will return the coordinate. This
     * function is the inverse of coordToIndex.
     */
    static indexToCoord(index, width) {
        index = index | 0;
        width = width | 0;
        let x = index % width;
        let y = (index - x) / width;
        return { x: x, y: y };
    }
}
exports.CoordUtils = CoordUtils;

},{}],17:[function(require,module,exports){
"use strict";
const PIXI = require('pixi.js');
const arrow_board_renderer_1 = require('./arrows/arrow-board-renderer');
const arrow_board_controller_1 = require('./arrows/arrow-board-controller');
const board_1 = require('./board/board');
const checker_1 = require('./checker/checker');
const checker_controller_1 = require('./checker/checker-controller');
const checker_renderer_1 = require('./checker/checker-renderer');
// Custom PIXI controls/styling
const button_style_1 = require('./renderable/widgets/button-style');
const pixi_button_1 = require('./renderable/widgets/pixi-button');
const pixi_text_input_1 = require('./renderable/widgets/pixi-text-input');
const pixi_stack_1 = require('./renderable/widgets/pixi-stack');
/**
 * Represents the world, or the app. This class has top-level control over all
 * functionality of the app. It builds the UI and ties it to actual
 * functionality.
 */
class World {
    constructor() {
        this.boardWidth = 10;
        this.boardHeight = 10;
        this.useConstMemoryAlgorithm = false;
        this.renderer = this.initializeRenderer();
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();
        this.leftMenu = this.buildLeftMenu();
        this.rightSide = this.buildRightSide();
        this.mainStack = new pixi_stack_1.PIXIHStack({ padding: 10, separation: 10 });
        this.stage.addChild(this.mainStack);
        this.mainStack.addChild(this.leftMenu);
        this.mainStack.addChild(this.rightSide);
        this.createNewBoard();
        window.addEventListener('resize', () => this.handleWindowResize(window.innerWidth, window.innerHeight));
        this.handleWindowResize(window.innerWidth, window.innerHeight);
    }
    /**
     * A small helper function that allows us to easily initialize an arrow
     * board where all the arrows are pointing in a random direction.
     */
    arrowSquareInitializer(x, y) {
        let velocityBase = (Math.random() - .5) / 2;
        let velocitySign = velocityBase >= 0 ? 1 : -1;
        return {
            angle: Math.floor(Math.random() * 4),
            velocity: velocityBase + velocitySign * 0.2
        };
    }
    ;
    /**
     * Initializes a PIXI renderer and returns it.
     */
    initializeRenderer() {
        const renderer = new PIXI.WebGLRenderer(1280, 720);
        // For the MacBooks with retina displays, 4 is a good number here.
        // I'd guess that 2 would be a good number for non-retina displays.
        renderer.resolution = 4;
        return renderer;
    }
    /**
     * Based on the value of `useConstMemoryAlgorithm`, returns the label of a
     * button that would switch to the opposite/next mode.
     */
    getAlgorithmButtonLabel() {
        let toConstantTimeLabel = 'Switch to Constant Memory';
        let toHashMapLabel = 'Switch to HashMap';
        return (this.useConstMemoryAlgorithm ?
            toHashMapLabel : toConstantTimeLabel);
    }
    /**
     * Builds the left menu. Returns a `PIXI.Container`, which contains all the
     * buttons laid out vertically. Contains the following buttons:
     * `Start`: Unpauses the game if it is paused.
     * `Stop`: Pauses the game if it unpaused.
     * `Reset`: Resets the board and moves the checker to a new random position.
     * `Shuffle Arrows`: Resets the board, but does not move the checker.
     * `constantMemoryButton`: Switches between the two implemented algorithms:
     *     A hashmap version that is O(M) in memory growth (where M is the total
     *         number of squares).
     *     An implementation of Floyd's Tortoise and Hare algorithm, which is
     *         constant memory complexity.
     */
    buildLeftMenu() {
        let buttonWidth = 190;
        let stack = new pixi_stack_1.PIXIVStack({ separation: 10 });
        stack.addChild(new pixi_button_1.PIXIButton('Start', buttonWidth, 34, button_style_1.ButtonStyles.SUCCESS)
            .onClick(() => this.handleStartGame()));
        stack.addChild(new pixi_button_1.PIXIButton('Stop', buttonWidth, 34, button_style_1.ButtonStyles.WARNING)
            .onClick(() => { console.log('stop'); this.handleStopGame(); }));
        stack.addChild(new pixi_button_1.PIXIButton('Reset', buttonWidth, 34, button_style_1.ButtonStyles.DANGER)
            .onClick(() => this.handleResetGame()));
        stack.addChild(new pixi_button_1.PIXIButton('Shuffle Arrows', buttonWidth, 34, button_style_1.ButtonStyles.SUCCESS)
            .onClick(() => this.handleShuffleArrows()));
        let constantMemoryButton = new pixi_button_1.PIXIButton(this.getAlgorithmButtonLabel(), buttonWidth, 34, button_style_1.ButtonStyles.WARNING)
            .onClick(() => {
            console.log('click!');
            constantMemoryButton.setLabel(this.handleToggleAlgorithm());
        });
        stack.addChild(constantMemoryButton);
        return stack;
    }
    /**
     * Builds the right side of the UI which contains the top bar and the board.
     */
    buildRightSide() {
        let container = new pixi_stack_1.PIXIVStack({ separation: 10 });
        container.addChild(this.topBar = this.buildTopBar());
        container.addChild(this.boardContainer = new PIXI.Container());
        return container;
    }
    /**
     * A helper method that sets up a text input for number entry.
     */
    setupSizeInput(initialValue) {
        let input = new pixi_text_input_1.PIXITextInput(initialValue, 65, 30, {
            text: { fontSize: 15 }, color: 0xFFFFFF,
            border: { width: 1, color: 0x888888 } })
            .setKeyFilter((keyCode) => (keyCode >= 48 && keyCode < 58))
            .setKeyCodeConverter((keyCode) => String(keyCode - 48))
            .setMaxLength(4);
        input.on('focus', this.unfocusAllExcept(input));
        return input;
    }
    /**
     * Builds the top bar, which contains the two text inputs necessary to
     * change the board size, and a button to apply the change; as well as a
     * label that shows the current status.
     */
    buildTopBar() {
        let widthInput = this.setupSizeInput(String(this.boardWidth));
        let heightInput = this.setupSizeInput(String(this.boardHeight));
        let hstack = new pixi_stack_1.PIXIHStack({ separation: 10 });
        hstack.addChild(widthInput);
        hstack.addChild(new PIXI.Text('x', { fontFamily: 'Arial', fontSize: 18, fill: 0xffffff }));
        hstack.addChild(heightInput);
        hstack.addChild(new pixi_button_1.PIXIButton('Change Board Size', 140, 30, button_style_1.ButtonStyles.SUCCESS).onClick(() => this.handleBoardResize(widthInput.getText(), heightInput.getText())));
        hstack.addChild(this.statusLabel = new PIXI.Text('Searching...', { fill: button_style_1.ButtonStyles.WARNING.colors.normal }));
        return hstack;
    }
    /**
     * Sets the text displayed on the status label.
     */
    setStatus(newStatus) {
        this.statusLabel.text = newStatus;
    }
    /**
     * Removes the checker, if there is one, and reinstantiates all the classes
     * associated with the board.
     */
    createNewBoard() {
        // If a checker exists, remove its rendered element and reset all
        // checker-related properties.
        if (this.checker != null) {
            let renderedChecker = this.checkerRenderer.getRendered();
            if (renderedChecker != null) {
                this.boardContainer.removeChild(renderedChecker);
            }
            this.checker = null;
            this.checkerController = null;
            this.checkerRenderer = null;
        }
        // Reset the board.
        this.board = new board_1.Board(this.boardWidth, this.boardHeight, this.arrowSquareInitializer);
        this.boardController = new arrow_board_controller_1.ArrowBoardController(this.board);
        this.boardRenderer = new arrow_board_renderer_1.ArrowBoardRenderer(this.board);
        // Attach the new click handler, since we have a new renderer instance.
        this.boardRenderer.onClick((x, y) => {
            let square = this.board.get(x, y);
            if (square.angle === Math.round(square.angle)) {
                square.angle = (square.angle + 1) % 4;
            }
            this.board.put(square, x, y);
            this.boardRenderer.update(x, y);
            if (this.checkerController != null) {
                this.checkerController.reset(this.useConstMemoryAlgorithm);
            }
        });
        // This will clear the board container and render the board into the
        // renderer viewport.
        this.rerenderBoard();
        // Spin the arrows for effect.
        this.boardController.initiateRotation();
    }
    /**
     * Clears the board container and attaches a newly rendered board.
     */
    rerenderBoard() {
        let boardContainerBounds = this.boardContainer.getBounds();
        this.boardContainer.removeChildren();
        this.boardRenderer.clearRendered();
        this.boardContainer.addChild(this.boardRenderer.render(this.renderer.width - boardContainerBounds.left, this.renderer.height - boardContainerBounds.top));
        if (this.checker != null) {
            this.boardContainer.addChild(this.checkerRenderer.render(this.boardRenderer.getSquareSize()));
        }
    }
    /**
     * A small helper function, which will return a function that will emit the
     * 'unfocus' event to all objects in the scene graph except the object
     * passed to this function.
     * This is useful for controlling which text input is focused.
     */
    unfocusAllExcept(control) {
        return () => {
            let stack = [this.stage];
            while (stack.length > 0) {
                let container = stack.pop();
                if (container !== control) {
                    container.emit('unfocus');
                    if (container instanceof PIXI.Container) {
                        let children = container.children;
                        for (let i = 0; i < children.length; i++) {
                            stack.push(children[i]);
                        }
                    }
                }
            }
        };
    }
    /**
     * Called when the window is resized. This method resizes the renderer,
     * rerenders the board and updates the checker.
     */
    handleWindowResize(newWidth, newHeight) {
        let oldView = this.renderer.view;
        this.renderer.resize(newWidth, newHeight);
        this.renderer.view.width = newWidth;
        this.renderer.view.height = newHeight;
        this.rerenderBoard();
        if (this.checkerRenderer != null) {
            this.checkerRenderer.setSquareSize(this.boardRenderer.getSquareSize());
        }
    }
    /**
     * Called when the user wants to change the board size. Directly takes
     * strings that will represent the new board width and height.
     * If either value is empty or null, this method does nothing.
     */
    handleBoardResize(widthStr, heightStr) {
        if (widthStr != null && widthStr.length > 0 &&
            heightStr != null && heightStr.length > 0) {
            let width = parseInt(widthStr, 10);
            let height = parseInt(heightStr, 10);
            if (width > 0 && height > 0) {
                this.boardWidth = width;
                this.boardHeight = height;
                this.createNewBoard();
            }
        }
    }
    /** Unpauses the game. */
    handleStartGame() {
        this.paused = false;
    }
    /** Pauses the game. */
    handleStopGame() {
        this.paused = true;
        this.setStatus('Paused');
    }
    /** Resets the game by spinning the arrows and resetting the checker. */
    handleResetGame() {
        this.paused = false;
        this.createNewBoard();
    }
    /** Shuffles the arrows without moving the checker. */
    handleShuffleArrows() {
        if (this.checkerController != null) {
            this.checkerController.reset(this.useConstMemoryAlgorithm);
        }
        this.boardController.initiateRotation();
    }
    /** Toggles whether the constant memory algorithm should be used. */
    handleToggleAlgorithm() {
        console.log('handling...');
        this.useConstMemoryAlgorithm = !this.useConstMemoryAlgorithm;
        if (this.checkerController != null) {
            this.checkerController.reset(this.useConstMemoryAlgorithm);
        }
        return this.getAlgorithmButtonLabel();
    }
    /** Updates the world. */
    update() {
        if (this.paused)
            return;
        if (!this.boardController.update()) {
            // If are in this block, that means all arrows are done spinning.
            // In this case, we might either have to create a random checker or
            // update the existing one.
            if (this.checker == null) {
                this.boardRenderer.updateAll();
                // Generate a random position.
                let width = this.board.getWidth();
                let i = Math.floor(Math.random() * width * this.board.getHeight());
                let x = i % width;
                let y = (i - x) / width;
                // Create our checker and associated objects.
                this.checker = new checker_1.Checker(x, y);
                this.checkerController = new checker_controller_1.CheckerController(this.board, this.checker, this.useConstMemoryAlgorithm);
                this.checkerRenderer = new checker_renderer_1.CheckerRenderer(this.checker);
                // Render the checker on the board. This is convenient because
                // this way the checker will have the same offset as the board.
                this.boardContainer.addChild(this.checkerRenderer.render(this.boardRenderer.getSquareSize()));
            }
            else {
                this.checkerController.update();
                this.checkerRenderer.update();
                if (this.checkerController.hasDetectedCycle()) {
                    this.setStatus('Detected cycle');
                }
                else if (this.checkerController.hasDetectedEdge()) {
                    this.setStatus('Detected edge');
                }
                else {
                    this.setStatus('Searching...');
                }
            }
        }
        else {
            // TODO: Future work, we could do better here by having
            // ArrowBoardController.update return the updated square
            // coordinates, so we could only update those.
            this.setStatus('Initializing...');
            this.boardRenderer.updateAll();
        }
    }
    render() {
        this.renderer.render(this.stage);
    }
}
exports.World = World;

},{"./arrows/arrow-board-controller":1,"./arrows/arrow-board-renderer":2,"./board/board":4,"./checker/checker":7,"./checker/checker-controller":5,"./checker/checker-renderer":6,"./renderable/widgets/button-style":11,"./renderable/widgets/pixi-button":12,"./renderable/widgets/pixi-stack":13,"./renderable/widgets/pixi-text-input":14,"pixi.js":undefined}]},{},[8])(8)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXJyb3dzL2Fycm93LWJvYXJkLWNvbnRyb2xsZXIudHMiLCJzcmMvYXJyb3dzL2Fycm93LWJvYXJkLXJlbmRlcmVyLnRzIiwic3JjL2JvYXJkL2JvYXJkLXJlbmRlcmVyLnRzIiwic3JjL2JvYXJkL2JvYXJkLnRzIiwic3JjL2NoZWNrZXIvY2hlY2tlci1jb250cm9sbGVyLnRzIiwic3JjL2NoZWNrZXIvY2hlY2tlci1yZW5kZXJlci50cyIsInNyYy9jaGVja2VyL2NoZWNrZXIudHMiLCJzcmMvaW5kZXgudHMiLCJzcmMvcmVuZGVyYWJsZS9zaGFwZXMvcGl4aS1yZWN0LnRzIiwic3JjL3JlbmRlcmFibGUvd2lkZ2V0cy9idXR0b24tc3RhdGUtaGFuZGxlci50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvYnV0dG9uLXN0eWxlLnRzIiwic3JjL3JlbmRlcmFibGUvd2lkZ2V0cy9waXhpLWJ1dHRvbi50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvcGl4aS1zdGFjay50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvcGl4aS10ZXh0LWlucHV0LnRzIiwic3JjL3V0aWwvYXVkaW8udHMiLCJzcmMvdXRpbC9jb29yZC11dGlscy50cyIsInNyYy93b3JsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNJQTs7OztHQUlHO0FBQ0g7SUFHSSxZQUFZLEtBQTZCO1FBQ3JDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7O09BR0c7SUFDSyxrQkFBa0IsQ0FBQyxNQUFjLEVBQUUsTUFBYztRQUNyRCxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztRQUM1QixNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMs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LENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDckMsQ0FBQztnQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDSixJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLHVEQUF1RDtZQUN2RCx3REFBd0Q7WUFDeEQsOENBQThDO1lBQzlDLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25DLENBQUM7SUFDTCxDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxDQUFDO0FBQ0wsQ0FBQztBQTFYWSxhQUFLLFFBMFhqQixDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7IEFycm93U3F1YXJlVHlwZSB9IGZyb20gJy4vYXJyb3dzJztcbmltcG9ydCB7IEJvYXJkUmVuZGVyZXIgfSBmcm9tICcuLi9ib2FyZC9ib2FyZC1yZW5kZXJlcic7XG5pbXBvcnQgeyBCb2FyZCB9IGZyb20gJy4uL2JvYXJkL2JvYXJkJztcblxuLyoqXG4gKiBBIGJvYXJkIGNvbnRyb2xsZXIgdGhhdCBrbm93cyBhYm91dCBgQm9hcmRgcyB3aXRoIGFycm93cy4gQWxsb3dzIHVzIHRvIHJvdGF0ZVxuICogYXJyb3dzIHdpdGhpbiB0aGUgYm9hcmQgb24gdXBkYXRlLCBhcyB3ZWxsIGFzIGluaXRpYXRlIHRoZSByb3RhdGlvbiBvZiB0aG9zZVxuICogYXJyb3dzLlxuICovXG5leHBvcnQgY2xhc3MgQXJyb3dCb2FyZENvbnRyb2xsZXIge1xuICAgIHByaXZhdGUgYm9hcmQ6IEJvYXJkPEFycm93U3F1YXJlVHlwZT47XG5cbiAgICBjb25zdHJ1Y3Rvcihib2FyZDogQm9hcmQ8QXJyb3dTcXVhcmVUeXBlPikge1xuICAgICAgICB0aGlzLmJvYXJkID0gYm9hcmQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgZGlmZmVyZW5jZSBvZiB0d28gYW5nbGVzIHJlcHJlc2VudGVkIGluIHRoZSBmb3JtIGRlc2NyaWJlZCBpblxuICAgICAqIHtAc2VlIEFycm93U3F1YXJlVHlwZX0uXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXRBbmdsZURpZmZlcmVuY2UoYW5nbGUxOiBudW1iZXIsIGFuZ2xlMjogbnVtYmVyKSB7XG4gICAgICAgIGFuZ2xlMSA9IGFuZ2xlMSAlIDQ7XG4gICAgICAgIGlmIChhbmdsZTEgPCAwKSBhbmdsZTEgKz0gNDtcbiAgICAgICAgYW5nbGUyID0gYW5nbGUyICUgNDtcbiAgICAgICAgaWYgKGFuZ2xlMiA8IDApIGFuZ2xlMiArPSA0O1xuICAgICAgICAvLyBUaGUgbG9naWMgaGVyZSBpcyB0byBzdXBwb3J0IHRoZSBmb2xsb3dpbmcgY2FzZXM6XG4gICAgICAgIC8vIGFuZ2xlMSA9IDAuMSwgYW5nbGUyID0gMy45XG4gICAgICAgIC8vIGFuZ2xlMSA9IDMuOSwgYW5nbGUyID0gMC4xXG4gICAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLmFicyhhbmdsZTEgLSBhbmdsZTIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoYW5nbGUxIC0gKGFuZ2xlMiArIDQpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKGFuZ2xlMSAtIChhbmdsZTIgLSA0KSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGFuZ2xlIGFuZCB2ZWxvY2l0eSBvZiBhbGwgdGhlIHNwaW5uaW5nIGFycm93cyBvbiB0aGUgYm9hcmQuXG4gICAgICogUmV0dXJucyB0cnVlIGlmIGFueSBhcnJvd3MgYXJlIHN0aWxsIHNwaW5uaW5nLlxuICAgICAqL1xuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgbGV0IHNwaW5uaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYm9hcmQubWFwKCh2YWx1ZTogQXJyb3dTcXVhcmVUeXBlLCB4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwgJiYgdmFsdWUudmVsb2NpdHkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBpdCdzIGEgbm9uLW51bGwgc3F1YXJlLCBhbmQgdGhlIGFycm93IGhhcyBzcGlubmluZ1xuICAgICAgICAgICAgICAgIC8vIHZlbG9jaXR5LCB1cGRhdGUgaXRzIGFuZ2xlIGJhc2VkIG9uIGl0cyB2ZWxvY2l0eS5cbiAgICAgICAgICAgICAgICB2YWx1ZS5hbmdsZSArPSB2YWx1ZS52ZWxvY2l0eTtcbiAgICAgICAgICAgICAgICAvLyBDb3JyZWN0IHRoZSBhbmdsZSB0byBiZSBiZXR3ZWVuIFswLCA0KS5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUuYW5nbGUgPCAwKSB2YWx1ZS5hbmdsZSArPSA0O1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5hbmdsZSA+PSA0KSB2YWx1ZS5hbmdsZSAtPTQ7XG4gICAgICAgICAgICAgICAgLy8gRGFtcGVuIHRoZSB2ZWxvY2l0eSB0byBhY2hpZXZlIGEgc2xvd2Rvd24gZWZmZWN0LlxuICAgICAgICAgICAgICAgIHZhbHVlLnZlbG9jaXR5ICo9IDAuOTk7XG4gICAgICAgICAgICAgICAgLy8gRmxvYXRzIGFyZSBoYXJkLCBzbyB3ZSBuZWVkIHNvbWUgdGhyZXNob2xkIGF0IHdoaWNoIHdlJ2xsXG4gICAgICAgICAgICAgICAgLy8gZGVjaWRlIHRoYXQgd2Ugc2hvdWxkIHN0b3AgdGhlIGFycm93IGlmIGl0IHBvaW50cyBpbiBhIHZhbGlkXG4gICAgICAgICAgICAgICAgLy8gZGlyZWN0aW9uLlxuICAgICAgICAgICAgICAgIGxldCBhYnNWZWxvY2l0eSA9IE1hdGguYWJzKHZhbHVlLnZlbG9jaXR5KTtcbiAgICAgICAgICAgICAgICBsZXQgYWxtb3N0U3RvcHBlZFZlbG9jaXR5ID0gMC4wMjtcbiAgICAgICAgICAgICAgICBsZXQgYWxtb3N0U3RvcHBlZCA9IGFic1ZlbG9jaXR5IDwgYWxtb3N0U3RvcHBlZFZlbG9jaXR5O1xuICAgICAgICAgICAgICAgIC8vIFJlcHJlc2VudHMgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgbmVhcmVzdCBkaXNjcmV0ZSBhbmdsZVxuICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uIGFuZCB0aGUgY3VycmVudCBhbmdsZSBwb3NpdGlvbi4gSWYgdGhleSBhcmUgY2xvc2VcbiAgICAgICAgICAgICAgICAvLyBlbm91Z2gsIGFuZCB0aGUgYXJyb3cgaXMgc3Bpbm5pbmcgc2xvd2x5IGVub3VnaCwgd2Ugc3RvcCB0aGVcbiAgICAgICAgICAgICAgICAvLyBhcnJvdyBvbiB0aGUgZGlzY3JldGUgZGlyZWN0aW9uLlxuICAgICAgICAgICAgICAgIGxldCBhbmd1bGFyRGlmZmVyZW5jZSA9IHRoaXMuZ2V0QW5nbGVEaWZmZXJlbmNlKFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hbmdsZSwgTWF0aC5yb3VuZCh2YWx1ZS5hbmdsZSkpO1xuICAgICAgICAgICAgICAgIGlmIChhbG1vc3RTdG9wcGVkICYmIGFuZ3VsYXJEaWZmZXJlbmNlIDwgMC4wMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTdG9wIHRoZSBhcnJvdyBmcm9tIHNwaW5uaW5nIGFuZCBzbmFwIGl0IHRvIHRoZSBuZWFyZXN0XG4gICAgICAgICAgICAgICAgICAgIC8vIGRpc2NyZXRlIGFuZ2xlLlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS52ZWxvY2l0eSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmFuZ2xlID0gTWF0aC5yb3VuZCh2YWx1ZS5hbmdsZSkgJSA0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBhcnJvdyBoYXMgcHJhY3RpY2FsbHkgc3RvcHBlZCwgYW5kIHdlIGFyZW4ndCBjbG9zZVxuICAgICAgICAgICAgICAgICAgICAvLyB0byBhIGRpc2NyZXRlIGFuZ2xlLCBnaXZlIGl0IGEgc21hbGwga2ljayBpbiBhIHJhbmRvbVxuICAgICAgICAgICAgICAgICAgICAvLyBkaXJlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIGlmIChhYnNWZWxvY2l0eSA8IGFsbW9zdFN0b3BwZWRWZWxvY2l0eSAvIDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS52ZWxvY2l0eSArPSBNYXRoLnJhbmRvbSgpICogMC4yIC0gMC4xXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3Bpbm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzcGlubmluZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgcmFuZG9tIHJvdGF0aW9uYWwgdmVsb2NpdHkgb24gYWxsIGFycm93cy5cbiAgICAgKi9cbiAgICBpbml0aWF0ZVJvdGF0aW9uKCkge1xuICAgICAgICB0aGlzLmJvYXJkLm1hcCgodmFsdWU6IEFycm93U3F1YXJlVHlwZSwgeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IHZlbG9jaXR5QmFzZSA9IChNYXRoLnJhbmRvbSgpIC0gLjUpIC8gMjtcbiAgICAgICAgICAgICAgICBsZXQgdmVsb2NpdHlTaWduID0gdmVsb2NpdHlCYXNlID49IDAgPyAxIDogLTE7XG4gICAgICAgICAgICAgICAgdmFsdWUudmVsb2NpdHkgKz0gdmVsb2NpdHlCYXNlICsgdmVsb2NpdHlTaWduICogMC40O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBBcnJvd1NxdWFyZVR5cGUgfSBmcm9tICcuLi9hcnJvd3MvYXJyb3dzJztcbmltcG9ydCB7IEJvYXJkUmVuZGVyZXIsIFVwZGF0YWJsZVJlbmRlcmFibGUgfSBmcm9tICcuLi9ib2FyZC9ib2FyZC1yZW5kZXJlcic7XG5pbXBvcnQgeyBCb2FyZCB9IGZyb20gJy4uL2JvYXJkL2JvYXJkJztcblxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSByZW5kZXJlciBmb3IgYW4gYEFycm93Qm9hcmRgLiBUaGUgb25seSByZWFsIGJlbmVmaXQgaGVyZSBpcyB0aGF0XG4gKiBpdCBhbGxvd3MgdXMgdG8gaXNvbGF0ZSB0aGUgYXJyb3cgcmVuZGVyaW5nIGZ1bmN0aW9uLCBhbmQgbm90IGNvdXBsZSBpdCB0b1xuICogdGhlIGJvYXJkLiBPdGhlcndpc2UsIHdlJ2QgZWl0aGVyIGhhdmUgdG8gY29kZSB0aGUgYEJvYXJkUmVuZGVyZXJgIHRvIHN1cHBvcnRcbiAqIGFycm93cywgb3IgcGFzcyBpdCByZW5kZXJTcXVhcmUgYXMgYSBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFycm93Qm9hcmRSZW5kZXJlciBleHRlbmRzIEJvYXJkUmVuZGVyZXI8QXJyb3dTcXVhcmVUeXBlPiB7XG4gICAgY29uc3RydWN0b3IoYm9hcmQ6IEJvYXJkPEFycm93U3F1YXJlVHlwZT4pIHtcbiAgICAgICAgc3VwZXIoYm9hcmQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGNvbnRhaW5zIHRoZSBsb2dpYyBmb3IgcmVuZGVyaW5nIGFuIGFycm93IHdpdGhpbiBhIHNxdWFyZS5cbiAgICAgKi9cbiAgICByZW5kZXJTcXVhcmUoc3F1YXJlOiBBcnJvd1NxdWFyZVR5cGUsIHNpemU6IG51bWJlcik6XG4gICAgICAgICAgICBVcGRhdGFibGVSZW5kZXJhYmxlPEFycm93U3F1YXJlVHlwZT4ge1xuICAgICAgICBsZXQgY29udGFpbmVyID0gbmV3IFBJWEkuQ29udGFpbmVyKCk7XG4gICAgICAgIC8vIEEgc3F1YXJlIG11c3QgcmV0dXJuIGEgY29udGFpbmVyIGFuZCBhbiB1cGRhdGUgZnVuY3Rpb24gKHRvIG1vZGlmeVxuICAgICAgICAvLyByZW5kZXJlZCBzcXVhcmVzKS4gV2UgY291bGQgc3BlY2lmeSB0aGUgZGVmYXVsdCBmdW5jdGlvbiBoZXJlLCBidXRcbiAgICAgICAgLy8gc2luY2Ugd2Ugc2hvdWxkIG5ldmVyIGhhdmUgbnVsbCBzcXVhcmVzLCB3ZSB3b3VsZCBhbHdheXMgYmUgY3JlYXRpbmdcbiAgICAgICAgLy8gYSBmdW5jdGlvbiBhbmQgdGhlbiB0aHJvd2luZyBpdCBhd2F5LiBJbnN0ZWFkLCB0aGUgZmFsbGJhY2sgaXMgaW4gdGhlXG4gICAgICAgIC8vIHJldHVybiBzdGF0ZW1lbnQuXG4gICAgICAgIGxldCB1cGRhdGUgPSBudWxsO1xuICAgICAgICBpZiAoc3F1YXJlICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFRoZSBmdWxsIHNpemUgb2YgdGhlIGFycm93LCBlbmQgdG8gZW5kLCB3aXRoIHNpemUvMiBiZWluZyB0aGVcbiAgICAgICAgICAgIC8vIG1pZGRsZS5cbiAgICAgICAgICAgIGxldCBhcnJvd1NpemUgPSBzaXplICogMC44O1xuICAgICAgICAgICAgLy8gVGhlIHdpZHRoIG9mIHRoZSBzaGFmdCBvZiB0aGUgYXJyb3cuXG4gICAgICAgICAgICBsZXQgYXJyb3dXaWR0aCA9IGFycm93U2l6ZSAqIDAuMzU7XG4gICAgICAgICAgICAvLyBUaGUgd2lkdGggb2YgdGhlIHRpcCBhdCB0aGUgd2lkZXN0IHBvaW50LlxuICAgICAgICAgICAgbGV0IGFycm93VGlwV2lkdGggPSBhcnJvd1NpemUgKiAwLjk1O1xuICAgICAgICAgICAgLy8gSG93IGZhciBmcm9tIHRoZSBtaWRkbGUgKGFycm93U2l6ZS8yKSB0aGUgdGlwIHNob3VsZCBzdGFydC5cbiAgICAgICAgICAgIGxldCBhcnJvd1N0ZW1MZW5ndGhGcm9tTWlkID0gMDtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGUgZGlhZ3JhbSBiZWxvdyBzaG93cyB0aGUgb3JkZXIgaW4gd2hpY2ggcG9pbnRzIGFyZSB2aXNpdGVkLlxuICAgICAgICAgICAgICogaS5lLiB0aGUgZmlyc3QgbW92ZVRvIGlzIDAsIHRoZSBmaXJzdCBsaW5lVG8gaXMgMSwgdGhlIHNlY29uZFxuICAgICAgICAgICAgICogbGluZVRvIGlzIDIsIGFuZCBzbyBvbi4gQWxsIHBvaW50cyBhcmUgZGVyaXZlZCBmcm9tIHRoZSBmb3VyXG4gICAgICAgICAgICAgKiBtZXRyaWNzIGFib3ZlLCB3aGljaCBhcmUgaW4gdHVybiBkZXJpdmVkIGZyb20gdGhlIHNxdWFyZSBzaXplLlxuICAgICAgICAgICAgICogICAgICAgICAgICAgMiArXG4gICAgICAgICAgICAgKiAgICAgICAgICAgICAgIHwgXFxcbiAgICAgICAgICAgICAqICAgMCAgICAgICAgICAgfCAgXFxcbiAgICAgICAgICAgICAqICAgKy0tLS0tLS0tLS0tKyAxIFxcXG4gICAgICAgICAgICAgKiAgIHwgICAgICAgICAgICAgICAgXFwgM1xuICAgICAgICAgICAgICogICB8ICAgICAgICAgICA1ICAgIC9cbiAgICAgICAgICAgICAqICAgKy0tLS0tLS0tLS0tKyAgIC9cbiAgICAgICAgICAgICAqICAgNiAgICAgICAgICAgfCAgL1xuICAgICAgICAgICAgICogICAgICAgICAgICAgICB8IC9cbiAgICAgICAgICAgICAqICAgICAgICAgICAgIDQgK1xuICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIGxldCBncmFwaGljcyA9IG5ldyBQSVhJLkdyYXBoaWNzKCk7XG4gICAgICAgICAgICBjb250YWluZXIuYWRkQ2hpbGQoZ3JhcGhpY3MpO1xuICAgICAgICAgICAgZ3JhcGhpY3MuYmVnaW5GaWxsKDB4RkYwMDAwKTtcbiAgICAgICAgICAgIGdyYXBoaWNzLm1vdmVUbygtYXJyb3dTaXplLzIsIC1hcnJvd1dpZHRoLzIpO1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKGFycm93U3RlbUxlbmd0aEZyb21NaWQsIC1hcnJvd1dpZHRoLzIpO1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKGFycm93U3RlbUxlbmd0aEZyb21NaWQsIC1hcnJvd1RpcFdpZHRoLzIpO1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKGFycm93U2l6ZS8yLCAwKTtcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVUbyhhcnJvd1N0ZW1MZW5ndGhGcm9tTWlkLCBhcnJvd1RpcFdpZHRoLzIpO1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKGFycm93U3RlbUxlbmd0aEZyb21NaWQsIGFycm93V2lkdGgvMik7XG4gICAgICAgICAgICBncmFwaGljcy5saW5lVG8oLWFycm93U2l6ZS8yLCBhcnJvd1dpZHRoLzIpXG4gICAgICAgICAgICBncmFwaGljcy5wb3NpdGlvbi54ID0gc2l6ZSAvIDI7XG4gICAgICAgICAgICBncmFwaGljcy5wb3NpdGlvbi55ID0gc2l6ZSAvIDI7XG4gICAgICAgICAgICAvLyBUaGUgb25seSBjb250cm9sIGFueW9uZSBoYXMgb3ZlciB0aGUgYXJyb3dzIGZyb20gdGhlIG1vZGVsIGlzXG4gICAgICAgICAgICAvLyB0aGVpciByb3RhdGlvbiBhbW91bnQsIHNvIHdlIGFsbG93IHVwZGF0aW5nIHRoYXQgcGFydC5cbiAgICAgICAgICAgIHVwZGF0ZSA9IChzcXVhcmU6IEFycm93U3F1YXJlVHlwZSkgPT4gKFxuICAgICAgICAgICAgICAgIGdyYXBoaWNzLnJvdGF0aW9uID0gTWF0aC5QSSAvIDIgKiBzcXVhcmUuYW5nbGUpXG4gICAgICAgICAgICAvLyBEbyB0aGUgaW5pdGlhbCByb3RhdGlvbiBhc3NpZ25tZW50IHRvIG1hdGNoIGN1cnJlbnQgc3F1YXJlIGRhdGEuXG4gICAgICAgICAgICB1cGRhdGUoc3F1YXJlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICAgICAgICB1cGRhdGU6IHVwZGF0ZSB8fCAoKCkgPT4gbnVsbClcbiAgICAgICAgfTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBCb2FyZCB9IGZyb20gJy4vYm9hcmQnO1xuaW1wb3J0IHsgUElYSVJlY3QgfSBmcm9tICcuLi9yZW5kZXJhYmxlL3NoYXBlcy9waXhpLXJlY3QnO1xuXG5pbXBvcnQgeyBDb29yZFV0aWxzIH0gZnJvbSAnLi4vdXRpbC9jb29yZC11dGlscyc7XG5cblxuLyoqXG4gKiBBIHJlbmRlcmFibGUgdGhhdCBjYW4gYmUgdXBkYXRlZCBmcm9tIGEgbW9kZWwgb2YgdHlwZSBULlxuICovXG5leHBvcnQgdHlwZSBVcGRhdGFibGVSZW5kZXJhYmxlPFQ+ID0ge1xuICAgIGNvbnRhaW5lcjogUElYSS5Db250YWluZXIsXG4gICAgdXBkYXRlOiAoVCkgPT4gdm9pZFxufVxuXG5cbi8qKlxuICogQW4gYWJzdHJhY3QgY2xhc3MgdGhhdCBtb3N0bHkga25vd3MgaG93IHRvIHJlbmRlciBgQm9hcmRgcy4gSXQncyBleHBlY3RlZFxuICogdGhhdCBhIHN1YmNsYXNzIHdpbGwgb3ZlcnJpZGUgYHJlbmRlclNxdWFyZWAgdG8gY29tcGxldGUgdGhlIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQm9hcmRSZW5kZXJlcjxUPiB7XG4gICAgcHJpdmF0ZSBib2FyZDogQm9hcmQ8VD47XG4gICAgcHJpdmF0ZSBzcXVhcmVTaXplOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBjbGlja0hhbmRsZXJzOiAoKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKVtdO1xuICAgIC8vIElmIGEgYm9hcmQgaGFzIGJlZW4gcmVuZGVyZWQsIHRoaXMgcHJvcGVydHkgY29udGFpbnMgdGhlIHRvcC1sZXZlbFxuICAgIC8vIGNvbnRhaW5lciBvZiB0aGF0IHJlbmRlcmluZy5cbiAgICBwcml2YXRlIHJlbmRlcmVkOiBQSVhJLkNvbnRhaW5lcjtcbiAgICAvLyBBbiBhcnJheSBvZiByZW5kZXJlZCBjaGlsZHJlbiwgd2hpY2ggY2FuIGJlIHVwZGF0ZWQgb24gZGVtYW5kLlxuICAgIHByaXZhdGUgcmVuZGVyZWRDaGlsZHJlbjogVXBkYXRhYmxlUmVuZGVyYWJsZTxUPltdO1xuXG4gICAgY29uc3RydWN0b3IoYm9hcmQ6IEJvYXJkPFQ+KSB7XG4gICAgICAgIHRoaXMuYm9hcmQgPSBib2FyZDtcbiAgICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gW107XG4gICAgICAgIHRoaXMuY2xpY2tIYW5kbGVycyA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbmRlciBhIGdpdmVuIHNxdWFyZSBhbmQgcmV0dXJucyBhbiBVcGRhdGFibGVSZW5kZXJlci5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgcmVuZGVyU3F1YXJlKHNxdWFyZTogVCwgc3F1YXJlU2l6ZTogbnVtYmVyKTpcbiAgICAgICAgVXBkYXRhYmxlUmVuZGVyYWJsZTxUPjtcblxuICAgIC8qKiBSZWdpc3RlcnMgYSBjbGljayBldmVudC4gKi9cbiAgICBvbkNsaWNrKGhhbmRsZXI6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLmNsaWNrSGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJucyB0aGUgc2l6ZSBvZiBhIHNpbmdsZSBzcXVhcmUuICovXG4gICAgZ2V0U3F1YXJlU2l6ZSgpIHsgcmV0dXJuIHRoaXMuc3F1YXJlU2l6ZTsgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgcmVuZGVyZWQgZ3JhcGhpYyBvZiBhIHNpbmdsZSBzcXVhcmUgYW5kIHJldHVybnMgdGhlIHRvcC1sZXZlbFxuICAgICAqIGNvbnRhaW5lci5cbiAgICAgKi9cbiAgICB1cGRhdGUoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBQSVhJLkNvbnRhaW5lciB7XG4gICAgICAgIGxldCBzcXVhcmVTaXplID0gdGhpcy5zcXVhcmVTaXplO1xuICAgICAgICBsZXQgaW5kZXggPSBDb29yZFV0aWxzLmNvb3JkVG9JbmRleChcbiAgICAgICAgICAgIHgsIHksIHRoaXMuYm9hcmQuZ2V0V2lkdGgoKSwgdGhpcy5ib2FyZC5nZXRIZWlnaHQoKSk7XG5cbiAgICAgICAgbGV0IGNhY2hlZCA9IHRoaXMucmVuZGVyZWRDaGlsZHJlbltpbmRleF07XG4gICAgICAgIGlmIChjYWNoZWQgPT0gbnVsbCB8fCBjYWNoZWQuY29udGFpbmVyID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgZXhpc3RzIGluIHRoZSBjYWNoZSwgc28gd2UgaGF2ZSB0byByZW5kZXIgaXQgbm93LlxuICAgICAgICAgICAgbGV0IHNxdWFyZUNvbnRhaW5lciA9IG5ldyBQSVhJLkNvbnRhaW5lcigpO1xuICAgICAgICAgICAgLy8gUmVuZGVyIGEgYmxhY2sgb3Igd2hpdGUgc3F1YXJlLlxuICAgICAgICAgICAgbGV0IHNxdWFyZVJlY3QgPSBuZXcgUElYSVJlY3Qoc3F1YXJlU2l6ZSwgc3F1YXJlU2l6ZSwge1xuICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogeCAlIDIgPT09IHkgJSAyID8gMHgwMDAwMDAgOiAweGZmZmZmZixcbiAgICAgICAgICAgICAgICBjb3JuZXJSYWRpdXM6IDB9KTtcbiAgICAgICAgICAgIHNxdWFyZUNvbnRhaW5lci5hZGRDaGlsZChzcXVhcmVSZWN0KTtcblxuICAgICAgICAgICAgLy8gUmVuZGVyIHRoZSBhY3R1YWwgc3F1YXJlIGdyYXBoaWMuXG4gICAgICAgICAgICBsZXQgdXBkYXRlID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZW5kZXJlZFNxdWFyZSA9IHRoaXMucmVuZGVyU3F1YXJlKFxuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmQuZ2V0KHgsIHkpLCBzcXVhcmVTaXplKTtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlZFNxdWFyZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgc29tZXRoaW5nIHdhcyByZW5kZXJlZCwgbWFwIHRoZSB1cGRhdGUgbWV0aG9kIGFuZCBhZGQgdGhlXG4gICAgICAgICAgICAgICAgLy8gY29udGFpbmVyIHRvIG91ciBzcXVhcmUncyBjb250YWluZXIuXG4gICAgICAgICAgICAgICAgc3F1YXJlQ29udGFpbmVyLmFkZENoaWxkKHJlbmRlcmVkU3F1YXJlLmNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgdXBkYXRlID0gcmVuZGVyZWRTcXVhcmUudXBkYXRlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBub3RoaW5nIHdhcyByZW5kZXJlZCwgd2UgbmVlZCB0byBlbnN1cmUgdGhhdCB0aGUgdXBkYXRlXG4gICAgICAgICAgICAgICAgLy8gbWV0aG9kIGlzIG5vdCBudWxsLlxuICAgICAgICAgICAgICAgIHVwZGF0ZSA9ICgpID0+IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSZWdpc3RlciBmb3IgY2xpY2sgZXZlbnRzLlxuICAgICAgICAgICAgc3F1YXJlQ29udGFpbmVyLmludGVyYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIHNxdWFyZUNvbnRhaW5lci5vbigncG9pbnRlcmRvd24nLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNsaWNrSGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGlja0hhbmRsZXJzW2ldKHgsIHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2FjaGVkID0ge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogc3F1YXJlQ29udGFpbmVyLFxuICAgICAgICAgICAgICAgIHVwZGF0ZTogdXBkYXRlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgcmVuZGVyZWQgc3F1YXJlIGFscmVhZHkgZXhpc3RzLCB1cGRhdGUgaXQuXG4gICAgICAgICAgICBjYWNoZWQudXBkYXRlKHRoaXMuYm9hcmQuZ2V0KHgsIHkpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW5baW5kZXhdID0gY2FjaGVkO1xuICAgICAgICByZXR1cm4gY2FjaGVkLmNvbnRhaW5lcjtcbiAgICB9XG5cbiAgICAvKiogVXBkYXRlcyBhbGwgdGhlIHNxdWFyZXMgb24gdGhlIGJvYXJkLiAqL1xuICAgIHVwZGF0ZUFsbCgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gdGhpcy5yZW5kZXJlZENoaWxkcmVuIHx8IFtdO1xuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMuYm9hcmQuZ2V0SGVpZ2h0KCk7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLmJvYXJkLmdldFdpZHRoKCk7IHgrKykge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYXJzIGFsbCByZW5kZXIgY2FjaGUsIGNhdXNpbmcgdGhlIG5leHQgcmVuZGVyIGNhbGwgdG8gcmV0dXJuIGEgZnJlc2hcbiAgICAgKiBuZXcgY29udGFpbmVyLlxuICAgICAqL1xuICAgIGNsZWFyUmVuZGVyZWQoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZWQgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdGhpcy5zcXVhcmVTaXplID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBib2FyZCBpbnRvIGEgdmlldyBvZiB0aGUgZ2l2ZW4gc2l6ZS5cbiAgICAgKi9cbiAgICByZW5kZXIodmlld1dpZHRoOiBudW1iZXIsIHZpZXdIZWlnaHQ6IG51bWJlcik6IFBJWEkuQ29udGFpbmVyIHtcbiAgICAgICAgaWYgKHRoaXMucmVuZGVyZWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IGJvYXJkID0gdGhpcy5ib2FyZDtcbiAgICAgICAgICAgIGxldCBjb250YWluZXIgPSBuZXcgUElYSS5Db250YWluZXIoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZWQgPSBjb250YWluZXI7XG4gICAgICAgICAgICBsZXQgYm9hcmRXaWR0aCA9IGJvYXJkLmdldFdpZHRoKCksXG4gICAgICAgICAgICAgICAgYm9hcmRIZWlnaHQgPSBib2FyZC5nZXRIZWlnaHQoKTtcbiAgICAgICAgICAgIGxldCBzcXVhcmVTaXplID0gTWF0aC5mbG9vcihNYXRoLm1pbih2aWV3V2lkdGggLyBib2FyZFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdIZWlnaHQgLyBib2FyZEhlaWdodCkpO1xuICAgICAgICAgICAgdGhpcy5zcXVhcmVTaXplID0gc3F1YXJlU2l6ZTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZWRDaGlsZHJlbiA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBib2FyZEhlaWdodDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBib2FyZFdpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNxdWFyZUNvbnRhaW5lciA9IHRoaXMudXBkYXRlKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc2NyZWVuWCA9IHggKiBzcXVhcmVTaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyZWVuWSA9IHkgKiBzcXVhcmVTaXplO1xuICAgICAgICAgICAgICAgICAgICBzcXVhcmVDb250YWluZXIucG9zaXRpb24ueCA9IHNjcmVlblg7XG4gICAgICAgICAgICAgICAgICAgIHNxdWFyZUNvbnRhaW5lci5wb3NpdGlvbi55ID0gc2NyZWVuWTtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFkZENoaWxkKHNxdWFyZUNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlcmVkO1xuICAgIH1cbn07XG4iLCJpbXBvcnQgeyBDb29yZFV0aWxzIH0gZnJvbSAnLi4vdXRpbC9jb29yZC11dGlscyc7XG5cbmV4cG9ydCB0eXBlIEJvYXJkU3F1YXJlSW5pdGlhbGl6ZXI8VD4gPSAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IFQ7XG5cbi8qKlxuICogVGhpcyBjbGFzcyByZXByZXNlbnRzIGEgYm9hcmQgb2YgYHdpZHRoYHhgaGVpZ2h0YCBkaW1lbnNpb25zLiBUaGUgdHlwZSBvZlxuICogdGhpbmdzIGNvbnRhaW5lZCBvbiB0aGUgYm9hcmQgaXMgb2YgdGhlIHBhcmFtZXRlciBgVGAuXG4gKi9cbmV4cG9ydCBjbGFzcyBCb2FyZDxUPiB7XG4gICAgcHJpdmF0ZSB3aWR0aDogbnVtYmVyO1xuICAgIHByaXZhdGUgaGVpZ2h0OiBudW1iZXI7XG4gICAgcHJpdmF0ZSBib2FyZDogVFtdO1xuXG4gICAgY29uc3RydWN0b3Iod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXI6IEJvYXJkU3F1YXJlSW5pdGlhbGl6ZXI8VD4gPSBudWxsKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuYm9hcmQgPSB0aGlzLmluaXRpYWxpemVCb2FyZEFycmF5KHdpZHRoLCBoZWlnaHQsIGluaXRpYWxpemVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyBhbiBhcnJheSB0aGF0IGNhbiBpbnRlcm5hbGx5IGJlIHVzZWQgZm9yIGEgYm9hcmQuIE9wdGlvbmFsbHlcbiAgICAgKiB0YWtlcyBhbiBpbml0aWFsaXplci4gSWYgb25lIGlzIG5vdCBzcGVjaWZpZWQsIGFsbCBzcXVhcmVzIGFyZVxuICAgICAqIGluaXRpYWxpemVkIHRvIG51bGwuXG4gICAgICovXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplQm9hcmRBcnJheShcbiAgICAgICAgICAgIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLFxuICAgICAgICAgICAgaW5pdGlhbGl6ZXI6IEJvYXJkU3F1YXJlSW5pdGlhbGl6ZXI8VD4gPSBudWxsKSB7XG4gICAgICAgIGxldCBib2FyZEFycmF5OiBUW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgYm9hcmRBcnJheS5wdXNoKGluaXRpYWxpemVyICE9IG51bGwgPyBpbml0aWFsaXplcih4LCB5KSA6IG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBib2FyZEFycmF5O1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIHRoZSB3aWR0aCBvZiB0aGUgYm9hcmQuICovXG4gICAgZ2V0V2lkdGgoKSAgeyByZXR1cm4gdGhpcy53aWR0aDsgfVxuICAgIC8qKiBSZXR1cm5zIHRoZSBoZWlnaHQgb2YgdGhlIGJvYXJkLiAqL1xuICAgIGdldEhlaWdodCgpIHsgcmV0dXJuIHRoaXMuaGVpZ2h0OyB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyBvdmVyIGFsbCBjb29yZGluYXRlcywgY2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uLCBhbmQgdXBkYXRlcyB0aGVcbiAgICAgKiBib2FyZCB3aXRoIHRoZSByZXN1bHQuXG4gICAgICogVE9ETzogQ291bGQgYmUgZXh0ZW5kZWQgdG8gb3B0aW9uYWxseSByZXR1cm4gYSBuZXcgYm9hcmQuXG4gICAgICovXG4gICAgbWFwKGY6ICh2YWx1ZTogVCwgeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IFQpOiBCb2FyZDxUPiB7XG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy5oZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLndpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBsZXQgb2xkVmFsdWU6IFQgPSB0aGlzLmdldCh4LCB5KTtcbiAgICAgICAgICAgICAgICBsZXQgbmV3VmFsdWU6IFQgPSBmKG9sZFZhbHVlLCB4LCB5KTtcbiAgICAgICAgICAgICAgICB0aGlzLnB1dChuZXdWYWx1ZSwgeCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIFB1dHMgYSB2YWx1ZSBpbnRvIHRoZSBzcXVhcmUgYXQgdGhlIGdpdmVuIGNvb3JkaW5hdGUuICovXG4gICAgcHV0KHZhbHVlOiBULCB4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICBsZXQgaW5kZXggPSBDb29yZFV0aWxzLmNvb3JkVG9JbmRleCh4LCB5LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYm9hcmRbaW5kZXhdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIHNxdWFyZSBhdCB0aGUgZ2l2ZW4gY29vcmRpbmF0ZS4gKi9cbiAgICBnZXQoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gQ29vcmRVdGlscy5jb29yZFRvSW5kZXgoXG4gICAgICAgICAgICB4LCB5LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgZmFsc2UpO1xuICAgICAgICBpZiAoaW5kZXggPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiB0aGlzLmJvYXJkW2luZGV4XTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBBcnJvd1NxdWFyZVR5cGUgfSBmcm9tICcuLi9hcnJvd3MvYXJyb3dzJztcbmltcG9ydCB7IEJvYXJkIH0gZnJvbSAnLi4vYm9hcmQvYm9hcmQnO1xuaW1wb3J0IHsgQ2hlY2tlciB9IGZyb20gJy4vY2hlY2tlcic7XG5cbmltcG9ydCB7IEF1ZGlvLCBTb3VuZHMgfSBmcm9tICcuLi91dGlsL2F1ZGlvJztcblxuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCBjb250cm9scyB0aGUgbW92ZW1lbnQgb2YgdGhlIGBDaGVja2VyYC4gRXNzZW50aWFsbHksIHRoaXMgaXMgdGhlXG4gKiBjbGFzcyB0aGF0IGltcGxlbWVudCB0aGUgbG9naWMgb2YgdGhlIGN5Y2xlLWRldGVjdGluZyBhbGdvcml0aG0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGVja2VyQ29udHJvbGxlciB7XG4gICAgcHJpdmF0ZSBib2FyZDogQm9hcmQ8QXJyb3dTcXVhcmVUeXBlPjtcbiAgICBwcml2YXRlIGNoZWNrZXI6IENoZWNrZXI7XG5cbiAgICAvLyBBbGdvcml0aG0gcHJvcGVydGllc1xuICAgIC8vIFdoZXRoZXIgd2Ugc2hvdWxkIHJ1biB0aGUgY29uc3RhbnQgbWVtb3J5IGFsZ29yaXRobS5cbiAgICBwcml2YXRlIGNvbnN0YW50TWVtb3J5OiBib29sZWFuO1xuICAgIC8vIFdoZXRoZXIgd2UgaGF2ZSBkZXRlY3RlZCBhIGN5Y2xlLlxuICAgIHByaXZhdGUgZGV0ZWN0ZWRDeWNsZTogYm9vbGVhbjtcbiAgICAvLyBXaGV0aGVyIHdlIGhhdmUgZGV0ZWN0ZWQgdGhhdCB3ZSB3ZW50IG9mZiBlZGdlLlxuICAgIHByaXZhdGUgZGV0ZWN0ZWRPZmZFZGdlOiBib29sZWFuO1xuICAgIC8vIEZvciB0aGUgbm9uLWNvbnN0YW50IG1lbW9yeSBhbGdvcml0aG0sIGtlZXBzIHRyYWNrIG9mIHNxdWFyZXMgdGhhdCB0aGlzXG4gICAgLy8gY2hlY2tlciBoYXMgYmVlbiBvbi5cbiAgICBwcml2YXRlIHZpc2l0ZWQ6IHtba2V5OiBzdHJpbmddOiBib29sZWFufTtcbiAgICAvLyBUaGUgXCJoYXJlXCIgb2YgRmxveWQncyBhbGdvcml0aG0uIEEgcG9pbnQgdGhhdCBtb3ZlcyB0d2ljZSBhcyBmYXN0IGFjcm9zc1xuICAgIC8vIHRoZSBib2FyZCBhcyB0aGUgY2hlY2tlciAod2hpY2ggbWFrZXMgdGhlIGNoZWNrZXIgdGhlIHRvcnRvaXNlKS4gSWYgdGhlXG4gICAgLy8gaGFyZSBhbmQgdHVydGxlIGV2ZXIgZW5kIHVwIG9uIHRoZSBzYW1lIHNwb3QsIHRoZXJlIGlzIGEgY3ljbGUuXG4gICAgcHJpdmF0ZSBoYXJlOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xuXG4gICAgY29uc3RydWN0b3IoYm9hcmQ6IEJvYXJkPEFycm93U3F1YXJlVHlwZT4sXG4gICAgICAgICAgICAgICAgY2hlY2tlcjogQ2hlY2tlcixcbiAgICAgICAgICAgICAgICBjb25zdGFudE1lbW9yeTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuYm9hcmQgPSBib2FyZDtcbiAgICAgICAgdGhpcy5jaGVja2VyID0gY2hlY2tlcjtcbiAgICAgICAgdGhpcy5yZXNldChjb25zdGFudE1lbW9yeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIGl0IGhhcyBiZWVuIGlkZW50aWZpZWQgdGhhdCB0aGlzIGNoZWNrZXIgaXMgaW4gYSBjeWNsZS5cbiAgICAgKi9cbiAgICBoYXNEZXRlY3RlZEN5Y2xlKCkgeyByZXR1cm4gdGhpcy5kZXRlY3RlZEN5Y2xlOyB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIG5leHQgbW92ZSB3b3VsZCBtb3ZlIHRoZSBjaGVja2VyIG9mZiB0aGUgZWRnZSBvZiB0aGVcbiAgICAgKiBib2FyZC5cbiAgICAgKi9cbiAgICBoYXNEZXRlY3RlZEVkZ2UoKSB7IHJldHVybiB0aGlzLmRldGVjdGVkT2ZmRWRnZTsgfVxuXG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBjeWNsZS9lZGdlIHRyYWNraW5nLCBhcyB3ZWxsIGFzIHRoZSBhbGdvcml0aG0gdGhhdCBzaG91bGQgYmVcbiAgICAgKiB1c2VkXG4gICAgICovXG4gICAgcmVzZXQoY29uc3RhbnRNZW1vcnk6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICB0aGlzLmNvbnN0YW50TWVtb3J5ID0gY29uc3RhbnRNZW1vcnk7XG4gICAgICAgIHRoaXMuZGV0ZWN0ZWRDeWNsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRldGVjdGVkT2ZmRWRnZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnZpc2l0ZWQgPSB7fTtcbiAgICAgICAgdGhpcy5oYXJlID0gdGhpcy5jaGVja2VyLmdldFBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBwb3NpdGlvbiBvZmZzZXQsIHNldHMgdXAgdGhlIGNoZWNrZXIgc28gdGhhdCBpdCB3aWxsIGFuaW1hdGUgdG9cbiAgICAgKiB0aGUgc3F1YXJlIGluIHRoYXQgZGlyZWN0aW9uLlxuICAgICAqL1xuICAgIHByaXZhdGUgbW92ZShkeDogbnVtYmVyLCBkeTogbnVtYmVyKSB7XG4gICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuY2hlY2tlci5nZXRQb3NpdGlvbigpO1xuICAgICAgICBsZXQgbnggPSBwb3NpdGlvbi54ICsgZHgsXG4gICAgICAgICAgICBueSA9IHBvc2l0aW9uLnkgKyBkeTtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnN0YW50TWVtb3J5KSB7XG4gICAgICAgICAgICAvLyBUaGUgbm9uLWNvbnN0YW50IG1lbW9yeSBhbGdvcml0aG0uIEtlZXBzIGEgaGFzaG1hcCBvZiB2aXNpdGVkXG4gICAgICAgICAgICAvLyBwb3NpdGlvbnMgYW5kIGNoZWNrcyB3aGV0aGVyIHRoZSBuZXh0IHBvc2l0aW9uIHdhcyB2aXNpdGVkLlxuICAgICAgICAgICAgLy8gVGhlIG1lbW9yeSBjb21wbGV4aXR5IGlzIE8oTSksIHdoZXJlIE0gaXMgdGhlIHdpZHRoICogaGVpZ2h0IG9mXG4gICAgICAgICAgICAvLyB0aGUgYm9hcmQuXG4gICAgICAgICAgICAvLyBUaGVyZSBleGlzdHMgYW5vdGhlciBhbGdvcml0aG0sIHdoZXJlIG9uZSB3b3VsZCBrZWVwIGEgbGlzdCBvZlxuICAgICAgICAgICAgLy8gYWxsIHZpc2l0ZWQgbG9jYXRpb25zIGFuZCBjb21wYXJlIGFnYWluc3QgdGhhdC4gVGhlIG1lbW9yeVxuICAgICAgICAgICAgLy8gY29tcGxleGl0eSBvZiB0aGF0IGFsZ29yaXRobSB3b3VsZCBiZSBPKE4pIHdoZXJlIE4gd291bGQgYmUgdGhlXG4gICAgICAgICAgICAvLyBudW1iZXIgb2YgbW92ZXMgbWFkZS5cbiAgICAgICAgICAgIGxldCBwb3NpdGlvbktleSA9IG54ICsgJy8nICsgbnk7XG4gICAgICAgICAgICBpZiAodGhpcy52aXNpdGVkW3Bvc2l0aW9uS2V5XSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRDeWNsZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnZpc2l0ZWRbcG9zaXRpb25LZXldID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEEgXCJjb25zdGFudCBtZW1vcnlcIiBhbGdvcml0aG0uIElmIHdlJ3ZlIG1hZGUgbW9yZSBtb3ZlcyB0aGFuXG4gICAgICAgICAgICAvLyB0aGVyZSBhcmUgc3F1YXJlcyBvbiB0aGUgYm9hcmQgYW5kIGhhdmUgbm90IGVuY291bnRlcmVkIGFuIGVkZ2UsXG4gICAgICAgICAgICAvLyB0aGVuIHRoZXJlIGlzIGEgY3ljbGUuIFRoZSBvYnZpb3VzIHRyYWRlLW9mZiBoZXJlIGlzIHRoYXQgd2VcbiAgICAgICAgICAgIC8vIGRvbid0IGZpbmQgb3V0IGFib3V0IHRoZSBjeWNsZSB1bnRpbCBtdWNoIGxhdGVyIHRoYW4gb3RoZXJ3aXNlLlxuICAgICAgICAgICAgLy8gbGV0IGJvYXJkID0gdGhpcy5jaGVja2VyLmdldEJvYXJkKCk7XG4gICAgICAgICAgICAvLyBpZiAoIXRoaXMuZGV0ZWN0ZWRPZmZFZGdlICYmXG4gICAgICAgICAgICAvLyAgICAgICAgIHRoaXMubW92ZXNNYWRlID4gYm9hcmQuZ2V0V2lkdGgoKSAqIGJvYXJkLmdldEhlaWdodCgpKSB7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5kZXRlY3RlZEN5Y2xlID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLy8gRmx5bm4ncyB0dXJ0bGUvaGFyZSBhbGdvcml0aG0uXG4gICAgICAgICAgICAvLyBGb3IgZXZlcnkgb25lIHR1cnRsZSBtb3ZlLCB3ZSBtYWtlIHR3byBoYXJlIG1vdmVzLlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgaGFyZVNxdWFyZURpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uT2ZCb2FyZFNxdWFyZShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXJlLngsIHRoaXMuaGFyZS55KTtcbiAgICAgICAgICAgICAgICBpZiAoaGFyZVNxdWFyZURpcmVjdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRPZmZFZGdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXJlLnggKz0gaGFyZVNxdWFyZURpcmVjdGlvbi5keDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXJlLnkgKz0gaGFyZVNxdWFyZURpcmVjdGlvbi5keTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFyZS54ID09PSBwb3NpdGlvbi54ICYmIHRoaXMuaGFyZS55ID09PSBwb3NpdGlvbi55KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRDeWNsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmJvYXJkLmdldChueCwgbnkpICE9IG51bGwpIHtcbiAgICAgICAgICAgIEF1ZGlvLnBsYXkoU291bmRzLlBMT1ApO1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyLnNldFBvc2l0aW9uKG54LCBueSk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrZXIuc2V0T2Zmc2V0KC1keCwgLWR5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRPZmZFZGdlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vZGlmaWVzIHRoZSBvZmZzZXQgc3VjaCB0aGF0IGl0IGFwcHJvYWNoZXMgMCwgd2hpY2ggbWFrZXMgaXQgYXBwZWFyIGxpa2VcbiAgICAgKiB0aGUgYENoZWNrZXJgIGlzIG1vdmluZyB0b3dhcmRzIGl0cyBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSBjaGVja2VyIGhhcyBzdG9wcGVkIG1vdmluZy5cbiAgICAgKi9cbiAgICBwcml2YXRlIGFuaW1hdGVUb3dhcmRzUG9zaXRpb24oKTogYm9vbGVhbiB7XG4gICAgICAgIGxldCBmcmljdGlvbiA9IDAuOTtcbiAgICAgICAgbGV0IHN0b3BUaHJlc2hvbGQgPSAwLjAzO1xuICAgICAgICBsZXQgb2Zmc2V0ID0gdGhpcy5jaGVja2VyLmdldE9mZnNldCgpO1xuICAgICAgICBpZiAob2Zmc2V0LnggIT09IDApIHtcbiAgICAgICAgICAgIG9mZnNldC54ICo9IGZyaWN0aW9uO1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKG9mZnNldC54KSA8IHN0b3BUaHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBvZmZzZXQueCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9mZnNldC55ICE9PSAwKSB7XG4gICAgICAgICAgICBvZmZzZXQueSAqPSBmcmljdGlvbjtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhvZmZzZXQueSkgPCBzdG9wVGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0LnkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2hlY2tlci5zZXRPZmZzZXQob2Zmc2V0LngsIG9mZnNldC55KTtcbiAgICAgICAgcmV0dXJuIG9mZnNldC54ID09PSAwICYmIG9mZnNldC55ID09PSAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB2ZWN0b3IgcmVwcmVzZW50aW5nIHRoZSBkaXJlY3Rpb24gdGhhdCB0aGUgYXJyb3cgb24gdGhlIGdpdmVuXG4gICAgICogc3F1YXJlIGlzIHBvaW50aW5nLiBNYXkgcmV0dXJuIG51bGwgaWYgbm8gc3F1YXJlIGV4aXN0cyBhbmQgdGhlIGdpdmVuXG4gICAgICogY29vcmRpbmF0ZS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGdldERpcmVjdGlvbk9mQm9hcmRTcXVhcmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAgICAgbGV0IHNxdWFyZTogQXJyb3dTcXVhcmVUeXBlID0gdGhpcy5ib2FyZC5nZXQoeCwgeSk7XG4gICAgICAgIGlmIChzcXVhcmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IGFuZ2xlID0gTWF0aC5yb3VuZChzcXVhcmUuYW5nbGUpICUgNDtcbiAgICAgICAgICAgIGlmIChhbmdsZSA8IDApIGFuZ2xlICs9IDQ7XG4gICAgICAgICAgICBsZXQgbW92ZW1lbnRzID0gW3t4OiAxfSwge3k6IDF9LCB7eDogLTF9LCB7eTogLTF9XTtcbiAgICAgICAgICAgIGxldCBtb3ZlbWVudCA9IG1vdmVtZW50c1thbmdsZV07XG4gICAgICAgICAgICByZXR1cm4ge2R4OiBtb3ZlbWVudFsneCddIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIGR5OiBtb3ZlbWVudFsneSddIHx8IDB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFuaW1hdGVzIHRoZSBjaGVja2VyIGFuZCBzY2hlZHVsZXMgdGhlIG5leHQgbW92ZS5cbiAgICAgKi9cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmFuaW1hdGVUb3dhcmRzUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5jaGVja2VyLmdldFBvc2l0aW9uKCk7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBjaGVja2VyIGhhcyBzdG9wcGVkLCBtb3ZlIGl0IHRvIHRoZSBuZXh0IHNxdWFyZS5cbiAgICAgICAgICAgIGxldCBzcXVhcmVEaXJlY3Rpb24gPSB0aGlzLmdldERpcmVjdGlvbk9mQm9hcmRTcXVhcmUoXG4gICAgICAgICAgICAgICAgcG9zaXRpb24ueCwgcG9zaXRpb24ueSk7XG4gICAgICAgICAgICBpZiAoc3F1YXJlRGlyZWN0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmUoc3F1YXJlRGlyZWN0aW9uLmR4LCBzcXVhcmVEaXJlY3Rpb24uZHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ2hlY2tlciB9IGZyb20gJy4vY2hlY2tlcic7XG5cblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgaXMgY2FwYWJsZSBvZiByZW5kZXJpbmcgYSBjaGVja2VyIG9uIGl0cyBib2FyZC4gSXQgaXMgZXhwZWN0ZWRcbiAqIHRoYXQgdGhlIHNxdWFyZVNpemUgaXMgcGFzc2VkIHRvIHRoZSByZW5kZXIgZnVuY3Rpb24uXG4gKiBUbyBjaGFuZ2UgdGhlIHNxdWFyZSBzaXplIGFmdGVyIHRoZSBmYWN0LCBgc2V0U3F1YXJlU2l6ZWAgbWF5IGJlIHVzZWQsIGFuZFxuICogdGhlIHBvc2l0aW9uIGFuZCBzaXplIG9mIHRoZSBjaGVja2VyIHdpbGwgYmUgaW1tZWRpYXRlbHkgdXBkYXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIENoZWNrZXJSZW5kZXJlciB7XG4gICAgcHJpdmF0ZSBjaGVja2VyOiBDaGVja2VyO1xuXG4gICAgLy8gUmVuZGVyIHByb3BlcnRpZXNcbiAgICBwcml2YXRlIHJlbmRlcmVkOiBQSVhJLkNvbnRhaW5lcjtcbiAgICBwcml2YXRlIHNxdWFyZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKGNoZWNrZXI6IENoZWNrZXIpIHtcbiAgICAgICAgdGhpcy5jaGVja2VyID0gY2hlY2tlcjtcbiAgICAgICAgdGhpcy5yZW5kZXJlZCA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqIFNldHMgdGhlIHNxdWFyZSBzaXplIG9mIHRoZSBib2FyZCB0aGlzIGNoZWNrZXIgaXMgb24uICovXG4gICAgc2V0U3F1YXJlU2l6ZShuZXdTcXVhcmVTaXplOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5zcXVhcmVTaXplID0gbmV3U3F1YXJlU2l6ZTtcbiAgICAgICAgdGhpcy5yZXJlbmRlcigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHRoaXMgcmVuZGVyZXIgaGFzIHJlbmRlcmVkIHRoZSBjaGVja2VyLCB0aGlzIHdpbGwgcmV0dXJuIHRoZSB0b3AtbGV2ZWxcbiAgICAgKiBQSVhJIGNvbnRhaW5lciB0aGF0IGhhcyBpdC4gT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiBudWxsLlxuICAgICAqL1xuICAgIGdldFJlbmRlcmVkKCk6IFBJWEkuQ29udGFpbmVyIHsgcmV0dXJuIHRoaXMucmVuZGVyZWQ7IH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyB0aGUgcGF0aCB1c2VkIHRvIHJlcHJlc2VudCB0aGUgY2hlY2tlciBhbmQgcG9zaXRpb25zIGl0IGluIHRoZVxuICAgICAqIG1pZGRsZSBvZiBpdHMgY29udGFpbmVyLCB3aGljaCBzaG91bGQgYmUgb2Ygc2l6ZSBgc3F1YXJlU2l6ZWAuXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZEdyYXBoaWNzKCkge1xuICAgICAgICBsZXQgaGFsZlNxdWFyZVNpemUgPSB0aGlzLnNxdWFyZVNpemUgLyAyO1xuICAgICAgICBsZXQgcmFkaXVzID0gaGFsZlNxdWFyZVNpemUgKiAwLjY7XG5cbiAgICAgICAgbGV0IGNvbG9ycyA9IFsweERBMTQzNCwgMHhGQjQ0MzRdO1xuICAgICAgICBsZXQgZyA9IG5ldyBQSVhJLkdyYXBoaWNzKCk7XG4gICAgICAgIGcuYmVnaW5GaWxsKGNvbG9yc1swXSk7XG4gICAgICAgIGcuZHJhd0NpcmNsZShoYWxmU3F1YXJlU2l6ZSwgaGFsZlNxdWFyZVNpemUsIHJhZGl1cyk7XG5cbiAgICAgICAgbGV0IGlubmVyUmluZyA9IDAuMjtcbiAgICAgICAgbGV0IHJpbmdzID0gTWF0aC5mbG9vcihoYWxmU3F1YXJlU2l6ZSAvIDUpO1xuICAgICAgICBmb3IgKGxldCByaW5nID0gMTsgcmluZyA8IHJpbmdzOyByaW5nKyspIHtcbiAgICAgICAgICAgIGcuYmVnaW5GaWxsKGNvbG9yc1tyaW5nICUgY29sb3JzLmxlbmd0aF0pO1xuICAgICAgICAgICAgZy5kcmF3Q2lyY2xlKGhhbGZTcXVhcmVTaXplLCBoYWxmU3F1YXJlU2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAocmFkaXVzIC0gaW5uZXJSaW5nKSAqIChyaW5ncyAtIHJpbmcpL3JpbmdzICsgaW5uZXJSaW5nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhcnMgZXZlcnl0aGluZyBmcm9tIHRoZSByZW5kZXJlZCBjb250YWluZXIsIGFuZCByZXJlbmRlcnMgdGhlXG4gICAgICogZ3JhcGhpY3MuXG4gICAgICovXG4gICAgcHJpdmF0ZSByZXJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlZC5yZW1vdmVDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLnJlbmRlcmVkLmFkZENoaWxkKHRoaXMuYnVpbGRHcmFwaGljcygpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZ3JhcGhpY3MgYmFzZWQgb24gdGhlIHVwZGF0ZWQgYENoZWNrZXJgXG4gICAgICogcG9zaXRpb24uXG4gICAgICovXG4gICAgdXBkYXRlKCkge1xuICAgICAgICBpZiAodGhpcy5yZW5kZXJlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmNoZWNrZXIuZ2V0T2Zmc2V0UG9zaXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZWQucG9zaXRpb24ueCA9IHRoaXMuc3F1YXJlU2l6ZSAqIHBvc2l0aW9uLng7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVkLnBvc2l0aW9uLnkgPSB0aGlzLnNxdWFyZVNpemUgKiBwb3NpdGlvbi55O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBzcXVhcmUgc2l6ZSwgcmVuZGVycyB0aGUgY2hlY2tlciBhbmQgcmV0dXJucyBhbiBlbGVtZW50IHRoYXRcbiAgICAgKiBjb250YWlucyBpdC5cbiAgICAgKi9cbiAgICByZW5kZXIoc3F1YXJlU2l6ZTogbnVtYmVyKTogUElYSS5Db250YWluZXIge1xuICAgICAgICBpZiAodGhpcy5yZW5kZXJlZCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnNxdWFyZVNpemUgPSBzcXVhcmVTaXplO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlZCA9IG5ldyBQSVhJLkNvbnRhaW5lcigpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlZC5hZGRDaGlsZCh0aGlzLmJ1aWxkR3JhcGhpY3MoKSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlcmVkO1xuICAgIH1cbn1cbiIsIi8qKlxuICogUmVwcmVzZW50cyB0aGUgY2hlY2tlciBhdCBzb21lIHBvc2l0aW9uIG9uIHRoZSBib2FyZC4gYHhgIGFuZCBgeWAgc2hvdWxkIGJlXG4gKiBpbnRlZ2VycyB0aGF0IHRvZ2V0aGVyIGZvcm0gdGhlIGNvb3JkaW5hdGUgb2YgdGhlIHNxdWFyZSBvbiB0aGUgYEJvYXJkYC5cbiAqL1xuZXhwb3J0IGNsYXNzIENoZWNrZXIge1xuICAgIC8vIFRoZSBgeGAgYW5kIGB5YCBjb21wb25lbnRzIG9mIHRoZSBjb29yZGluYXRlIG9mIHRoZSBsb2NhdGlvbiBvZiB0aGlzXG4gICAgLy8gYENoZWNrZXJgIG9uIGEgYEJvYXJkYC5cbiAgICBwcml2YXRlIHg6IG51bWJlcjtcbiAgICBwcml2YXRlIHk6IG51bWJlcjtcbiAgICAvLyBBIGZsb2F0aW5nIHBvaW50IG9mZnNldCB0aGF0IGlzIHVzZWQgdG8gYW5pbWF0ZSB0aGUgY2hlY2tlciB0byBpdHMgbmV3XG4gICAgLy8gcG9zaXRpb24uIEJvdGggYHhgIGFuZCBgeWAgc2hvdWxkIGJlIGJldHdlZW4gLTEgYW5kIDEuXG4gICAgcHJpdmF0ZSBvZmZzZXQ6IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG5cbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICB0aGlzLnggPSB4fDA7XG4gICAgICAgIHRoaXMueSA9IHl8MDtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7eDogMCwgeTogMH07XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgdGhlIHBvc2l0aW9uIG9mIHRoaXMgY2hlY2tlci4gKi9cbiAgICBnZXRQb3NpdGlvbigpIHsgcmV0dXJuIHt4OiB0aGlzLngsIHk6IHRoaXMueX07IH1cblxuICAgIC8qKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGlzIGBDaGVja2VyYCBvbiBhIGBCb2FyZGAuICovXG4gICAgc2V0UG9zaXRpb24oeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy54ID0geHwwO1xuICAgICAgICB0aGlzLnkgPSB5fDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIHRoZSBmbG9hdGluZyBwb2ludCBvZmZzZXQgb2YgdGhpcyBgQ2hlY2tlcmAuICovXG4gICAgZ2V0T2Zmc2V0KCk6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0ge1xuICAgICAgICByZXR1cm4ge3g6IHRoaXMub2Zmc2V0LngsIHk6IHRoaXMub2Zmc2V0Lnl9O1xuICAgIH1cblxuICAgIC8qKiBTZXRzIHRoZSBmbG9hdGluZyBwb2ludCBvZmZzZXQgb2YgdGhpcyBgQ2hlY2tlcmAuICovXG4gICAgc2V0T2Zmc2V0KGR4OiBudW1iZXIsIGR5OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5vZmZzZXQueCA9IGR4O1xuICAgICAgICB0aGlzLm9mZnNldC55ID0gZHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIHRoZSBzdW0gb2YgdGhlIHBvc2l0aW9uIGFuZCB0aGUgb2Zmc2V0LiAqL1xuICAgIGdldE9mZnNldFBvc2l0aW9uKCk6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0ge1xuICAgICAgICByZXR1cm4ge3g6IHRoaXMueCArIHRoaXMub2Zmc2V0LngsXG4gICAgICAgICAgICAgICAgeTogdGhpcy55ICsgdGhpcy5vZmZzZXQueX07XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiIC8+XG5cbmltcG9ydCB7IFdvcmxkIH0gZnJvbSAnLi93b3JsZCc7XG5cbi8vIENyZWF0ZSB0aGUgd29ybGRcbmxldCB3b3JsZCA9IG5ldyBXb3JsZCgpO1xuXG5sZXQgc3RhcnRMb29wID0gZnVuY3Rpb24oZikge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHsgc3RhcnRMb29wKGYpOyB9KTtcbiAgICBmKCk7XG59O1xuXG5zdGFydExvb3AoZnVuY3Rpb24oKSB7XG4gICAgd29ybGQudXBkYXRlKCk7XG4gICAgd29ybGQucmVuZGVyKCk7XG59KTtcbiIsIi8qKlxuICogVGhlIHJlbmRlcmluZyBwYXJhbWV0ZXJzIG9mIGEgUElYSVJlY3QuXG4gKi9cbnR5cGUgUElYSVJlY3RSZW5kZXJpbmdQYXJhbWV0ZXJzID0ge1xuICAgIC8vIFRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHRoZSByZWN0YW5nbGUuXG4gICAgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgLy8gVGhlIHJhZGl1cyBvZiB0aGUgY29ybmVycywgb3IgMC5cbiAgICBjb3JuZXJSYWRpdXM6IG51bWJlcixcbiAgICAvLyBUaGUgZmlsbCBjb2xvciBhcyBhIG51bWJlci4gaS5lLiAweEZGMDAwMCBmb3IgcmVkLlxuICAgIGZpbGxDb2xvcjogbnVtYmVyLFxuICAgIC8vIFRoZSBzdHJva2UgY29sb3IgYXMgYSBudW1iZXIuXG4gICAgc3Ryb2tlQ29sb3I6IG51bWJlcixcbiAgICAvLyBUaGUgbGluZSB3aWR0aCBvZiB0aGUgb3V0bGluZSwgb3IgMC5cbiAgICBsaW5lV2lkdGg6IG51bWJlclxufTtcblxuLyoqXG4gKiBBIGJhc2ljIHJlY3RhbmdsZSB0aGF0IGlzIHJlbmRlcmFibGUgdG8gUElYSSAoYXMgb3Bwb3NlZCB0byBhXG4gKiBQSVhJLlJlY3RhbmdsZSksIG9wdGlvbmFsbHkgd2l0aCByb3VuZGVkIGNvcm5lcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJUmVjdCBleHRlbmRzIFBJWEkuR3JhcGhpY3Mge1xuICAgIHByaXZhdGUgb3B0aW9uczogUElYSVJlY3RSZW5kZXJpbmdQYXJhbWV0ZXJzO1xuXG4gICAgY29uc3RydWN0b3Iod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge2Nvcm5lclJhZGl1cz86IG51bWJlciwgZmlsbENvbG9yPzogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvcj86IG51bWJlciwgbGluZVdpZHRoPzogbnVtYmVyfSA9IG51bGwpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgICAgICAgY29ybmVyUmFkaXVzOiBvcHRpb25zICYmIChcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNvcm5lclJhZGl1cyA9PSBudWxsID8gNSA6IG9wdGlvbnMuY29ybmVyUmFkaXVzKSxcbiAgICAgICAgICAgIGZpbGxDb2xvcjogb3B0aW9ucyAmJiBvcHRpb25zLmZpbGxDb2xvciB8fCAwLFxuICAgICAgICAgICAgc3Ryb2tlQ29sb3I6IG9wdGlvbnMgJiYgb3B0aW9ucy5zdHJva2VDb2xvcixcbiAgICAgICAgICAgIGxpbmVXaWR0aDogb3B0aW9ucyAmJiBvcHRpb25zLmxpbmVXaWR0aCB8fCAwLFxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51cGRhdGVHZW9tZXRyeSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBuZXcgcGFyYW1ldGVycyBmb3IgdGhlIGZpbGwgYW5kIHN0cm9rZSBjb2xvcnMuXG4gICAgICovXG4gICAgc2V0Q29sb3JzKGNvbG9yczoge2ZpbGw/OiBudW1iZXIsIHN0cm9rZT86IG51bWJlcn0pIHtcbiAgICAgICAgaWYgKGNvbG9ycy5maWxsICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5maWxsQ29sb3IgPSBjb2xvcnMuZmlsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sb3JzLnN0cm9rZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuc3Ryb2tlQ29sb3IgPSBjb2xvcnMuc3Ryb2tlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlR2VvbWV0cnkoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBwYXRoIGFzc29jaWF0ZWQgd2l0aCB0aGlzIFBJWEkuR3JhcGhpY3Mgb2JqZWN0IHRvIGFjY3VyYXRlbHlcbiAgICAgKiByZXByZXNlbnQgdGhlIHJlY3RhbmdsZSBkZXRhaWxlZCBieSB0aGUgb3B0aW9ucy5cbiAgICAgKi9cbiAgICBwcml2YXRlIHVwZGF0ZUdlb21ldHJ5KCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgbGV0IHdpZHRoID0gb3B0aW9ucy53aWR0aDtcbiAgICAgICAgbGV0IGhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xuICAgICAgICBsZXQgcmFkaXVzID0gb3B0aW9ucy5jb3JuZXJSYWRpdXM7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJlbG93IGlzIGEgZGlhZ3JhbSBvZiB0aGUgb3JkZXIgaW4gd2hpY2ggdGhlIHJlY3RhbmdsZSBpcyByZW5kZXJlZC5cbiAgICAgICAgICogVGhlIG51bWJlcnMgY29pbmNpZGUgd2l0aCBjb21tZW50cyBvbiB0aGUgbGluZXMgYmVsb3cgdGhhdCBhcmUgdXNlZFxuICAgICAgICAgKiB0byBjb25zdHJ1Y3QgdGhlIGdlb21ldHJ5IGZvciB0aGUgcmVjdGFuZ2xlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgOC8wIC0tLS0tLS0tLS0tLS0tLSAxXG4gICAgICAgICAqICAgICAvICAgICAgICAgICAgICAgICAgICAgXFxcbiAgICAgICAgICogICA3ICAgICAgICAgICAgICAgICAgICAgICAgIDJcbiAgICAgICAgICogICB8ICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgICAgICogICB8ICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgICAgICogICB8ICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgICAgICogICB8ICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICAgICAgICogICA2ICAgICAgICAgICAgICAgICAgICAgICAgIDNcbiAgICAgICAgICogICAgIFxcICAgICAgICAgICAgICAgICAgICAgL1xuICAgICAgICAgKiAgICAgICA1IC0tLS0tLS0tLS0tLS0tLSA0XG4gICAgICAgICAqL1xuXG4gICAgICAgIC8vIE5PVEU6IFRoZSBhcmNzIGFyZSBzb21ldGltZXMgaW1wcmVjaXNlIHdoZW4gcmVuZGVyZWQsIGFuZCBoYXZpbmcgYVxuICAgICAgICAvLyBsaW5lVG8gY29tbWFuZCBhZnRlciB0aGVtIGhlbHBzIG1ha2UgdGhlbSBsb29rIGJldHRlci4gVGhlc2UgbGluZVRvXG4gICAgICAgIC8vIGNvbW1hbmRzIHdpbGwgYmUgbnVtYmVyZWQgYXMgTi41LCB3aGVyZSBOIGlzIHRoZSBudW1iZXIgb2YgdGhlIGFyYy5cblxuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuYmVnaW5GaWxsKG9wdGlvbnMuZmlsbENvbG9yKTtcbiAgICAgICAgdGhpcy5saW5lU3R5bGUob3B0aW9ucy5saW5lV2lkdGgsIG9wdGlvbnMuc3Ryb2tlQ29sb3IpO1xuICAgICAgICB0aGlzLm1vdmVUbyhyYWRpdXMsIDApOyAgICAgICAgICAvLyAwXG4gICAgICAgIHRoaXMubGluZVRvKHdpZHRoIC0gcmFkaXVzLCAwKTsgIC8vIDFcbiAgICAgICAgaWYgKHJhZGl1cyA+IDApIHtcbiAgICAgICAgICAgIC8vICgyKSBUb3AtcmlnaHQgY29ybmVyLlxuICAgICAgICAgICAgdGhpcy5hcmMod2lkdGggLSByYWRpdXMsIHJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgIHJhZGl1cywgTWF0aC5QSSAvIDIgKiAzLCBNYXRoLlBJICogMik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lVG8od2lkdGgsIHJhZGl1cyk7ICAgICAgICAgICAvLyAyLjVcbiAgICAgICAgdGhpcy5saW5lVG8od2lkdGgsIGhlaWdodCAtIHJhZGl1cyk7ICAvLyAzXG4gICAgICAgIGlmIChyYWRpdXMgPiAwKSB7XG4gICAgICAgICAgICAvLyAoNCkgQm90dG9tLXJpZ2h0IGNvcm5lci5cbiAgICAgICAgICAgIHRoaXMuYXJjKHdpZHRoIC0gcmFkaXVzLCBoZWlnaHQgLSByYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICByYWRpdXMsIDAsIE1hdGguUEkgLyAyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVUbyh3aWR0aCAtIHJhZGl1cywgaGVpZ2h0KTsgIC8vIDQuNVxuICAgICAgICB0aGlzLmxpbmVUbyhyYWRpdXMsIGhlaWdodCk7ICAgICAgICAgIC8vIDVcbiAgICAgICAgaWYgKHJhZGl1cyA+IDApIHtcbiAgICAgICAgICAgIC8vICg2KSBCb3R0b20tbGVmdCBjb3JuZXIuXG4gICAgICAgICAgICB0aGlzLmFyYyhyYWRpdXMsIGhlaWdodCAtIHJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgIHJhZGl1cywgTWF0aC5QSSAvIDIsIE1hdGguUEkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGluZVRvKDAsIGhlaWdodCAtIHJhZGl1cyk7ICAvLyA2LjVcbiAgICAgICAgdGhpcy5saW5lVG8oMCwgcmFkaXVzKTsgICAgICAgICAgIC8vIDdcbiAgICAgICAgaWYgKHJhZGl1cyA+IDApIHtcbiAgICAgICAgICAgIC8vICg4KSBUb3AtbGVmdCBjb3JuZXIuXG4gICAgICAgICAgICB0aGlzLmFyYyhyYWRpdXMsIHJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgIHJhZGl1cywgTWF0aC5QSSwgTWF0aC5QSSAvIDIgKiAzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImxldCBCdXR0b25TdGF0ZSA9IHtcbiAgICBIT1ZFUjogJ2hvdmVyJyxcbiAgICBET1dOOiAnZG93bicsXG4gICAgTk9STUFMOiAnbm9ybWFsJ1xufTtcblxuXG4vKipcbiAqIFRoaXMgY2xhc3MgZW5jYXBzdWxhdGVzIHRoZSBsb2dpYyBmb3Igc3RhdGUgdHJhbnNpdGlvbnMgb24gYSBidXR0b24uIEl0IGVtaXRzXG4gKiBldmVudHMgd2hlbiBhIGJ1dHRvbiBzaG91bGQgY2hhbmdlIHRoZSBzdGF0ZSwgd2l0aCBlYWNoIGRpZmZlcmVudCBldmVudFxuICogc2lnbmlmeWluZyBhIGRpZmZlcmVudCBzdGF0ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEJ1dHRvblN0YXRlSGFuZGxlciB7XG4gICAgLy8gVGhlIHRhcmdldCBQSVhJIG9iamVjdCB0aGF0IHdpbGwgYmUgcmVjZWl2aW5nIGV2ZW50cy5cbiAgICBwcml2YXRlIHRhcmdldDogUElYSS5Db250YWluZXI7XG4gICAgLy8gSGFuZGxlcnMgZm9yIHRoZSBldmVudHMgd2Ugd2lsbCBiZSBmaXJpbmcsIHNvIHRoYXQgd2UgZG9uJ3QgbGVhayBldmVudHNcbiAgICAvLyB0byBhbnlvbmUgb3V0c2lkZSB0aGlzIGZpbGUuXG4gICAgcHJpdmF0ZSBoYW5kbGVyczoge1trZXk6IHN0cmluZ106IEFycmF5PCgpID0+IHZvaWQ+fTtcbiAgICBwcml2YXRlIG1vdXNlOiB7ZG93bjogYm9vbGVhbiwgaW5zaWRlOiBib29sZWFufTtcblxuICAgIGNvbnN0cnVjdG9yKHRhcmdldDogUElYSS5Db250YWluZXIpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICAgICAgdGhpcy5tb3VzZSA9IHtkb3duOiBmYWxzZSwgaW5zaWRlOiBmYWxzZX07XG5cbiAgICAgICAgdGhpcy50YXJnZXQuaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgICAgICB0aGlzLnRhcmdldC5idXR0b25Nb2RlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50YXJnZXQub24oJ3BvaW50ZXJkb3duJywgKCkgPT4gdGhpcy5oYW5kbGVNb3VzZURvd24oKSk7XG4gICAgICAgIHRoaXMudGFyZ2V0Lm9uKCdwb2ludGVydXAnLCAoKSA9PiB0aGlzLmhhbmRsZU1vdXNlVXAoKSk7XG4gICAgICAgIHRoaXMudGFyZ2V0Lm9uKCdwb2ludGVydXBvdXRzaWRlJywgKCkgPT4gdGhpcy5oYW5kbGVNb3VzZVVwKCkpO1xuICAgICAgICB0aGlzLnRhcmdldC5vbigncG9pbnRlcm1vdmUnLCAoZXZlbnQpID0+IHRoaXMuaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgYSBQSVhJIHBvaW50ZXJkb3duIGV2ZW50LlxuICAgICAqL1xuICAgIHByaXZhdGUgaGFuZGxlTW91c2VEb3duKCkge1xuICAgICAgICAvLyBXaGVuIHdlIGdldCB0aGlzIGV2ZW50LCB0aGUgbW91c2UgaXMgZ3VhcmFudGVlZCB0byBiZSBpbnNpZGUgdGhlXG4gICAgICAgIC8vIGJ1dHRvbi5cbiAgICAgICAgdGhpcy5tb3VzZS5pbnNpZGUgPSB0cnVlO1xuICAgICAgICB0aGlzLm1vdXNlLmRvd24gPSB0cnVlO1xuICAgICAgICB0aGlzLmZpcmUoQnV0dG9uU3RhdGUuRE9XTik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgYSBQSVhJIHBvaW50ZXJ1cCBldmVudC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGhhbmRsZU1vdXNlVXAoKSB7XG4gICAgICAgIHRoaXMuZmlyZSh0aGlzLm1vdXNlLmluc2lkZSA/IEJ1dHRvblN0YXRlLkhPVkVSIDogQnV0dG9uU3RhdGUuTk9STUFMKTtcbiAgICAgICAgdGhpcy5tb3VzZS5kb3duID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgYSBQSVhJIHBvaW50ZXJtb3ZlIGV2ZW50LiBUaGlzIG1ldGhvZCBjb250cm9scyB0aGUgc3RhdGUgb2ZcbiAgICAgKiBgbW91c2UuaW5zaWRlYCwgYW5kIHBvc3NpYmx5IGZpcmVzIEJ1dHRvblN0YXRlLkhPVkVSIGFuZFxuICAgICAqIEJ1dHRvblN0YXRlLk5PUk1BTCBldmVudHMgd2hlbiB0aGUgc3RhdGUgY2hhbmdlcy5cbiAgICAgKi9cbiAgICBwcml2YXRlIGhhbmRsZU1vdXNlTW92ZShldmVudDogUElYSS5pbnRlcmFjdGlvbi5JbnRlcmFjdGlvbkV2ZW50KSB7XG4gICAgICAgIC8vIElnbm9yZSB0aGUgZXZlbnQgZW50aXJlIGlmIHRoZSBtb3VzZSBidXR0b24gaXMgbm90IGRvd24uXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IGV2ZW50LmRhdGEuZ2xvYmFsO1xuICAgICAgICAvLyBEZXRlcm1pbmUgd2hldGhlciB0aGUgcG9pbnRlciBpcyBpbnNpZGUgdGhlIGJvdW5kcyBvZiB0aGUgYnV0dG9uLlxuICAgICAgICBsZXQgaXNQb2ludGVySW5zaWRlID0gIShcbiAgICAgICAgICAgIHBvc2l0aW9uLnggPCB0aGlzLnRhcmdldC5wb3NpdGlvbi54IHx8XG4gICAgICAgICAgICBwb3NpdGlvbi55IDwgdGhpcy50YXJnZXQucG9zaXRpb24ueSB8fFxuICAgICAgICAgICAgcG9zaXRpb24ueCA+IHRoaXMudGFyZ2V0LnBvc2l0aW9uLnggKyB0aGlzLnRhcmdldC53aWR0aCB8fFxuICAgICAgICAgICAgcG9zaXRpb24ueSA+IHRoaXMudGFyZ2V0LnBvc2l0aW9uLnkgKyB0aGlzLnRhcmdldC5oZWlnaHQpO1xuICAgICAgICBpZiAoaXNQb2ludGVySW5zaWRlICE9PSB0aGlzLm1vdXNlLmluc2lkZSkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIFwiaW5zaWRlXCIgc3RhdGUgaGFzIGNoYW5nZWQsIHdlIG5lZWQgdG8gcmFpc2UgdGhlIGNvcnJlY3RcbiAgICAgICAgICAgIC8vIGV2ZW50cyBzbyB0aGF0IHRoZSBidXR0b24gYXBwZWFyYW5jZSBjYW4gY2hhbmdlLlxuICAgICAgICAgICAgdGhpcy5tb3VzZS5pbnNpZGUgPSBpc1BvaW50ZXJJbnNpZGU7XG4gICAgICAgICAgICBpZiAoIXRoaXMubW91c2UuZG93bikge1xuICAgICAgICAgICAgICAgIGlmIChpc1BvaW50ZXJJbnNpZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKEJ1dHRvblN0YXRlLkhPVkVSKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpcmUoQnV0dG9uU3RhdGUuTk9STUFMKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQSBwcml2YXRlIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIGEgbGlzdGVuZXIgZm9yIGFuIGFyYml0cmFyeSBldmVudC4gKi9cbiAgICBwcml2YXRlIGxpc3RlbihldmVudDogc3RyaW5nLCBoYW5kbGVyOiAoKSA9PiB2b2lkKTogQnV0dG9uU3RhdGVIYW5kbGVyIHtcbiAgICAgICAgaWYgKHRoaXMuaGFuZGxlcnNbZXZlbnRdID09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlcnNbZXZlbnRdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5oYW5kbGVyc1tldmVudF0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEEgcHJpdmF0ZSBmdW5jdGlvbiB0byBmaXJlIHRoZSBnaXZlbiBldmVudC4gKi9cbiAgICBwcml2YXRlIGZpcmUoZXZlbnQ6IHN0cmluZykge1xuICAgICAgICBsZXQgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzW2V2ZW50XTtcbiAgICAgICAgaWYgKGhhbmRsZXJzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyc1tpXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFJlZ2lzdGVycyBhIGhvdmVyIGhhbmRsZXIuICovXG4gICAgd2hlbkhvdmVyZWQoaGFuZGxlcjogKCkgPT4gdm9pZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW4oQnV0dG9uU3RhdGUuSE9WRVIsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKiBSZWdpc3RlcnMgYSBidXR0b24gZG93biBoYW5kbGVyLiAqL1xuICAgIHdoZW5Eb3duKGhhbmRsZXI6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuKEJ1dHRvblN0YXRlLkRPV04sIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKiBSZWdpc3RlcnMgYSBidXR0b24gbm9ybWFsIGhhbmRsZXIuICovXG4gICAgd2hlbk5vcm1hbChoYW5kbGVyOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbihCdXR0b25TdGF0ZS5OT1JNQUwsIGhhbmRsZXIpO1xuICAgIH1cbn1cbiIsIi8vIFRoaXMgZmlsZSBjb250YWlucyBzb21lIGJ1dHRvbiBjb2xvcnMgYW5kIG90aGVyIHN0eWxlIHByb3BlcnRpZXMgdGhhdCBsb29rXG4vLyBmYWlybHkgZGVjZW50LiBUaGVzZSBidXR0b24gc3R5bGVzIHdlcmUgYm9ycm93ZWQgZnJvbSB0aGUgQm9vdHN0cmFwIGRlZmF1bHRcbi8vIGNvbmZpZ3VyYXRpb24uXG5cbi8vIENvbG9ycyBvZiB0aGUgYnV0dG9uIGJhY2tncm91bmRzLCBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIHRoZSBidXR0b24uXG5leHBvcnQgY29uc3QgQnV0dG9uQ29sb3JzID0ge1xuICAgIFNVQ0NFU1M6IHtub3JtYWw6IDB4NUNCODVDLCBob3ZlcmVkOiAweDQ0OUQ0NCwgZG93bjogMHgzOTg0Mzl9LFxuICAgIERBTkdFUjoge25vcm1hbDogMHhkOTUzNGYsIGhvdmVyZWQ6IDB4YzkzMDJjLCBkb3duOiAweGFjMjkyNX0sXG4gICAgV0FSTklORzoge25vcm1hbDogMHhmMGFkNGUsIGhvdmVyZWQ6IDB4ZWM5NzFmLCBkb3duOiAweGQ1ODUxMn1cbn07XG5cbi8vIENvbG9ycyBvZiB0aGUgYnV0dG9uIGJvcmRlcnMsIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgdGhlIGJ1dHRvbi5cbmV4cG9ydCBjb25zdCBCdXR0b25Cb3JkZXJDb2xvcnMgPSB7XG4gICAgU1VDQ0VTUzoge25vcm1hbDogMHg0Y2FlNGMsIGhvdmVyZWQ6IDB4Mzk4NDM5LCBkb3duOiAweDI1NTYyNX0sXG4gICAgREFOR0VSOiB7bm9ybWFsOiAweGQ0M2YzYSwgaG92ZXJlZDogMHhhYzI5MjUsIGRvd246IDB4NzYxYzE5fSxcbiAgICBXQVJOSU5HOiB7bm9ybWFsOiAweGVlYTIzNiwgaG92ZXJlZDogMHhkNTg1MTIsIGRvd246IDB4OTg1ZjBkfVxufTtcblxuLy8gQSB0ZXh0IHN0eWxlIHRoYXQgaXMgY29udmVuaWVudCB0byB1c2UgZm9yIHRoZSBidXR0b25zLlxuZXhwb3J0IGNvbnN0IEJ1dHRvblRleHRTdHlsZSA9IHtcbiAgICBmb250RmFtaWx5OiAnSGVsdmV0aWNhIE5ldWUnLFxuICAgIGZvbnRTaXplOiAxNCxcbiAgICBmaWxsOiAweEZGRkZGRlxufTtcblxuLy8gQ29tbW9uIGJ1dHRvbiBzdHlsZSBjb25maWd1cmF0aW9uIHRoYXQgY2FuIGJlIHBhc3NlZCBkaXJlY3RseSB0byBhXG4vLyBQSVhJQnV0dG9uLlxuZXhwb3J0IGNvbnN0IEJ1dHRvblN0eWxlcyA9IHtcbiAgICBTVUNDRVNTOiB7dGV4dDogQnV0dG9uVGV4dFN0eWxlLCBjb2xvcnM6IEJ1dHRvbkNvbG9ycy5TVUNDRVNTLFxuICAgICAgICAgICAgICBib3JkZXI6IHt3aWR0aDogMSwgY29sb3JzOiBCdXR0b25Cb3JkZXJDb2xvcnMuU1VDQ0VTU319LFxuICAgIERBTkdFUjoge3RleHQ6IEJ1dHRvblRleHRTdHlsZSwgY29sb3JzOiBCdXR0b25Db2xvcnMuREFOR0VSLFxuICAgICAgICAgICAgIGJvcmRlcjoge3dpZHRoOiAxLCBjb2xvcnM6IEJ1dHRvbkJvcmRlckNvbG9ycy5EQU5HRVJ9fSxcbiAgICBXQVJOSU5HOiB7dGV4dDogQnV0dG9uVGV4dFN0eWxlLCBjb2xvcnM6IEJ1dHRvbkNvbG9ycy5XQVJOSU5HLFxuICAgICAgICAgICAgICBib3JkZXI6IHt3aWR0aDogMSwgY29sb3JzOiBCdXR0b25Cb3JkZXJDb2xvcnMuV0FSTklOR319XG59O1xuXG4vLyBvcHBhIGJ1dHRvbiBzdHlsZVxuIiwiaW1wb3J0IHsgUElYSVJlY3QgfSBmcm9tICcuLi9zaGFwZXMvcGl4aS1yZWN0JztcbmltcG9ydCB7IEJ1dHRvblN0YXRlSGFuZGxlciB9IGZyb20gJy4vYnV0dG9uLXN0YXRlLWhhbmRsZXInO1xuXG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgc3R5bGluZyBpbmZvcm1hdGlvbiB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYSBQSVhJQnV0dG9uLlxuICovXG5leHBvcnQgdHlwZSBQSVhJQnV0dG9uU3R5bGUgPSB7XG4gICAgdGV4dD86IFBJWEkuVGV4dFN0eWxlT3B0aW9ucyxcbiAgICBib3JkZXI/OiB7XG4gICAgICAgIHdpZHRoPzogbnVtYmVyLFxuICAgICAgICBjb2xvcnM/OiB7XG4gICAgICAgICAgICBkb3duPzogbnVtYmVyLFxuICAgICAgICAgICAgaG92ZXJlZD86IG51bWJlcixcbiAgICAgICAgICAgIG5vcm1hbD86IG51bWJlclxuICAgICAgICB9XG4gICAgfSxcbiAgICBjb2xvcnM/OiB7XG4gICAgICAgIGRvd24/OiBudW1iZXIsXG4gICAgICAgIGhvdmVyZWQ/OiBudW1iZXIsXG4gICAgICAgIG5vcm1hbD86IG51bWJlclxuICAgIH1cbn07XG5cblxubGV0IGFjY2Vzc09yRGVmYXVsdCA9IGZ1bmN0aW9uKFxuICAgICAgICBvYmo6IE9iamVjdCwgcGF0aDogc3RyaW5nW10sIGRlZmF1bHRWYWx1ZT86IGFueSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBvYmogPSBvYmpbcGF0aFtpXV07XG4gICAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn07XG5cblxuLyoqXG4gKiBBIGJ1dHRvbiBjb21wb25lbnQgdGhhdCBjYW4gYmUgYWRkZWQgdG8gYSBzY2VuZSBhbmQgd2lsbCBmaXJlIGFuIGV2ZW50IHdoZW5cbiAqIGNsaWNrZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJQnV0dG9uIGV4dGVuZHMgUElYSS5Db250YWluZXIge1xuICAgIHByaXZhdGUgbGFiZWw6IHN0cmluZztcbiAgICBwcml2YXRlIGNsaWNrSGFuZGxlcnM6ICgoKSA9PiB2b2lkKVtdO1xuICAgIHByaXZhdGUgcGFkZGluZzogbnVtYmVyO1xuXG4gICAgcHJpdmF0ZSB0ZXh0OiBQSVhJLlRleHQ7XG4gICAgcHJpdmF0ZSBvdXRsaW5lOiBQSVhJUmVjdDtcbiAgICBwcml2YXRlIHN0eWxlOiBQSVhJQnV0dG9uU3R5bGU7XG5cbiAgICBwcml2YXRlIGJ1dHRvbldpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBidXR0b25IZWlnaHQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKGxhYmVsOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLFxuICAgICAgICAgICAgICAgIHN0eWxlOiBQSVhJQnV0dG9uU3R5bGUgPSBudWxsKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYnV0dG9uV2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5idXR0b25IZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3R5bGUgPSBzdHlsZTtcblxuICAgICAgICBsZXQgY29ybmVyUmFkaXVzID0gNDtcbiAgICAgICAgdGhpcy5wYWRkaW5nID0gNTtcbiAgICAgICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xuICAgICAgICB0aGlzLmNsaWNrSGFuZGxlcnMgPSBbXTtcblxuICAgICAgICBsZXQgZG93bkZpbGxDb2xvciA9IGFjY2Vzc09yRGVmYXVsdChcbiAgICAgICAgICAgIHN0eWxlLCBbJ2NvbG9ycycsICdkb3duJ10sIDB4MDBBQTAwKTtcbiAgICAgICAgbGV0IG5vcm1hbEZpbGxDb2xvciA9IGFjY2Vzc09yRGVmYXVsdChcbiAgICAgICAgICAgIHN0eWxlLCBbJ2NvbG9ycycsICdub3JtYWwnXSwgMHgwMEZGMDApO1xuICAgICAgICBsZXQgaG92ZXJGaWxsQ29sb3IgPSBhY2Nlc3NPckRlZmF1bHQoXG4gICAgICAgICAgICBzdHlsZSwgWydjb2xvcnMnLCAnaG92ZXJlZCddLCAweDY2RkY2Nik7XG5cbiAgICAgICAgbGV0IGRvd25Cb3JkZXJDb2xvciA9IGFjY2Vzc09yRGVmYXVsdChcbiAgICAgICAgICAgIHN0eWxlLCBbJ2JvcmRlcicsICdjb2xvcnMnLCAnZG93biddLCBkb3duRmlsbENvbG9yKTtcbiAgICAgICAgbGV0IG5vcm1hbEJvcmRlckNvbG9yID0gYWNjZXNzT3JEZWZhdWx0KFxuICAgICAgICAgICAgc3R5bGUsIFsnYm9yZGVyJywgJ2NvbG9ycycsICdub3JtYWwnXSwgbm9ybWFsRmlsbENvbG9yKTtcbiAgICAgICAgbGV0IGhvdmVyQm9yZGVyQ29sb3IgPSBhY2Nlc3NPckRlZmF1bHQoXG4gICAgICAgICAgICBzdHlsZSwgWydib3JkZXInLCAnY29sb3JzJywgJ2hvdmVyZWQnXSwgaG92ZXJGaWxsQ29sb3IpO1xuXG4gICAgICAgIHRoaXMub3V0bGluZSA9IG5ldyBQSVhJUmVjdCh3aWR0aCwgaGVpZ2h0LCB7XG4gICAgICAgICAgICBjb3JuZXJSYWRpdXM6IGNvcm5lclJhZGl1cywgZmlsbENvbG9yOiBub3JtYWxGaWxsQ29sb3IsXG4gICAgICAgICAgICBzdHJva2VDb2xvcjogbm9ybWFsQm9yZGVyQ29sb3IsXG4gICAgICAgICAgICBsaW5lV2lkdGg6IHN0eWxlICYmIHN0eWxlLmJvcmRlciAmJiBzdHlsZS5ib3JkZXIud2lkdGggfHwgMH0pO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMub3V0bGluZSk7XG5cbiAgICAgICAgdGhpcy50ZXh0ID0gdGhpcy5yZW5kZXJUZXh0KCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy50ZXh0KTtcblxuICAgICAgICBuZXcgQnV0dG9uU3RhdGVIYW5kbGVyKHRoaXMpXG4gICAgICAgICAgICAud2hlbk5vcm1hbCgoKCkgPT4gdGhpcy5vdXRsaW5lLnNldENvbG9ycyh7XG4gICAgICAgICAgICAgICAgZmlsbDogbm9ybWFsRmlsbENvbG9yLCBzdHJva2U6IG5vcm1hbEJvcmRlckNvbG9yfSkpLmJpbmQodGhpcykpXG4gICAgICAgICAgICAud2hlbkhvdmVyZWQoKCgpID0+IHRoaXMub3V0bGluZS5zZXRDb2xvcnMoe1xuICAgICAgICAgICAgICAgIGZpbGw6IGhvdmVyRmlsbENvbG9yLCBzdHJva2U6IGhvdmVyQm9yZGVyQ29sb3J9KSkuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC53aGVuRG93bigoKCkgPT4gdGhpcy5vdXRsaW5lLnNldENvbG9ycyh7XG4gICAgICAgICAgICAgICAgZmlsbDogZG93bkZpbGxDb2xvciwgc3Ryb2tlOiBkb3duQm9yZGVyQ29sb3J9KSkuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgLyoqIFJlbmRlcnMgYW5kIHBvc2l0aW9ucyB0aGUgdGV4dCBsYWJlbCBvZiB0aGUgYnV0dG9uLiAqL1xuICAgIHByaXZhdGUgcmVuZGVyVGV4dChsYWJlbD86IHN0cmluZyk6IFBJWEkuVGV4dCB7XG4gICAgICAgIGxhYmVsID0gbGFiZWwgIT0gbnVsbCA/IGxhYmVsIDogdGhpcy5sYWJlbDtcbiAgICAgICAgaWYgKHRoaXMudGV4dCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnRleHQudGV4dCA9IGxhYmVsO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy50ZXh0IHx8IG5ldyBQSVhJLlRleHQoXG4gICAgICAgICAgICBsYWJlbCwgdGhpcy5zdHlsZSAmJiB0aGlzLnN0eWxlLnRleHQpO1xuICAgICAgICB0ZXh0LnBvc2l0aW9uLnggPSBNYXRoLmZsb29yKHRoaXMuYnV0dG9uV2lkdGggLyAyIC0gdGV4dC53aWR0aCAvIDIpO1xuICAgICAgICB0ZXh0LnBvc2l0aW9uLnkgPSBNYXRoLmZsb29yKHRoaXMuYnV0dG9uSGVpZ2h0IC8gMiAtIHRleHQuaGVpZ2h0IC8gMik7XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGxhYmVsIG9mIHRoZSBidXR0b24uIFRoaXMgYXV0b21hdGljYWxseSByZWZyZXNoZXMgdGhlIHZpZXcuIEtlZXBcbiAgICAgKiBpbiBtaW5kIHRoYXQgdGhlIHRleHQgd2lsbCBub3QgYmUgd3JhcHBlZC5cbiAgICAgKi9cbiAgICBzZXRMYWJlbChuZXdUZXh0OiBzdHJpbmcpOiBQSVhJQnV0dG9uIHtcbiAgICAgICAgdGhpcy50ZXh0ID0gdGhpcy5yZW5kZXJUZXh0KG5ld1RleHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhIGhhbmRsZXIgZm9yIGEgY2xpY2sgZXZlbnQuIEVxdWl2YWxlbnQgdG9cbiAgICAgKiBgYnV0dG9uLm9uKCdjbGljaycsIC4uLilgLCBidXQgbW9yZSBjb252ZW5pZW50IGJlY2F1c2UgaXQgcmV0dXJucyB0aGVcbiAgICAgKiBidXR0b24uXG4gICAgICovXG4gICAgb25DbGljayhoYW5kbGVyOiAoKSA9PiB2b2lkKTogUElYSUJ1dHRvbiB7XG4gICAgICAgIHRoaXMub24oJ2NsaWNrJywgaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsInR5cGUgUElYSVN0YWNrT3B0aW9ucyA9IHtcbiAgICBwYWRkaW5nPzogbnVtYmVyLFxuICAgIHNlcGFyYXRpb24/OiBudW1iZXIsXG59O1xuXG5cbi8qKlxuICogQSBzaW1wbGUgY2xhc3MgdGhhdCBrZWVwcyB0aGUgY29tbW9uIG9wdGlvbnMgYmV0d2VlbiB0aGUgdmVydGljYWwgYW5kXG4gKiBob3Jpem9udGFsIHN0YWNrcy4gQ3VycmVudGx5LCB0d28gb3B0aW9ucyBhcmUgc3VwcG9ydGVkOlxuICogcGFkZGluZzogdGhlIGFtb3VudCBvZiBzcGFjZSBhcm91bmQgdGhlIGVsZW1lbnRzIGluIHRoZSBzdGFjay5cbiAqIHNlcGFyYXRpb246IHRoZSBhbW91bnQgb2Ygc3BhY2UgYmV0d2VlbiB0aGUgZWxlbWVudHMgaW4gdGhlIHN0YWNrLlxuICovXG5jbGFzcyBQSVhJU3RhY2sgZXh0ZW5kcyBQSVhJLkNvbnRhaW5lciB7XG4gICAgcHJvdGVjdGVkIHBhZGRpbmc6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgc2VwYXJhdGlvbjogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFBJWElTdGFja09wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wYWRkaW5nID0gb3B0aW9ucyAmJiBvcHRpb25zLnBhZGRpbmcgfHwgMDtcbiAgICAgICAgdGhpcy5zZXBhcmF0aW9uID0gb3B0aW9ucyAmJiBvcHRpb25zLnNlcGFyYXRpb24gfHwgMDtcbiAgICB9XG59XG5cblxuLyoqXG4gKiBBIGhvcml6b250YWwgc3RhY2sgdGhhdCBsYXlzIG91dCBpdHMgY2hpbGRyZW4gd2hlbiB0aGV5IGFyZSBhZGRlZC4gSXQgaXNcbiAqIGV4cGVjdGVkIHRoYXQgdGhlIHNpemUgY2hhbmdlcyBvZiB0aGUgY2hpbGRyZW4gKGlmIGFueSkgZG8gbm90IGFmZmVjdCB0aGVcbiAqIHBvc2l0aW9uaW5nIG9mIHRoZSBvdGhlciBjaGlsZHJlbi4gU3RhY2tzIGZyb20gbGVmdCB0byByaWdodC5cbiAqL1xuZXhwb3J0IGNsYXNzIFBJWElIU3RhY2sgZXh0ZW5kcyBQSVhJU3RhY2sge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBQSVhJU3RhY2tPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGFkZENoaWxkKGNoaWxkOiBQSVhJLkNvbnRhaW5lcikge1xuICAgICAgICBsZXQgbGFzdENoaWxkID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggPiAwID9cbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uc2xpY2UoLTEpWzBdIDogbnVsbDtcbiAgICAgICAgbGV0IGxhc3RDaGlsZFJlY3QgPSBsYXN0Q2hpbGQgPT0gbnVsbCA/IG51bGwgOiBsYXN0Q2hpbGQuZ2V0Qm91bmRzKCk7XG4gICAgICAgIHN1cGVyLmFkZENoaWxkKGNoaWxkKTtcbiAgICAgICAgY2hpbGQucG9zaXRpb24ueCA9IChsYXN0Q2hpbGRSZWN0ID09IG51bGwgPyB0aGlzLnBhZGRpbmcgOlxuICAgICAgICAgICAgKGxhc3RDaGlsZFJlY3QucmlnaHQgLSB0aGlzLmdldEJvdW5kcygpLmxlZnQgKyB0aGlzLnNlcGFyYXRpb24pKTtcbiAgICAgICAgY2hpbGQucG9zaXRpb24ueSA9IHRoaXMucGFkZGluZztcbiAgICB9XG59XG5cblxuLyoqXG4gKiBBIHZlcnRpY2FsIHN0YWNrIHRoYXQgbGF5cyBvdXQgaXRzIGNoaWxkcmVuIHdoZW4gdGhleSBhcmUgYWRkZWQuIEl0IGlzXG4gKiBleHBlY3RlZCB0aGF0IHRoZSBzaXplIGNoYW5nZXMgb2YgdGhlIGNoaWxkcmVuIChpZiBhbnkpIGRvIG5vdCBhZmZlY3QgdGhlXG4gKiBwb3NpdGlvbmluZyBvZiB0aGUgb3RoZXIgY2hpbGRyZW4uIFN0YWNrcyBmcm9tIHRvcCB0byBib3R0b20uXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJVlN0YWNrIGV4dGVuZHMgUElYSVN0YWNrIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUElYSVN0YWNrT3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChjaGlsZDogUElYSS5Db250YWluZXIpIHtcbiAgICAgICAgbGV0IGxhc3RDaGlsZCA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gMCA/XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnNsaWNlKC0xKVswXSA6IG51bGw7XG4gICAgICAgIGxldCBsYXN0Q2hpbGRSZWN0ID0gbGFzdENoaWxkID09IG51bGwgPyBudWxsIDogbGFzdENoaWxkLmdldEJvdW5kcygpO1xuICAgICAgICBzdXBlci5hZGRDaGlsZChjaGlsZCk7XG4gICAgICAgIGNoaWxkLnBvc2l0aW9uLnggPSB0aGlzLnBhZGRpbmc7XG4gICAgICAgIGNoaWxkLnBvc2l0aW9uLnkgPSAobGFzdENoaWxkUmVjdCA9PSBudWxsID8gdGhpcy5wYWRkaW5nIDpcbiAgICAgICAgICAgIChsYXN0Q2hpbGRSZWN0LmJvdHRvbSAtIHRoaXMuZ2V0Qm91bmRzKCkudG9wICsgdGhpcy5zZXBhcmF0aW9uKSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgUElYSVJlY3QgfSBmcm9tICcuLi9zaGFwZXMvcGl4aS1yZWN0JztcblxuXG4vKipcbiAqIFRoZSBvcHRpb25zIHRoYXQgYXJlIGFjY2VwdGVkIGJ5IFBJWElUZXh0SW5wdXQgdG8gZGVzY3JpYmUgaXRzIGFwcGVhcmFuY2UuXG4gKi9cbnR5cGUgUElYSVRleHRJbnB1dFN0eWxlID0ge1xuICAgIC8vIFRoZSBzdHlsZSBvZiB0aGUgdGV4dCBpdHNlbGYuXG4gICAgdGV4dD86IFBJWEkuVGV4dFN0eWxlT3B0aW9ucyxcbiAgICAvLyBUaGUgY29sb3Igb2YgdGhlIHRleHQgZmlsbC5cbiAgICBjb2xvcj86IG51bWJlcixcbiAgICAvLyBUaGUgc3R5bGUgb2YgdGhlIHRleHQgb3V0bGluZS5cbiAgICBib3JkZXI/OiB7XG4gICAgICAgIHdpZHRoPzogbnVtYmVyLFxuICAgICAgICBjb2xvcj86IG51bWJlclxuICAgIH1cbn07XG5cblxuLyoqXG4gKiBBICh2ZXJ5KSBzaW1wbGUgdGV4dCBpbnB1dCBmaWVsZCB3aXRoIHJ1ZGltZW50YXJ5IGZvY3VzIHN1cHBvcnQuXG4gKiBUaGUgZm9sbG93aW5nIGZlYXR1cmVzIGNvdWxkIGJlIHN1cHBvcnRlZCwgYnV0IGFyZSBub3Q6XG4gKiAtIE11bHRpbGluZSB0ZXh0XG4gKiAtIEhvcml6b250YWwgc2Nyb2xsaW5nXG4gKiAtIFRleHQgc2VsZWN0aW9uXG4gKiAtIENvcHkgcGFzdGVcbiAqIC0gTW92aW5nIHRoZSBjdXJzb3IgdmlhIHRoZSBtb3VzZVxuICogLSBNb3ZpbmcgdGhlIGN1cnNvciB2aWEgdGhlIHVwIGFuZCBkb3duIGFycm93c1xuICpcbiAqIFRoaXMgY29tcG9uZW50IHdpbGwgZW1pdCBhICdmb2N1cycgZXZlbnQgd2hlbiBpdCBpcyBjbGlja2VkXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJVGV4dElucHV0IGV4dGVuZHMgUElYSS5Db250YWluZXIge1xuICAgIC8vIEEgZnVuY3Rpb24gdGhhdCBjb252ZXJ0cyBhIGtleUNvZGUgdG8gYSBzdHJpbmcuXG4gICAgcHJpdmF0ZSBrZXlDb2RlVG9DaGFyOiAoa2V5OiBudW1iZXIpID0+IHN0cmluZztcbiAgICAvLyBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0cnVlIHdoZW4gYSBrZXkgc2hvdWxkIGJlIGFjY2VwdGVkIGFzIGEgdHlwYWJsZVxuICAgIC8vIGNoYXJhY3Rlci5cbiAgICBwcml2YXRlIGtleUZpbHRlcjogKGtleTogbnVtYmVyKSA9PiBib29sZWFuO1xuXG4gICAgLy8gVGhlIGN1cnJlbnQgdGV4dCBvZiB0aGUgaW5wdXQuXG4gICAgcHJpdmF0ZSB0ZXh0OiBzdHJpbmc7XG4gICAgLy8gVGhlIGFtb3VudCBvZiBwYWRkaW5nIGFyb3VuZCB0aGUgdGV4dC5cbiAgICBwcml2YXRlIHBhZGRpbmc6IG51bWJlcjtcbiAgICAvLyBUaGUgbWF4aW11bSBhbGxvd2VkIGxlbmd0aCwgb3IgbnVsbCBpZiBub25lIGV4aXN0cyAobm90IHJlY29tbWVuZGVkKS5cbiAgICBwcml2YXRlIG1heExlbmd0aDogbnVtYmVyO1xuICAgIC8vIFRoZSBpbmRleCBpbnRvIHRoZSB0ZXh0IHJlcHJlc2VudGluZyB3aGVyZSB0aGUgY3Vyc29yIGN1cnJlbnRseSBpcy5cbiAgICBwcml2YXRlIGN1cnNvcjogbnVtYmVyO1xuICAgIC8vIFdoZXRoZXIgdGhpcyBjb250cm9sIGlzIGZvY3VzZWQuIFdoZW4gYSB0ZXh0IGlucHV0IGlzIGZvY3VzZWQsIGFsbCBrZXlcbiAgICAvLyBldmVudHMgd2lsbCBiZSBzZW50IHRvIGl0LiBJdCBpcyByZWNvbW1lbmRlZCB0aGF0IHRoaW5ncyBhcmUgYXJyYW5nZWQgaW5cbiAgICAvLyBhIHdheSB3aGVyZSBvbmx5IG9uZSBlbGVtZW50IGlzIGZvY3VzZWQgYXQgYSB0aW1lLlxuICAgIHByaXZhdGUgZm9jdXNlZDogYm9vbGVhbjtcblxuICAgIC8vIFRoZSBvYmplY3QgdXNlZCB0byBtZWFzdXJlIHRleHQgdG8gcGxhY2UgdGhlIGN1cnNvci5cbiAgICBwcml2YXRlIG1lYXN1cmVUZXh0T2JqZWN0OiBQSVhJLlRleHQ7XG4gICAgLy8gVGhlIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGFjdHVhbCBkaXNwbGF5ZWQgdGV4dC5cbiAgICBwcml2YXRlIHRleHRPYmplY3Q6IFBJWEkuVGV4dDtcbiAgICAvLyBUaGUgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgY3Vyc29yLlxuICAgIHByaXZhdGUgY3Vyc29yT2JqZWN0OiBQSVhJLkdyYXBoaWNzO1xuICAgIC8vIFRoZSByZWN0IG91dGxpbmUgb2YgdGhlIHRleHQgaW5wdXRcbiAgICBwcml2YXRlIG91dGxpbmU6IFBJWElSZWN0O1xuXG4gICAgY29uc3RydWN0b3IodGV4dDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICBzdHlsZTogUElYSVRleHRJbnB1dFN0eWxlID0gbnVsbCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdGhlIHByb3BlcnRpZXMgYW5kIHZhcmlhYmxlcyB0aGF0IGFmZmVjdCB2aXN1YWxcbiAgICAgICAgLy8gYXBwZWFyYW5jZS5cbiAgICAgICAgbGV0IGNvcm5lclJhZGl1cyA9IDQ7XG4gICAgICAgIHRoaXMucGFkZGluZyA9IDU7XG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG5cbiAgICAgICAgdGhpcy5mb2N1c2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY3Vyc29yID0gMDtcblxuICAgICAgICBsZXQgYmFja2dyb3VuZENvbG9yID0gc3R5bGUgJiYgc3R5bGUuY29sb3I7XG4gICAgICAgIGlmIChiYWNrZ3JvdW5kQ29sb3IgPT0gbnVsbCkgYmFja2dyb3VuZENvbG9yID0gMHhGRkZGRkY7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgZ3JhcGhpYyBvYmplY3RzLlxuICAgICAgICB0aGlzLm91dGxpbmUgPSBuZXcgUElYSVJlY3Qod2lkdGgsIGhlaWdodCwge1xuICAgICAgICAgICAgY29ybmVyUmFkaXVzOiBjb3JuZXJSYWRpdXMsIGZpbGxDb2xvcjogYmFja2dyb3VuZENvbG9yLFxuICAgICAgICAgICAgc3Ryb2tlQ29sb3I6IHN0eWxlICYmIHN0eWxlLmJvcmRlciAmJiBzdHlsZS5ib3JkZXIuY29sb3IgfHwgMCxcbiAgICAgICAgICAgIGxpbmVXaWR0aDogc3R5bGUgJiYgc3R5bGUuYm9yZGVyICYmIHN0eWxlLmJvcmRlci53aWR0aCB8fCAwfSk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5vdXRsaW5lKTtcblxuICAgICAgICB0aGlzLm1lYXN1cmVUZXh0T2JqZWN0ID0gbmV3IFBJWEkuVGV4dCgnJywgc3R5bGUudGV4dCk7XG4gICAgICAgIHRoaXMudGV4dE9iamVjdCA9IG5ldyBQSVhJLlRleHQodGhpcy50ZXh0LCBzdHlsZS50ZXh0KTtcbiAgICAgICAgdGhpcy50ZXh0T2JqZWN0LnBvc2l0aW9uLnggPSB0aGlzLnBhZGRpbmc7XG4gICAgICAgIHRoaXMudGV4dE9iamVjdC5wb3NpdGlvbi55ID0gdGhpcy5wYWRkaW5nO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMudGV4dE9iamVjdCk7XG5cbiAgICAgICAgdGhpcy5jdXJzb3JPYmplY3QgPSB0aGlzLmJ1aWxkVGV4dEN1cnNvcigpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuY3Vyc29yT2JqZWN0KTtcbiAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yKDApO1xuICAgICAgICB0aGlzLmN1cnNvck9iamVjdC5hbHBoYSA9IDA7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgaW50ZXJhY3Rpdml0eSBsb2dpYy5cbiAgICAgICAgdGhpcy5pbnRlcmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHRoaXMub24oJ3BvaW50ZXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBGb2N1cyBvbiB0aGlzIHRleHQgaW5wdXQuXG4gICAgICAgICAgICB0aGlzLmZvY3VzZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jdXJzb3JPYmplY3QuYWxwaGEgPSAxO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdmb2N1cycpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMub24oJ3VuZm9jdXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIElmIHNvbWV0aGluZyBlbWl0cyBhbiB1bmZvY3VzIGV2ZW50IG9uIHRoaXMgdGV4dCBpbnB1dCwgaXQgc2hvdWxkXG4gICAgICAgICAgICAvLyByZWFjdC5cbiAgICAgICAgICAgIHRoaXMuZm9jdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jdXJzb3JPYmplY3QuYWxwaGEgPSAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgLy8gSWdub3JlIGtleXMgd2hlbiBub3QgZm9jdXNlZC5cbiAgICAgICAgICAgIGlmICghdGhpcy5mb2N1c2VkKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUtleURvd24oZS5rZXlDb2RlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGJ1aWxkVGV4dEN1cnNvcigpOiBQSVhJLkdyYXBoaWNzIHtcbiAgICAgICAgbGV0IGN1cnNvck9iamVjdCA9IG5ldyBQSVhJLkdyYXBoaWNzKCk7XG4gICAgICAgIGN1cnNvck9iamVjdC5iZWdpbkZpbGwoMCk7XG4gICAgICAgIGN1cnNvck9iamVjdC5tb3ZlVG8oLTEsIHRoaXMucGFkZGluZyk7XG4gICAgICAgIGN1cnNvck9iamVjdC5saW5lVG8oLTEsIHRoaXMub3V0bGluZS5oZWlnaHQgLSB0aGlzLnBhZGRpbmcpO1xuICAgICAgICBjdXJzb3JPYmplY3QubGluZVRvKDAsIHRoaXMub3V0bGluZS5oZWlnaHQgLSB0aGlzLnBhZGRpbmcpO1xuICAgICAgICBjdXJzb3JPYmplY3QubGluZVRvKDAsIHRoaXMucGFkZGluZyk7XG4gICAgICAgIHJldHVybiBjdXJzb3JPYmplY3Q7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVLZXlEb3duKGtleUNvZGU6IG51bWJlcikge1xuICAgICAgICBpZiAoa2V5Q29kZSA9PT0gMzcpIHsgLy8gbGVmdFxuICAgICAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yKE1hdGgubWF4KDAsIHRoaXMuY3Vyc29yIC0gMSkpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09IDM5KSB7IC8vIHJpZ2h0XG4gICAgICAgICAgICB0aGlzLm1vdmVDdXJzb3IoTWF0aC5taW4odGhpcy50ZXh0Lmxlbmd0aCwgdGhpcy5jdXJzb3IgKyAxKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gOCkgeyAvLyBiYWNrc3BhY2VcbiAgICAgICAgICAgIGxldCBmaXJzdEhhbGYgPSB0aGlzLnRleHQuc2xpY2UoMCwgTWF0aC5tYXgoMCwgdGhpcy5jdXJzb3IgLSAxKSk7XG4gICAgICAgICAgICBsZXQgc2Vjb25kSGFsZiA9IHRoaXMudGV4dC5zbGljZSh0aGlzLmN1cnNvcik7XG4gICAgICAgICAgICB0aGlzLm1vdmVDdXJzb3IodGhpcy5jdXJzb3IgLSAxKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVGV4dChmaXJzdEhhbGYgKyBzZWNvbmRIYWxmKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSA0NikgeyAvLyBkZWxldGVcbiAgICAgICAgICAgIGxldCBmaXJzdEhhbGYgPSB0aGlzLnRleHQuc2xpY2UoMCwgdGhpcy5jdXJzb3IpO1xuICAgICAgICAgICAgbGV0IHNlY29uZEhhbGYgPSB0aGlzLnRleHQuc2xpY2UoXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy50ZXh0Lmxlbmd0aCwgdGhpcy5jdXJzb3IgKyAxKSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoZmlyc3RIYWxmICsgc2Vjb25kSGFsZik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5rZXlGaWx0ZXIgPT0gbnVsbCB8fCB0aGlzLmtleUZpbHRlcihrZXlDb2RlKSkge1xuICAgICAgICAgICAgbGV0IHN0ciA9IHRoaXMua2V5Q29kZVRvQ2hhcihrZXlDb2RlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnVwZGF0ZVRleHQodGhpcy50ZXh0LnNsaWNlKDAsIHRoaXMuY3Vyc29yKSArIHN0ciArXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGV4dC5zbGljZSh0aGlzLmN1cnNvcikpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yKHRoaXMuY3Vyc29yICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBkaXNwbGF5ZWQgdGV4dCwgdW5sZXNzIHRoZSB0ZXh0IGlzIHRvbyBsb25nLlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgdGV4dCB3YXMgdXBkYXRlZC5cbiAgICAgKi9cbiAgICBwcml2YXRlIHVwZGF0ZVRleHQobmV3VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLm1heExlbmd0aCAhPSBudWxsICYmIG5ld1RleHQubGVuZ3RoID4gdGhpcy5tYXhMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRleHQgPSBuZXdUZXh0O1xuICAgICAgICB0aGlzLnRleHRPYmplY3QudGV4dCA9IG5ld1RleHQ7XG4gICAgICAgIHRoaXMubW92ZUN1cnNvcih0aGlzLmN1cnNvcik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1lYXN1cmVzIHRoZSBnaXZlbiB0ZXh0LlxuICAgICAqL1xuICAgIHByaXZhdGUgbWVhc3VyZVRleHQodGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubWVhc3VyZVRleHRPYmplY3QudGV4dCA9IHRleHQ7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogdGhpcy5tZWFzdXJlVGV4dE9iamVjdC53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5tZWFzdXJlVGV4dE9iamVjdC5oZWlnaHRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3ZlcyB0aGUgY3Vyc29yIHRvIGBuZXdQb3NpdGlvbmAsIHdoaWNoIHNob3VsZCBiZSBiZXR3ZWVuIDAgYW5kXG4gICAgICogdGhpcy50ZXh0Lmxlbmd0aCAoaW5jbHVzaXZlKS5cbiAgICAgKi9cbiAgICBwcml2YXRlIG1vdmVDdXJzb3IobmV3UG9zaXRpb246IG51bWJlcikge1xuICAgICAgICBpZiAobmV3UG9zaXRpb24gPCAwKSBuZXdQb3NpdGlvbiA9IDA7XG4gICAgICAgIGlmIChuZXdQb3NpdGlvbiA+IHRoaXMudGV4dC5sZW5ndGgpIG5ld1Bvc2l0aW9uID0gdGhpcy50ZXh0Lmxlbmd0aDtcblxuICAgICAgICBsZXQgdGV4dFBhcnQgPSB0aGlzLnRleHQuc2xpY2UoMCwgbmV3UG9zaXRpb24pO1xuICAgICAgICB0aGlzLmN1cnNvciA9IG5ld1Bvc2l0aW9uO1xuICAgICAgICBsZXQgbWVhc3VyZWRXaWR0aCA9IHRleHRQYXJ0Lmxlbmd0aCA+IDAgP1xuICAgICAgICAgICAgdGhpcy5tZWFzdXJlVGV4dCh0ZXh0UGFydCkud2lkdGggOiAwO1xuICAgICAgICB0aGlzLmN1cnNvck9iamVjdC5wb3NpdGlvbi54ID0gbWVhc3VyZWRXaWR0aCArIHRoaXMucGFkZGluZztcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIGN1cnJlbnRseSBlbnRlcmVkIHRleHQuICovXG4gICAgZ2V0VGV4dCgpIHsgcmV0dXJuIHRoaXMudGV4dDsgfVxuXG4gICAgLyoqIFNldHMgdGhlIGtleWNvZGUgY29udmVydGVyLiAqL1xuICAgIHNldEtleUNvZGVDb252ZXJ0ZXIoY29udmVydGVyOiAoa2V5Q29kZTogbnVtYmVyKSA9PiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5rZXlDb2RlVG9DaGFyID0gY29udmVydGVyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogU2V0cyB0aGUgbWF4IGxlbmd0aC4gKi9cbiAgICBzZXRNYXhMZW5ndGgobWF4TGVuZ3RoOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5tYXhMZW5ndGggPSBtYXhMZW5ndGg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBTZXRzIHRoZSBrZXkgZmlsdGVyLiAqL1xuICAgIHNldEtleUZpbHRlcihmaWx0ZXI6IChrZXlDb2RlOiBudW1iZXIpID0+IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5rZXlGaWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEhvd2xlciwgSG93bCB9IGZyb20gJ2hvd2xlcic7XG5cblxuZXhwb3J0IGVudW0gU291bmRzIHtcbiAgICBQTE9QLCBQTE9QX1FVSUVUXG59XG5cbmV4cG9ydCBjbGFzcyBBdWRpbyB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgc291bmRzOiB7W2tleTogc3RyaW5nXTogSG93bH07XG5cbiAgICBzdGF0aWMgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKEF1ZGlvLnNvdW5kcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBBdWRpby5zb3VuZHMgPSB7fTtcbiAgICAgICAgICAgIEF1ZGlvLnNvdW5kc1tTb3VuZHMuUExPUF0gPSBuZXcgSG93bCh7XG4gICAgICAgICAgICAgICAgLy8gbXAzIGlzIHB1YmxpYyBkb21haW4sIGRvd25sb2FkZWQgZnJvbVxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9zb3VuZGJpYmxlLmNvbS8yMDY3LUJsb3AuaHRtbFxuICAgICAgICAgICAgICAgIHNyYzogWydzb3VuZHMvQmxvcC1NYXJrX0RpQW5nZWxvLTc5MDU0MzM0Lm1wMyddLFxuICAgICAgICAgICAgICAgIHZvbHVtZTogMC4xXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBwbGF5KHNvdW5kOiBTb3VuZHMpIHtcbiAgICAgICAgQXVkaW8uaW5pdGlhbGl6ZSgpO1xuICAgICAgICBsZXQgaG93bCA9IEF1ZGlvLnNvdW5kc1tzb3VuZF07XG4gICAgICAgIGlmIChob3dsICE9IG51bGwpIHtcbiAgICAgICAgICAgIGhvd2wucGxheSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuQXVkaW8uaW5pdGlhbGl6ZSgpO1xuIiwibGV0IGNsYW1wID0gKG51bTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpID0+XG4gICAgTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIG51bSkpO1xuXG5leHBvcnQgY2xhc3MgQ29vcmRVdGlscyB7XG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBjb29yZGluYXRlIGFuZCBzaXplIChhbGwgaW4gaW50ZWdlcnMpLCB0aGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuXG4gICAgICogdGhlIGluZGV4IG9mIHRoYXQgY29vcmRpbmF0ZSBpbiBhIGZsYXQgYXJyYXkuXG4gICAgICovXG4gICAgc3RhdGljIGNvb3JkVG9JbmRleCh4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG91bGRDbGFtcDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICAgICAgeCA9IHh8MDtcbiAgICAgICAgeSA9IHl8MDtcbiAgICAgICAgaWYgKHNob3VsZENsYW1wKSB7XG4gICAgICAgICAgICB4ID0gY2xhbXAoeCwgMCwgd2lkdGggLSAxKTtcbiAgICAgICAgICAgIHkgPSBjbGFtcCh5LCAwLCBoZWlnaHQgLSAxKTtcbiAgICAgICAgfSBlbHNlIGlmICh4IDwgMCB8fCB5IDwgMCB8fCB4ID49IHdpZHRoIHx8IHkgPj0gaGVpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geSAqIHdpZHRoICsgeDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhbiBpbmRleCBhbmQgc2l6ZSwgdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgY29vcmRpbmF0ZS4gVGhpc1xuICAgICAqIGZ1bmN0aW9uIGlzIHRoZSBpbnZlcnNlIG9mIGNvb3JkVG9JbmRleC5cbiAgICAgKi9cbiAgICBzdGF0aWMgaW5kZXhUb0Nvb3JkKGluZGV4OiBudW1iZXIsIHdpZHRoOiBudW1iZXIpIHtcbiAgICAgICAgaW5kZXggPSBpbmRleHwwO1xuICAgICAgICB3aWR0aCA9IHdpZHRofDA7XG4gICAgICAgIGxldCB4ID0gaW5kZXggJSB3aWR0aDtcbiAgICAgICAgbGV0IHkgPSAoaW5kZXggLSB4KSAvIHdpZHRoO1xuICAgICAgICByZXR1cm4ge3g6IHgsIHk6IHl9O1xuICAgIH1cbn1cbiIsImltcG9ydCBQSVhJID0gcmVxdWlyZSgncGl4aS5qcycpO1xuXG5pbXBvcnQgeyBBcnJvd1NxdWFyZVR5cGUgfSBmcm9tICcuL2Fycm93cy9hcnJvd3MnO1xuaW1wb3J0IHsgQXJyb3dCb2FyZFJlbmRlcmVyIH0gZnJvbSAnLi9hcnJvd3MvYXJyb3ctYm9hcmQtcmVuZGVyZXInO1xuaW1wb3J0IHsgQXJyb3dCb2FyZENvbnRyb2xsZXIgfSBmcm9tICcuL2Fycm93cy9hcnJvdy1ib2FyZC1jb250cm9sbGVyJztcbmltcG9ydCB7IEJvYXJkLCBCb2FyZFNxdWFyZUluaXRpYWxpemVyIH0gZnJvbSAnLi9ib2FyZC9ib2FyZCc7XG5pbXBvcnQgeyBDaGVja2VyIH0gZnJvbSAnLi9jaGVja2VyL2NoZWNrZXInO1xuaW1wb3J0IHsgQ2hlY2tlckNvbnRyb2xsZXIgfSBmcm9tICcuL2NoZWNrZXIvY2hlY2tlci1jb250cm9sbGVyJztcbmltcG9ydCB7IENoZWNrZXJSZW5kZXJlciB9IGZyb20gJy4vY2hlY2tlci9jaGVja2VyLXJlbmRlcmVyJztcblxuLy8gQ3VzdG9tIFBJWEkgY29udHJvbHMvc3R5bGluZ1xuaW1wb3J0IHsgQnV0dG9uU3R5bGVzIH0gZnJvbSAnLi9yZW5kZXJhYmxlL3dpZGdldHMvYnV0dG9uLXN0eWxlJztcbmltcG9ydCB7IFBJWElCdXR0b24gfSBmcm9tICcuL3JlbmRlcmFibGUvd2lkZ2V0cy9waXhpLWJ1dHRvbic7XG5pbXBvcnQgeyBQSVhJVGV4dElucHV0IH0gZnJvbSAnLi9yZW5kZXJhYmxlL3dpZGdldHMvcGl4aS10ZXh0LWlucHV0JztcbmltcG9ydCB7IFBJWElIU3RhY2ssIFBJWElWU3RhY2sgfSBmcm9tICcuL3JlbmRlcmFibGUvd2lkZ2V0cy9waXhpLXN0YWNrJztcblxuaW1wb3J0IHsgQXVkaW8sIFNvdW5kcyB9IGZyb20gJy4vdXRpbC9hdWRpbyc7XG5cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSB3b3JsZCwgb3IgdGhlIGFwcC4gVGhpcyBjbGFzcyBoYXMgdG9wLWxldmVsIGNvbnRyb2wgb3ZlciBhbGxcbiAqIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIGFwcC4gSXQgYnVpbGRzIHRoZSBVSSBhbmQgdGllcyBpdCB0byBhY3R1YWxcbiAqIGZ1bmN0aW9uYWxpdHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBXb3JsZCB7XG4gICAgcHJpdmF0ZSByZW5kZXJlcjogUElYSS5XZWJHTFJlbmRlcmVyO1xuICAgIHByaXZhdGUgc3RhZ2U6IFBJWEkuQ29udGFpbmVyO1xuXG4gICAgcHJpdmF0ZSBtYWluU3RhY2s6IFBJWEkuQ29udGFpbmVyO1xuICAgIHByaXZhdGUgbGVmdE1lbnU6IFBJWEkuQ29udGFpbmVyO1xuICAgIHByaXZhdGUgcmlnaHRTaWRlOiBQSVhJLkNvbnRhaW5lcjtcbiAgICBwcml2YXRlIHRvcEJhcjogUElYSS5Db250YWluZXI7XG4gICAgcHJpdmF0ZSBib2FyZENvbnRhaW5lcjogUElYSS5Db250YWluZXI7XG4gICAgcHJpdmF0ZSBzdGF0dXNMYWJlbDogUElYSS5UZXh0O1xuXG4gICAgcHJpdmF0ZSB1c2VDb25zdE1lbW9yeUFsZ29yaXRobTogYm9vbGVhbjtcblxuICAgIC8vIEdhbWUgc3RhdGVcbiAgICBwcml2YXRlIHBhdXNlZDogYm9vbGVhbjtcbiAgICBwcml2YXRlIGJvYXJkV2lkdGg6IG51bWJlcjtcbiAgICBwcml2YXRlIGJvYXJkSGVpZ2h0OiBudW1iZXI7XG5cbiAgICBwcml2YXRlIGJvYXJkOiBCb2FyZDxBcnJvd1NxdWFyZVR5cGU+O1xuICAgIHByaXZhdGUgYm9hcmRDb250cm9sbGVyOiBBcnJvd0JvYXJkQ29udHJvbGxlcjtcbiAgICBwcml2YXRlIGJvYXJkUmVuZGVyZXI6IEFycm93Qm9hcmRSZW5kZXJlcjtcblxuICAgIHByaXZhdGUgY2hlY2tlcjogQ2hlY2tlcjtcbiAgICBwcml2YXRlIGNoZWNrZXJSZW5kZXJlcjogQ2hlY2tlclJlbmRlcmVyO1xuICAgIHByaXZhdGUgY2hlY2tlckNvbnRyb2xsZXI6IENoZWNrZXJDb250cm9sbGVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYm9hcmRXaWR0aCA9IDEwO1xuICAgICAgICB0aGlzLmJvYXJkSGVpZ2h0ID0gMTA7XG5cbiAgICAgICAgdGhpcy51c2VDb25zdE1lbW9yeUFsZ29yaXRobSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSB0aGlzLmluaXRpYWxpemVSZW5kZXJlcigpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMucmVuZGVyZXIudmlldyk7XG4gICAgICAgIHRoaXMuc3RhZ2UgPSBuZXcgUElYSS5Db250YWluZXIoKTtcblxuICAgICAgICB0aGlzLmxlZnRNZW51ID0gdGhpcy5idWlsZExlZnRNZW51KCk7XG4gICAgICAgIHRoaXMucmlnaHRTaWRlID0gdGhpcy5idWlsZFJpZ2h0U2lkZSgpO1xuXG4gICAgICAgIHRoaXMubWFpblN0YWNrID0gbmV3IFBJWElIU3RhY2soe3BhZGRpbmc6IDEwLCBzZXBhcmF0aW9uOiAxMH0pO1xuICAgICAgICB0aGlzLnN0YWdlLmFkZENoaWxkKHRoaXMubWFpblN0YWNrKTtcbiAgICAgICAgdGhpcy5tYWluU3RhY2suYWRkQ2hpbGQodGhpcy5sZWZ0TWVudSk7XG4gICAgICAgIHRoaXMubWFpblN0YWNrLmFkZENoaWxkKHRoaXMucmlnaHRTaWRlKTtcblxuICAgICAgICB0aGlzLmNyZWF0ZU5ld0JvYXJkKCk7XG5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMuaGFuZGxlV2luZG93UmVzaXplKFxuICAgICAgICAgICAgd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCkpO1xuICAgICAgICB0aGlzLmhhbmRsZVdpbmRvd1Jlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIHNtYWxsIGhlbHBlciBmdW5jdGlvbiB0aGF0IGFsbG93cyB1cyB0byBlYXNpbHkgaW5pdGlhbGl6ZSBhbiBhcnJvd1xuICAgICAqIGJvYXJkIHdoZXJlIGFsbCB0aGUgYXJyb3dzIGFyZSBwb2ludGluZyBpbiBhIHJhbmRvbSBkaXJlY3Rpb24uXG4gICAgICovXG4gICAgcHJpdmF0ZSBhcnJvd1NxdWFyZUluaXRpYWxpemVyKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIGxldCB2ZWxvY2l0eUJhc2UgPSAoTWF0aC5yYW5kb20oKSAtIC41KSAvIDI7XG4gICAgICAgIGxldCB2ZWxvY2l0eVNpZ24gPSB2ZWxvY2l0eUJhc2UgPj0gMCA/IDEgOiAtMTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFuZ2xlOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA0KSxcbiAgICAgICAgICAgIHZlbG9jaXR5OiB2ZWxvY2l0eUJhc2UgKyB2ZWxvY2l0eVNpZ24gKiAwLjJcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgYSBQSVhJIHJlbmRlcmVyIGFuZCByZXR1cm5zIGl0LlxuICAgICAqL1xuICAgIHByaXZhdGUgaW5pdGlhbGl6ZVJlbmRlcmVyKCkge1xuICAgICAgICBjb25zdCByZW5kZXJlcjogUElYSS5XZWJHTFJlbmRlcmVyID0gbmV3IFBJWEkuV2ViR0xSZW5kZXJlcigxMjgwLCA3MjApO1xuICAgICAgICAvLyBGb3IgdGhlIE1hY0Jvb2tzIHdpdGggcmV0aW5hIGRpc3BsYXlzLCA0IGlzIGEgZ29vZCBudW1iZXIgaGVyZS5cbiAgICAgICAgLy8gSSdkIGd1ZXNzIHRoYXQgMiB3b3VsZCBiZSBhIGdvb2QgbnVtYmVyIGZvciBub24tcmV0aW5hIGRpc3BsYXlzLlxuICAgICAgICByZW5kZXJlci5yZXNvbHV0aW9uID0gNDtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJhc2VkIG9uIHRoZSB2YWx1ZSBvZiBgdXNlQ29uc3RNZW1vcnlBbGdvcml0aG1gLCByZXR1cm5zIHRoZSBsYWJlbCBvZiBhXG4gICAgICogYnV0dG9uIHRoYXQgd291bGQgc3dpdGNoIHRvIHRoZSBvcHBvc2l0ZS9uZXh0IG1vZGUuXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXRBbGdvcml0aG1CdXR0b25MYWJlbCgpIHtcbiAgICAgICAgbGV0IHRvQ29uc3RhbnRUaW1lTGFiZWwgPSAnU3dpdGNoIHRvIENvbnN0YW50IE1lbW9yeSc7XG4gICAgICAgIGxldCB0b0hhc2hNYXBMYWJlbCA9ICdTd2l0Y2ggdG8gSGFzaE1hcCc7XG4gICAgICAgIHJldHVybiAodGhpcy51c2VDb25zdE1lbW9yeUFsZ29yaXRobSA/XG4gICAgICAgICAgICAgICAgdG9IYXNoTWFwTGFiZWwgOiB0b0NvbnN0YW50VGltZUxhYmVsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgdGhlIGxlZnQgbWVudS4gUmV0dXJucyBhIGBQSVhJLkNvbnRhaW5lcmAsIHdoaWNoIGNvbnRhaW5zIGFsbCB0aGVcbiAgICAgKiBidXR0b25zIGxhaWQgb3V0IHZlcnRpY2FsbHkuIENvbnRhaW5zIHRoZSBmb2xsb3dpbmcgYnV0dG9uczpcbiAgICAgKiBgU3RhcnRgOiBVbnBhdXNlcyB0aGUgZ2FtZSBpZiBpdCBpcyBwYXVzZWQuXG4gICAgICogYFN0b3BgOiBQYXVzZXMgdGhlIGdhbWUgaWYgaXQgdW5wYXVzZWQuXG4gICAgICogYFJlc2V0YDogUmVzZXRzIHRoZSBib2FyZCBhbmQgbW92ZXMgdGhlIGNoZWNrZXIgdG8gYSBuZXcgcmFuZG9tIHBvc2l0aW9uLlxuICAgICAqIGBTaHVmZmxlIEFycm93c2A6IFJlc2V0cyB0aGUgYm9hcmQsIGJ1dCBkb2VzIG5vdCBtb3ZlIHRoZSBjaGVja2VyLlxuICAgICAqIGBjb25zdGFudE1lbW9yeUJ1dHRvbmA6IFN3aXRjaGVzIGJldHdlZW4gdGhlIHR3byBpbXBsZW1lbnRlZCBhbGdvcml0aG1zOlxuICAgICAqICAgICBBIGhhc2htYXAgdmVyc2lvbiB0aGF0IGlzIE8oTSkgaW4gbWVtb3J5IGdyb3d0aCAod2hlcmUgTSBpcyB0aGUgdG90YWxcbiAgICAgKiAgICAgICAgIG51bWJlciBvZiBzcXVhcmVzKS5cbiAgICAgKiAgICAgQW4gaW1wbGVtZW50YXRpb24gb2YgRmxveWQncyBUb3J0b2lzZSBhbmQgSGFyZSBhbGdvcml0aG0sIHdoaWNoIGlzXG4gICAgICogICAgICAgICBjb25zdGFudCBtZW1vcnkgY29tcGxleGl0eS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGJ1aWxkTGVmdE1lbnUoKTogUElYSS5Db250YWluZXIge1xuICAgICAgICBsZXQgYnV0dG9uV2lkdGggPSAxOTA7XG4gICAgICAgIGxldCBzdGFjayA9IG5ldyBQSVhJVlN0YWNrKHtzZXBhcmF0aW9uOiAxMH0pO1xuICAgICAgICBzdGFjay5hZGRDaGlsZChcbiAgICAgICAgICAgIG5ldyBQSVhJQnV0dG9uKCdTdGFydCcsIGJ1dHRvbldpZHRoLCAzNCwgQnV0dG9uU3R5bGVzLlNVQ0NFU1MpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLmhhbmRsZVN0YXJ0R2FtZSgpKSk7XG4gICAgICAgIHN0YWNrLmFkZENoaWxkKFxuICAgICAgICAgICAgbmV3IFBJWElCdXR0b24oJ1N0b3AnLCBidXR0b25XaWR0aCwgMzQsIEJ1dHRvblN0eWxlcy5XQVJOSU5HKVxuICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge2NvbnNvbGUubG9nKCdzdG9wJyk7IHRoaXMuaGFuZGxlU3RvcEdhbWUoKX0pKTtcbiAgICAgICAgc3RhY2suYWRkQ2hpbGQoXG4gICAgICAgICAgICBuZXcgUElYSUJ1dHRvbignUmVzZXQnLCBidXR0b25XaWR0aCwgMzQsIEJ1dHRvblN0eWxlcy5EQU5HRVIpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLmhhbmRsZVJlc2V0R2FtZSgpKSk7XG4gICAgICAgIHN0YWNrLmFkZENoaWxkKFxuICAgICAgICAgICAgbmV3IFBJWElCdXR0b24oXG4gICAgICAgICAgICAgICAgJ1NodWZmbGUgQXJyb3dzJywgYnV0dG9uV2lkdGgsIDM0LCBCdXR0b25TdHlsZXMuU1VDQ0VTUylcbiAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHRoaXMuaGFuZGxlU2h1ZmZsZUFycm93cygpKSk7XG5cbiAgICAgICAgbGV0IGNvbnN0YW50TWVtb3J5QnV0dG9uID0gbmV3IFBJWElCdXR0b24oXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRBbGdvcml0aG1CdXR0b25MYWJlbCgpLCBidXR0b25XaWR0aCwgMzQsXG4gICAgICAgICAgICAgICAgQnV0dG9uU3R5bGVzLldBUk5JTkcpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NsaWNrIScpO1xuICAgICAgICAgICAgICAgIGNvbnN0YW50TWVtb3J5QnV0dG9uLnNldExhYmVsKHRoaXMuaGFuZGxlVG9nZ2xlQWxnb3JpdGhtKCkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgc3RhY2suYWRkQ2hpbGQoY29uc3RhbnRNZW1vcnlCdXR0b24pXG4gICAgICAgIHJldHVybiBzdGFjaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIFVJIHdoaWNoIGNvbnRhaW5zIHRoZSB0b3AgYmFyIGFuZCB0aGUgYm9hcmQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFJpZ2h0U2lkZSgpOiBQSVhJLkNvbnRhaW5lciB7XG4gICAgICAgIGxldCBjb250YWluZXIgPSBuZXcgUElYSVZTdGFjayh7c2VwYXJhdGlvbjogMTB9KTtcbiAgICAgICAgY29udGFpbmVyLmFkZENoaWxkKHRoaXMudG9wQmFyID0gdGhpcy5idWlsZFRvcEJhcigpKTtcbiAgICAgICAgY29udGFpbmVyLmFkZENoaWxkKHRoaXMuYm9hcmRDb250YWluZXIgPSBuZXcgUElYSS5Db250YWluZXIoKSk7XG4gICAgICAgIHJldHVybiBjb250YWluZXJcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIGhlbHBlciBtZXRob2QgdGhhdCBzZXRzIHVwIGEgdGV4dCBpbnB1dCBmb3IgbnVtYmVyIGVudHJ5LlxuICAgICAqL1xuICAgIHByaXZhdGUgc2V0dXBTaXplSW5wdXQoaW5pdGlhbFZhbHVlOiBzdHJpbmcpIDogUElYSVRleHRJbnB1dCB7XG4gICAgICAgIGxldCBpbnB1dCA9IG5ldyBQSVhJVGV4dElucHV0KGluaXRpYWxWYWx1ZSwgNjUsIDMwLCB7XG4gICAgICAgICAgICAgICAgdGV4dDoge2ZvbnRTaXplOiAxNX0sIGNvbG9yOiAweEZGRkZGRixcbiAgICAgICAgICAgICAgICBib3JkZXI6IHt3aWR0aDogMSwgY29sb3I6IDB4ODg4ODg4fX0pXG4gICAgICAgICAgICAuc2V0S2V5RmlsdGVyKChrZXlDb2RlOiBudW1iZXIpID0+IChrZXlDb2RlID49IDQ4ICYmIGtleUNvZGUgPCA1OCkpXG4gICAgICAgICAgICAuc2V0S2V5Q29kZUNvbnZlcnRlcigoa2V5Q29kZTogbnVtYmVyKSA9PiBTdHJpbmcoa2V5Q29kZSAtIDQ4KSlcbiAgICAgICAgICAgIC5zZXRNYXhMZW5ndGgoNCk7XG4gICAgICAgIGlucHV0Lm9uKCdmb2N1cycsIHRoaXMudW5mb2N1c0FsbEV4Y2VwdChpbnB1dCkpO1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQnVpbGRzIHRoZSB0b3AgYmFyLCB3aGljaCBjb250YWlucyB0aGUgdHdvIHRleHQgaW5wdXRzIG5lY2Vzc2FyeSB0b1xuICAgICAqIGNoYW5nZSB0aGUgYm9hcmQgc2l6ZSwgYW5kIGEgYnV0dG9uIHRvIGFwcGx5IHRoZSBjaGFuZ2U7IGFzIHdlbGwgYXMgYVxuICAgICAqIGxhYmVsIHRoYXQgc2hvd3MgdGhlIGN1cnJlbnQgc3RhdHVzLlxuICAgICAqL1xuICAgIHByaXZhdGUgYnVpbGRUb3BCYXIoKTogUElYSS5Db250YWluZXIge1xuICAgICAgICBsZXQgd2lkdGhJbnB1dCA9IHRoaXMuc2V0dXBTaXplSW5wdXQoU3RyaW5nKHRoaXMuYm9hcmRXaWR0aCkpO1xuICAgICAgICBsZXQgaGVpZ2h0SW5wdXQgPSB0aGlzLnNldHVwU2l6ZUlucHV0KFN0cmluZyh0aGlzLmJvYXJkSGVpZ2h0KSk7XG5cbiAgICAgICAgbGV0IGhzdGFjayA9IG5ldyBQSVhJSFN0YWNrKHtzZXBhcmF0aW9uOiAxMH0pO1xuICAgICAgICBoc3RhY2suYWRkQ2hpbGQod2lkdGhJbnB1dCk7XG4gICAgICAgIGhzdGFjay5hZGRDaGlsZChuZXcgUElYSS5UZXh0KFxuICAgICAgICAgICAgJ3gnLCB7Zm9udEZhbWlseTogJ0FyaWFsJywgZm9udFNpemU6IDE4LCBmaWxsOiAweGZmZmZmZn0pKTtcbiAgICAgICAgaHN0YWNrLmFkZENoaWxkKGhlaWdodElucHV0KTtcbiAgICAgICAgaHN0YWNrLmFkZENoaWxkKG5ldyBQSVhJQnV0dG9uKFxuICAgICAgICAgICAgJ0NoYW5nZSBCb2FyZCBTaXplJywgMTQwLCAzMCwgQnV0dG9uU3R5bGVzLlNVQ0NFU1MpLm9uQ2xpY2soXG4gICAgICAgICAgICAoKSA9PiB0aGlzLmhhbmRsZUJvYXJkUmVzaXplKFxuICAgICAgICAgICAgICAgIHdpZHRoSW5wdXQuZ2V0VGV4dCgpLCBoZWlnaHRJbnB1dC5nZXRUZXh0KCkpKSk7XG4gICAgICAgIGhzdGFjay5hZGRDaGlsZCh0aGlzLnN0YXR1c0xhYmVsID0gbmV3IFBJWEkuVGV4dChcbiAgICAgICAgICAgICdTZWFyY2hpbmcuLi4nLCB7ZmlsbDogQnV0dG9uU3R5bGVzLldBUk5JTkcuY29sb3JzLm5vcm1hbH0pKVxuICAgICAgICByZXR1cm4gaHN0YWNrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHRleHQgZGlzcGxheWVkIG9uIHRoZSBzdGF0dXMgbGFiZWwuXG4gICAgICovXG4gICAgcHJpdmF0ZSBzZXRTdGF0dXMobmV3U3RhdHVzOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNMYWJlbC50ZXh0ID0gbmV3U3RhdHVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGNoZWNrZXIsIGlmIHRoZXJlIGlzIG9uZSwgYW5kIHJlaW5zdGFudGlhdGVzIGFsbCB0aGUgY2xhc3Nlc1xuICAgICAqIGFzc29jaWF0ZWQgd2l0aCB0aGUgYm9hcmQuXG4gICAgICovXG4gICAgY3JlYXRlTmV3Qm9hcmQoKSB7XG4gICAgICAgIC8vIElmIGEgY2hlY2tlciBleGlzdHMsIHJlbW92ZSBpdHMgcmVuZGVyZWQgZWxlbWVudCBhbmQgcmVzZXQgYWxsXG4gICAgICAgIC8vIGNoZWNrZXItcmVsYXRlZCBwcm9wZXJ0aWVzLlxuICAgICAgICBpZiAodGhpcy5jaGVja2VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGxldCByZW5kZXJlZENoZWNrZXIgPSB0aGlzLmNoZWNrZXJSZW5kZXJlci5nZXRSZW5kZXJlZCgpO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVkQ2hlY2tlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ib2FyZENvbnRhaW5lci5yZW1vdmVDaGlsZChyZW5kZXJlZENoZWNrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jaGVja2VyID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlckNvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyUmVuZGVyZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIGJvYXJkLlxuICAgICAgICB0aGlzLmJvYXJkID0gbmV3IEJvYXJkPEFycm93U3F1YXJlVHlwZT4oXG4gICAgICAgICAgICB0aGlzLmJvYXJkV2lkdGgsIHRoaXMuYm9hcmRIZWlnaHQsIHRoaXMuYXJyb3dTcXVhcmVJbml0aWFsaXplcik7XG4gICAgICAgIHRoaXMuYm9hcmRDb250cm9sbGVyID0gbmV3IEFycm93Qm9hcmRDb250cm9sbGVyKHRoaXMuYm9hcmQpO1xuICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIgPSBuZXcgQXJyb3dCb2FyZFJlbmRlcmVyKHRoaXMuYm9hcmQpO1xuICAgICAgICAvLyBBdHRhY2ggdGhlIG5ldyBjbGljayBoYW5kbGVyLCBzaW5jZSB3ZSBoYXZlIGEgbmV3IHJlbmRlcmVyIGluc3RhbmNlLlxuICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIub25DbGljaygoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGxldCBzcXVhcmUgPSB0aGlzLmJvYXJkLmdldCh4LCB5KTtcbiAgICAgICAgICAgIGlmIChzcXVhcmUuYW5nbGUgPT09IE1hdGgucm91bmQoc3F1YXJlLmFuZ2xlKSkge1xuICAgICAgICAgICAgICAgIHNxdWFyZS5hbmdsZSA9IChzcXVhcmUuYW5nbGUgKyAxKSAlIDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmJvYXJkLnB1dChzcXVhcmUsIHgsIHkpO1xuICAgICAgICAgICAgdGhpcy5ib2FyZFJlbmRlcmVyLnVwZGF0ZSh4LCB5KTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrZXJDb250cm9sbGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXJDb250cm9sbGVyLnJlc2V0KHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gVGhpcyB3aWxsIGNsZWFyIHRoZSBib2FyZCBjb250YWluZXIgYW5kIHJlbmRlciB0aGUgYm9hcmQgaW50byB0aGVcbiAgICAgICAgLy8gcmVuZGVyZXIgdmlld3BvcnQuXG4gICAgICAgIHRoaXMucmVyZW5kZXJCb2FyZCgpO1xuICAgICAgICAvLyBTcGluIHRoZSBhcnJvd3MgZm9yIGVmZmVjdC5cbiAgICAgICAgdGhpcy5ib2FyZENvbnRyb2xsZXIuaW5pdGlhdGVSb3RhdGlvbigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsZWFycyB0aGUgYm9hcmQgY29udGFpbmVyIGFuZCBhdHRhY2hlcyBhIG5ld2x5IHJlbmRlcmVkIGJvYXJkLlxuICAgICAqL1xuICAgIHByaXZhdGUgcmVyZW5kZXJCb2FyZCgpIHtcbiAgICAgICAgbGV0IGJvYXJkQ29udGFpbmVyQm91bmRzID0gdGhpcy5ib2FyZENvbnRhaW5lci5nZXRCb3VuZHMoKTtcbiAgICAgICAgdGhpcy5ib2FyZENvbnRhaW5lci5yZW1vdmVDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIuY2xlYXJSZW5kZXJlZCgpO1xuICAgICAgICB0aGlzLmJvYXJkQ29udGFpbmVyLmFkZENoaWxkKHRoaXMuYm9hcmRSZW5kZXJlci5yZW5kZXIoXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLndpZHRoIC0gYm9hcmRDb250YWluZXJCb3VuZHMubGVmdCxcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuaGVpZ2h0IC0gYm9hcmRDb250YWluZXJCb3VuZHMudG9wKSk7XG4gICAgICAgIGlmICh0aGlzLmNoZWNrZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5ib2FyZENvbnRhaW5lci5hZGRDaGlsZCh0aGlzLmNoZWNrZXJSZW5kZXJlci5yZW5kZXIoXG4gICAgICAgICAgICAgICAgdGhpcy5ib2FyZFJlbmRlcmVyLmdldFNxdWFyZVNpemUoKSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBzbWFsbCBoZWxwZXIgZnVuY3Rpb24sIHdoaWNoIHdpbGwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGVtaXQgdGhlXG4gICAgICogJ3VuZm9jdXMnIGV2ZW50IHRvIGFsbCBvYmplY3RzIGluIHRoZSBzY2VuZSBncmFwaCBleGNlcHQgdGhlIG9iamVjdFxuICAgICAqIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uLlxuICAgICAqIFRoaXMgaXMgdXNlZnVsIGZvciBjb250cm9sbGluZyB3aGljaCB0ZXh0IGlucHV0IGlzIGZvY3VzZWQuXG4gICAgICovXG4gICAgcHJpdmF0ZSB1bmZvY3VzQWxsRXhjZXB0KGNvbnRyb2w6IFBJWEkuRGlzcGxheU9iamVjdCkge1xuICAgICAgICByZXR1cm4gKCkgPT4geyAgLy8gQXJyb3cgZnVuY3Rpb24gdG8gY2FwdHVyZSB0aGlzLlxuICAgICAgICAgICAgbGV0IHN0YWNrOiBQSVhJLkRpc3BsYXlPYmplY3RbXSA9IFt0aGlzLnN0YWdlXTtcbiAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbnRhaW5lciA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIgIT09IGNvbnRyb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmVtaXQoJ3VuZm9jdXMnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lciBpbnN0YW5jZW9mIFBJWEkuQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGRyZW4gPSBjb250YWluZXIuY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChjaGlsZHJlbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkLiBUaGlzIG1ldGhvZCByZXNpemVzIHRoZSByZW5kZXJlcixcbiAgICAgKiByZXJlbmRlcnMgdGhlIGJvYXJkIGFuZCB1cGRhdGVzIHRoZSBjaGVja2VyLlxuICAgICAqL1xuICAgIHByaXZhdGUgaGFuZGxlV2luZG93UmVzaXplKG5ld1dpZHRoOiBudW1iZXIsIG5ld0hlaWdodDogbnVtYmVyKSB7XG4gICAgICAgIGxldCBvbGRWaWV3ID0gdGhpcy5yZW5kZXJlci52aWV3O1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlc2l6ZShuZXdXaWR0aCwgbmV3SGVpZ2h0KTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci52aWV3LndpZHRoID0gbmV3V2lkdGg7XG4gICAgICAgIHRoaXMucmVuZGVyZXIudmlldy5oZWlnaHQgPSBuZXdIZWlnaHQ7XG4gICAgICAgIHRoaXMucmVyZW5kZXJCb2FyZCgpO1xuICAgICAgICBpZiAodGhpcy5jaGVja2VyUmVuZGVyZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyUmVuZGVyZXIuc2V0U3F1YXJlU2l6ZShcbiAgICAgICAgICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIuZ2V0U3F1YXJlU2l6ZSgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSB1c2VyIHdhbnRzIHRvIGNoYW5nZSB0aGUgYm9hcmQgc2l6ZS4gRGlyZWN0bHkgdGFrZXNcbiAgICAgKiBzdHJpbmdzIHRoYXQgd2lsbCByZXByZXNlbnQgdGhlIG5ldyBib2FyZCB3aWR0aCBhbmQgaGVpZ2h0LlxuICAgICAqIElmIGVpdGhlciB2YWx1ZSBpcyBlbXB0eSBvciBudWxsLCB0aGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcuXG4gICAgICovXG4gICAgcHJpdmF0ZSBoYW5kbGVCb2FyZFJlc2l6ZSh3aWR0aFN0cjogc3RyaW5nLCBoZWlnaHRTdHI6IHN0cmluZykge1xuICAgICAgICBpZiAod2lkdGhTdHIgIT0gbnVsbCAmJiB3aWR0aFN0ci5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICBoZWlnaHRTdHIgIT0gbnVsbCAmJiBoZWlnaHRTdHIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IHdpZHRoID0gcGFyc2VJbnQod2lkdGhTdHIsIDEwKTtcbiAgICAgICAgICAgIGxldCBoZWlnaHQgPSBwYXJzZUludChoZWlnaHRTdHIsIDEwKTtcbiAgICAgICAgICAgIGlmICh3aWR0aCA+IDAgJiYgaGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRXaWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVOZXdCb2FyZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFVucGF1c2VzIHRoZSBnYW1lLiAqL1xuICAgIHByaXZhdGUgaGFuZGxlU3RhcnRHYW1lKCkge1xuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKiBQYXVzZXMgdGhlIGdhbWUuICovXG4gICAgcHJpdmF0ZSBoYW5kbGVTdG9wR2FtZSgpIHtcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNldFN0YXR1cygnUGF1c2VkJyk7XG4gICAgfVxuXG4gICAgLyoqIFJlc2V0cyB0aGUgZ2FtZSBieSBzcGlubmluZyB0aGUgYXJyb3dzIGFuZCByZXNldHRpbmcgdGhlIGNoZWNrZXIuICovXG4gICAgcHJpdmF0ZSBoYW5kbGVSZXNldEdhbWUoKSB7XG4gICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY3JlYXRlTmV3Qm9hcmQoKTtcbiAgICB9XG5cbiAgICAvKiogU2h1ZmZsZXMgdGhlIGFycm93cyB3aXRob3V0IG1vdmluZyB0aGUgY2hlY2tlci4gKi9cbiAgICBwcml2YXRlIGhhbmRsZVNodWZmbGVBcnJvd3MoKSB7XG4gICAgICAgIGlmICh0aGlzLmNoZWNrZXJDb250cm9sbGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlckNvbnRyb2xsZXIucmVzZXQodGhpcy51c2VDb25zdE1lbW9yeUFsZ29yaXRobSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ib2FyZENvbnRyb2xsZXIuaW5pdGlhdGVSb3RhdGlvbigpO1xuICAgIH1cblxuICAgIC8qKiBUb2dnbGVzIHdoZXRoZXIgdGhlIGNvbnN0YW50IG1lbW9yeSBhbGdvcml0aG0gc2hvdWxkIGJlIHVzZWQuICovXG4gICAgcHJpdmF0ZSBoYW5kbGVUb2dnbGVBbGdvcml0aG0oKTogc3RyaW5nIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2hhbmRsaW5nLi4uJyk7XG4gICAgICAgIHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0gPSAhdGhpcy51c2VDb25zdE1lbW9yeUFsZ29yaXRobTtcbiAgICAgICAgaWYgKHRoaXMuY2hlY2tlckNvbnRyb2xsZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyQ29udHJvbGxlci5yZXNldCh0aGlzLnVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5nZXRBbGdvcml0aG1CdXR0b25MYWJlbCgpO1xuICAgIH1cblxuICAgIC8qKiBVcGRhdGVzIHRoZSB3b3JsZC4gKi9cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlZCkgcmV0dXJuO1xuICAgICAgICBpZiAoIXRoaXMuYm9hcmRDb250cm9sbGVyLnVwZGF0ZSgpKSB7XG4gICAgICAgICAgICAvLyBJZiBhcmUgaW4gdGhpcyBibG9jaywgdGhhdCBtZWFucyBhbGwgYXJyb3dzIGFyZSBkb25lIHNwaW5uaW5nLlxuICAgICAgICAgICAgLy8gSW4gdGhpcyBjYXNlLCB3ZSBtaWdodCBlaXRoZXIgaGF2ZSB0byBjcmVhdGUgYSByYW5kb20gY2hlY2tlciBvclxuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBleGlzdGluZyBvbmUuXG4gICAgICAgICAgICBpZiAodGhpcy5jaGVja2VyID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIudXBkYXRlQWxsKCk7XG4gICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgYSByYW5kb20gcG9zaXRpb24uXG4gICAgICAgICAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5ib2FyZC5nZXRXaWR0aCgpXG4gICAgICAgICAgICAgICAgbGV0IGkgPSBNYXRoLmZsb29yKFxuICAgICAgICAgICAgICAgICAgICBNYXRoLnJhbmRvbSgpICogd2lkdGggKiB0aGlzLmJvYXJkLmdldEhlaWdodCgpKTtcbiAgICAgICAgICAgICAgICBsZXQgeCA9IGkgJSB3aWR0aDtcbiAgICAgICAgICAgICAgICBsZXQgeSA9IChpIC0geCkgLyB3aWR0aDtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgb3VyIGNoZWNrZXIgYW5kIGFzc29jaWF0ZWQgb2JqZWN0cy5cbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXIgPSBuZXcgQ2hlY2tlcih4LCB5KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXJDb250cm9sbGVyID0gbmV3IENoZWNrZXJDb250cm9sbGVyKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJvYXJkLCB0aGlzLmNoZWNrZXIsIHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tlclJlbmRlcmVyID0gbmV3IENoZWNrZXJSZW5kZXJlcih0aGlzLmNoZWNrZXIpXG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyIHRoZSBjaGVja2VyIG9uIHRoZSBib2FyZC4gVGhpcyBpcyBjb252ZW5pZW50IGJlY2F1c2VcbiAgICAgICAgICAgICAgICAvLyB0aGlzIHdheSB0aGUgY2hlY2tlciB3aWxsIGhhdmUgdGhlIHNhbWUgb2Zmc2V0IGFzIHRoZSBib2FyZC5cbiAgICAgICAgICAgICAgICB0aGlzLmJvYXJkQ29udGFpbmVyLmFkZENoaWxkKHRoaXMuY2hlY2tlclJlbmRlcmVyLnJlbmRlcihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ib2FyZFJlbmRlcmVyLmdldFNxdWFyZVNpemUoKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXJDb250cm9sbGVyLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tlclJlbmRlcmVyLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrZXJDb250cm9sbGVyLmhhc0RldGVjdGVkQ3ljbGUoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXR1cygnRGV0ZWN0ZWQgY3ljbGUnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY2hlY2tlckNvbnRyb2xsZXIuaGFzRGV0ZWN0ZWRFZGdlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoJ0RldGVjdGVkIGVkZ2UnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXR1cygnU2VhcmNoaW5nLi4uJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETzogRnV0dXJlIHdvcmssIHdlIGNvdWxkIGRvIGJldHRlciBoZXJlIGJ5IGhhdmluZ1xuICAgICAgICAgICAgLy8gQXJyb3dCb2FyZENvbnRyb2xsZXIudXBkYXRlIHJldHVybiB0aGUgdXBkYXRlZCBzcXVhcmVcbiAgICAgICAgICAgIC8vIGNvb3JkaW5hdGVzLCBzbyB3ZSBjb3VsZCBvbmx5IHVwZGF0ZSB0aG9zZS5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdHVzKCdJbml0aWFsaXppbmcuLi4nKTtcbiAgICAgICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlci51cGRhdGVBbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5zdGFnZSk7XG4gICAgfVxufVxuIl19
