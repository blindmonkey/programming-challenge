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
                if (value.angle < 0) {
                    value.angle += 4;
                }
                if (value.angle >= 4) {
                    value.angle -= 4;
                }
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
     * Gets the difference of two angles represented in the form described in
     * {@see ArrowSquareType}.
     */
    getAngleDifference(angle1, angle2) {
        angle1 = angle1 % 4;
        if (angle1 < 0) {
            angle1 += 4;
        }
        angle2 = angle2 % 4;
        if (angle2 < 0) {
            angle2 += 4;
        }
        // The logic here is to support the following cases:
        // angle1 = 0.1, angle2 = 3.9
        // angle1 = 3.9, angle2 = 0.1
        return Math.min(Math.abs(angle1 - angle2), Math.abs(angle1 - (angle2 + 4)), Math.abs(angle1 - (angle2 - 4)));
    }
}
exports.ArrowBoardController = ArrowBoardController;

},{}],2:[function(require,module,exports){
"use strict";
const board_renderer_1 = require("../board/board-renderer");
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
            update = (newSquare) => (graphics.rotation = Math.PI / 2 * newSquare.angle);
            // Do the initial rotation assignment to match current square data.
            update(square);
        }
        return {
            container,
            update: update || (() => null),
        };
    }
}
exports.ArrowBoardRenderer = ArrowBoardRenderer;

},{"../board/board-renderer":3}],3:[function(require,module,exports){
"use strict";
const pixi_rect_1 = require("../renderable/shapes/pixi-rect");
const coord_utils_1 = require("../util/coord-utils");
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
    /** Returns the size of a single square. */
    getSquareSize() { return this.squareSize; }
    /** Registers a click event. */
    onClick(handler) {
        this.clickHandlers.push(handler);
    }
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
                cornerRadius: 0,
                fillColor: x % 2 === y % 2 ? 0x000000 : 0xffffff });
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
            squareContainer.on("pointerdown", () => {
                for (let handler of this.clickHandlers) {
                    handler(x, y);
                }
            });
            cached = {
                container: squareContainer,
                update,
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
            let boardWidth = board.getWidth();
            let boardHeight = board.getHeight();
            let squareSize = Math.floor(Math.min(viewWidth / boardWidth, viewHeight / boardHeight));
            this.squareSize = squareSize;
            this.renderedChildren = [];
            for (let y = 0; y < boardHeight; y++) {
                for (let x = 0; x < boardWidth; x++) {
                    let squareContainer = this.update(x, y);
                    let screenX = x * squareSize;
                    let screenY = y * squareSize;
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
const coord_utils_1 = require("../util/coord-utils");
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
        if (index == null) {
            return null;
        }
        return this.board[index];
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
}
exports.Board = Board;

},{"../util/coord-utils":16}],5:[function(require,module,exports){
"use strict";
const audio_1 = require("../util/audio");
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
    /**
     * Given a position offset, sets up the checker so that it will animate to
     * the square in that direction.
     */
    move(dx, dy) {
        let position = this.checker.getPosition();
        let nx = position.x + dx;
        let ny = position.y + dy;
        if (!this.constantMemory) {
            // The non-constant memory algorithm. Keeps a hashmap of visited
            // positions and checks whether the next position was visited.
            // The memory complexity is O(M), where M is the width * height of
            // the board.
            // There exists another algorithm, where one would keep a list of
            // all visited locations and compare against that. The memory
            // complexity of that algorithm would be O(N) where N would be the
            // number of moves made.
            let positionKey = nx + "/" + ny;
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
            if (angle < 0) {
                angle += 4;
            }
            let movements = [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 0, dy: -1 }];
            return movements[angle];
        }
        return null;
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
const world_1 = require("./world");
// Create the world
let world = new world_1.World();
function startLoop(f) {
    requestAnimationFrame(() => startLoop(f));
    f();
}
;
startLoop(() => {
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
            lineWidth: options && options.lineWidth || 0,
            strokeColor: options && options.strokeColor,
            width,
            height,
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
    DOWN: "down",
    HOVER: "hover",
    NORMAL: "normal",
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
        this.target.on("pointerdown", () => this.handleMouseDown());
        this.target.on("pointerup", () => this.handleMouseUp());
        this.target.on("pointerupoutside", () => this.handleMouseUp());
        this.target.on("pointermove", (event) => this.handleMouseMove(event));
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
            for (let handler of handlers) {
                handler();
            }
        }
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
    DANGER: { normal: 0xd9534f, hovered: 0xc9302c, down: 0xac2925 },
    SUCCESS: { normal: 0x5CB85C, hovered: 0x449D44, down: 0x398439 },
    WARNING: { normal: 0xf0ad4e, hovered: 0xec971f, down: 0xd58512 },
};
// Colors of the button borders, depending on the state of the button.
exports.ButtonBorderColors = {
    DANGER: { normal: 0xd43f3a, hovered: 0xac2925, down: 0x761c19 },
    SUCCESS: { normal: 0x4cae4c, hovered: 0x398439, down: 0x255625 },
    WARNING: { normal: 0xeea236, hovered: 0xd58512, down: 0x985f0d },
};
// A text style that is convenient to use for the buttons.
exports.ButtonTextStyle = {
    fill: 0xFFFFFF,
    fontFamily: "Helvetica Neue",
    fontSize: 14,
};
// Common button style configuration that can be passed directly to a
// PIXIButton.
exports.ButtonStyles = {
    DANGER: { colors: exports.ButtonColors.DANGER, text: exports.ButtonTextStyle,
        border: { width: 1, colors: exports.ButtonBorderColors.DANGER } },
    SUCCESS: { colors: exports.ButtonColors.SUCCESS, text: exports.ButtonTextStyle,
        border: { width: 1, colors: exports.ButtonBorderColors.SUCCESS } },
    WARNING: { colors: exports.ButtonColors.WARNING, text: exports.ButtonTextStyle,
        border: { width: 1, colors: exports.ButtonBorderColors.WARNING } },
};
// oppa button style

},{}],12:[function(require,module,exports){
"use strict";
const pixi_rect_1 = require("../shapes/pixi-rect");
const button_state_handler_1 = require("./button-state-handler");
function accessOrDefault(obj, path, defaultValue) {
    for (let component of path) {
        obj = obj[component];
        if (obj == null) {
            return defaultValue;
        }
    }
    return obj;
}
;
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
        let downFillColor = accessOrDefault(style, ["colors", "down"], 0x00AA00);
        let normalFillColor = accessOrDefault(style, ["colors", "normal"], 0x00FF00);
        let hoverFillColor = accessOrDefault(style, ["colors", "hovered"], 0x66FF66);
        let downBorderColor = accessOrDefault(style, ["border", "colors", "down"], downFillColor);
        let normalBorderColor = accessOrDefault(style, ["border", "colors", "normal"], normalFillColor);
        let hoverBorderColor = accessOrDefault(style, ["border", "colors", "hovered"], hoverFillColor);
        this.outline = new pixi_rect_1.PIXIRect(width, height, {
            cornerRadius, fillColor: normalFillColor,
            lineWidth: style && style.border && style.border.width || 0,
            strokeColor: normalBorderColor });
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
        this.on("click", handler);
        return this;
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
const pixi_rect_1 = require("../shapes/pixi-rect");
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
        if (backgroundColor == null) {
            backgroundColor = 0xFFFFFF;
        }
        // Initialize the graphic objects.
        this.outline = new pixi_rect_1.PIXIRect(width, height, {
            cornerRadius, fillColor: backgroundColor,
            lineWidth: style && style.border && style.border.width || 0,
            strokeColor: style && style.border && style.border.color || 0 });
        this.addChild(this.outline);
        this.measureTextObject = new PIXI.Text("", style.text);
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
        this.on("pointerdown", () => {
            // Focus on this text input.
            this.focused = true;
            this.cursorObject.alpha = 1;
            this.emit("focus");
        });
        this.on("unfocus", () => {
            // If something emits an unfocus event on this text input, it should
            // react.
            this.focused = false;
            this.cursorObject.alpha = 0;
        });
        document.addEventListener("keydown", (e) => {
            // Ignore keys when not focused.
            if (!this.focused) {
                return;
            }
            this.handleKeyDown(e.keyCode);
        });
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
            height: this.measureTextObject.height,
        };
    }
    /**
     * Moves the cursor to `newPosition`, which should be between 0 and
     * this.text.length (inclusive).
     */
    moveCursor(newPosition) {
        if (newPosition < 0) {
            newPosition = 0;
        }
        if (newPosition > this.text.length) {
            newPosition = this.text.length;
        }
        let textPart = this.text.slice(0, newPosition);
        this.cursor = newPosition;
        let measuredWidth = textPart.length > 0 ?
            this.measureText(textPart).width : 0;
        this.cursorObject.position.x = measuredWidth + this.padding;
    }
}
exports.PIXITextInput = PIXITextInput;

},{"../shapes/pixi-rect":9}],15:[function(require,module,exports){
"use strict";
const howler_1 = require("howler");
/**
 * An enumeration of identifiers for sounds used by this app.
 */
(function (Sounds) {
    Sounds[Sounds["PLOP"] = 0] = "PLOP";
})(exports.Sounds || (exports.Sounds = {}));
var Sounds = exports.Sounds;
/**
 * A class containing methods used to play sounds.
 */
class Audio {
    /** Initializes the sounds repository. */
    static initialize() {
        if (Audio.sounds == null) {
            Audio.sounds = {};
            Audio.sounds[Sounds.PLOP] = new howler_1.Howl({
                // mp3 is public domain, downloaded from
                // http://soundbible.com/2067-Blop.html
                src: ["sounds/Blop-Mark_DiAngelo-79054334.mp3"],
                volume: 0.1,
            });
        }
    }
    /** Plays the sound with the given identifier. */
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
// Initialize the audio so that the resources are preloaded before we attempt to
// play anything.
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
        return { x, y };
    }
}
exports.CoordUtils = CoordUtils;

},{}],17:[function(require,module,exports){
"use strict";
const PIXI = require("pixi.js");
const arrow_board_controller_1 = require("./arrows/arrow-board-controller");
const arrow_board_renderer_1 = require("./arrows/arrow-board-renderer");
const board_1 = require("./board/board");
const checker_1 = require("./checker/checker");
const checker_controller_1 = require("./checker/checker-controller");
const checker_renderer_1 = require("./checker/checker-renderer");
// Custom PIXI controls/styling
const button_style_1 = require("./renderable/widgets/button-style");
const pixi_button_1 = require("./renderable/widgets/pixi-button");
const pixi_stack_1 = require("./renderable/widgets/pixi-stack");
const pixi_text_input_1 = require("./renderable/widgets/pixi-text-input");
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
        window.addEventListener("resize", () => this.handleWindowResize(window.innerWidth, window.innerHeight));
        this.handleWindowResize(window.innerWidth, window.innerHeight);
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
    /** Updates the world. */
    update() {
        if (this.paused) {
            return;
        }
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
                    this.setStatus("Detected cycle");
                }
                else if (this.checkerController.hasDetectedEdge()) {
                    this.setStatus("Detected edge");
                }
                else {
                    this.setStatus("Searching...");
                }
            }
        }
        else {
            // TODO: Future work, we could do better here by having
            // ArrowBoardController.update return the updated square
            // coordinates, so we could only update those.
            this.setStatus("Initializing...");
            this.boardRenderer.updateAll();
        }
    }
    render() {
        this.renderer.render(this.stage);
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
            velocity: velocityBase + velocitySign * 0.2,
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
        let toConstantTimeLabel = "Switch to Constant Memory";
        let toHashMapLabel = "Switch to HashMap";
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
        stack.addChild(new pixi_button_1.PIXIButton("Start", buttonWidth, 34, button_style_1.ButtonStyles.SUCCESS)
            .onClick(() => this.handleStartGame()));
        stack.addChild(new pixi_button_1.PIXIButton("Stop", buttonWidth, 34, button_style_1.ButtonStyles.WARNING)
            .onClick(() => this.handleStopGame()));
        stack.addChild(new pixi_button_1.PIXIButton("Reset", buttonWidth, 34, button_style_1.ButtonStyles.DANGER)
            .onClick(() => this.handleResetGame()));
        stack.addChild(new pixi_button_1.PIXIButton("Shuffle Arrows", buttonWidth, 34, button_style_1.ButtonStyles.SUCCESS)
            .onClick(() => this.handleShuffleArrows()));
        let constantMemoryButton = new pixi_button_1.PIXIButton(this.getAlgorithmButtonLabel(), buttonWidth, 34, button_style_1.ButtonStyles.WARNING)
            .onClick(() => constantMemoryButton.setLabel(this.handleToggleAlgorithm()));
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
            border: { color: 0x888888, width: 1 }, color: 0xFFFFFF,
            text: { fontSize: 15 } })
            .setKeyFilter((keyCode) => (keyCode >= 48 && keyCode < 58))
            .setKeyCodeConverter((keyCode) => String(keyCode - 48))
            .setMaxLength(4);
        input.on("focus", this.unfocusAllExcept(input));
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
        hstack.addChild(new PIXI.Text("x", { fontFamily: "Arial", fontSize: 18, fill: 0xffffff }));
        hstack.addChild(heightInput);
        hstack.addChild(new pixi_button_1.PIXIButton("Change Board Size", 140, 30, button_style_1.ButtonStyles.SUCCESS).onClick(() => this.handleBoardResize(widthInput.getText(), heightInput.getText())));
        hstack.addChild(this.statusLabel = new PIXI.Text("Searching...", { fill: button_style_1.ButtonStyles.WARNING.colors.normal }));
        return hstack;
    }
    /**
     * Sets the text displayed on the status label.
     */
    setStatus(newStatus) {
        this.statusLabel.text = newStatus;
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
                    container.emit("unfocus");
                    if (container instanceof PIXI.Container) {
                        for (let child of container.children) {
                            stack.push(child);
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
        this.setStatus("Paused");
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
        this.useConstMemoryAlgorithm = !this.useConstMemoryAlgorithm;
        if (this.checkerController != null) {
            this.checkerController.reset(this.useConstMemoryAlgorithm);
        }
        return this.getAlgorithmButtonLabel();
    }
}
exports.World = World;

},{"./arrows/arrow-board-controller":1,"./arrows/arrow-board-renderer":2,"./board/board":4,"./checker/checker":7,"./checker/checker-controller":5,"./checker/checker-renderer":6,"./renderable/widgets/button-style":11,"./renderable/widgets/pixi-button":12,"./renderable/widgets/pixi-stack":13,"./renderable/widgets/pixi-text-input":14,"pixi.js":undefined}]},{},[8])(8)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXJyb3dzL2Fycm93LWJvYXJkLWNvbnRyb2xsZXIudHMiLCJzcmMvYXJyb3dzL2Fycm93LWJvYXJkLXJlbmRlcmVyLnRzIiwic3JjL2JvYXJkL2JvYXJkLXJlbmRlcmVyLnRzIiwic3JjL2JvYXJkL2JvYXJkLnRzIiwic3JjL2NoZWNrZXIvY2hlY2tlci1jb250cm9sbGVyLnRzIiwic3JjL2NoZWNrZXIvY2hlY2tlci1yZW5kZXJlci50cyIsInNyYy9jaGVja2VyL2NoZWNrZXIudHMiLCJzcmMvaW5kZXgudHMiLCJzcmMvcmVuZGVyYWJsZS9zaGFwZXMvcGl4aS1yZWN0LnRzIiwic3JjL3JlbmRlcmFibGUvd2lkZ2V0cy9idXR0b24tc3RhdGUtaGFuZGxlci50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvYnV0dG9uLXN0eWxlLnRzIiwic3JjL3JlbmRlcmFibGUvd2lkZ2V0cy9waXhpLWJ1dHRvbi50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvcGl4aS1zdGFjay50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvcGl4aS10ZXh0LWlucHV0LnRzIiwic3JjL3V0aWwvYXVkaW8udHMiLCJzcmMvdXRpbC9jb29yZC11dGlscy50cyIsInNyYy93b3JsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNJQTs7OztHQUlHO0FBQ0g7SUFHSSxZQUFZLEtBQTZCO1FBQ3JDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7T0FFRztJQUNJLGdCQUFnQjtRQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQXNCLEVBQUUsQ0FBUyxFQUFFLENBQVM7WUFDeEQsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLElBQUksWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFD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LENBQUM7SUFDNUMsQ0FBQztJQUVELG9FQUFvRTtJQUM1RCxxQkFBcUI7UUFDekIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDO1FBQzdELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0FBQ0wsQ0FBQztBQXhYWSxhQUFLLFFBd1hqQixDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7IEJvYXJkIH0gZnJvbSBcIi4uL2JvYXJkL2JvYXJkXCI7XG5pbXBvcnQgeyBCb2FyZFJlbmRlcmVyIH0gZnJvbSBcIi4uL2JvYXJkL2JvYXJkLXJlbmRlcmVyXCI7XG5pbXBvcnQgeyBBcnJvd1NxdWFyZVR5cGUgfSBmcm9tIFwiLi9hcnJvd3NcIjtcblxuLyoqXG4gKiBBIGJvYXJkIGNvbnRyb2xsZXIgdGhhdCBrbm93cyBhYm91dCBgQm9hcmRgcyB3aXRoIGFycm93cy4gQWxsb3dzIHVzIHRvIHJvdGF0ZVxuICogYXJyb3dzIHdpdGhpbiB0aGUgYm9hcmQgb24gdXBkYXRlLCBhcyB3ZWxsIGFzIGluaXRpYXRlIHRoZSByb3RhdGlvbiBvZiB0aG9zZVxuICogYXJyb3dzLlxuICovXG5leHBvcnQgY2xhc3MgQXJyb3dCb2FyZENvbnRyb2xsZXIge1xuICAgIHByaXZhdGUgYm9hcmQ6IEJvYXJkPEFycm93U3F1YXJlVHlwZT47XG5cbiAgICBjb25zdHJ1Y3Rvcihib2FyZDogQm9hcmQ8QXJyb3dTcXVhcmVUeXBlPikge1xuICAgICAgICB0aGlzLmJvYXJkID0gYm9hcmQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyBhIHJhbmRvbSByb3RhdGlvbmFsIHZlbG9jaXR5IG9uIGFsbCBhcnJvd3MuXG4gICAgICovXG4gICAgcHVibGljIGluaXRpYXRlUm90YXRpb24oKSB7XG4gICAgICAgIHRoaXMuYm9hcmQubWFwKCh2YWx1ZTogQXJyb3dTcXVhcmVUeXBlLCB4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgdmVsb2NpdHlCYXNlID0gKE1hdGgucmFuZG9tKCkgLSAuNSkgLyAyO1xuICAgICAgICAgICAgICAgIGxldCB2ZWxvY2l0eVNpZ24gPSB2ZWxvY2l0eUJhc2UgPj0gMCA/IDEgOiAtMTtcbiAgICAgICAgICAgICAgICB2YWx1ZS52ZWxvY2l0eSArPSB2ZWxvY2l0eUJhc2UgKyB2ZWxvY2l0eVNpZ24gKiAwLjQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGFuZ2xlIGFuZCB2ZWxvY2l0eSBvZiBhbGwgdGhlIHNwaW5uaW5nIGFycm93cyBvbiB0aGUgYm9hcmQuXG4gICAgICogUmV0dXJucyB0cnVlIGlmIGFueSBhcnJvd3MgYXJlIHN0aWxsIHNwaW5uaW5nLlxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGUoKSB7XG4gICAgICAgIGxldCBzcGlubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJvYXJkLm1hcCgodmFsdWU6IEFycm93U3F1YXJlVHlwZSwgeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsICYmIHZhbHVlLnZlbG9jaXR5ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgaXQncyBhIG5vbi1udWxsIHNxdWFyZSwgYW5kIHRoZSBhcnJvdyBoYXMgc3Bpbm5pbmdcbiAgICAgICAgICAgICAgICAvLyB2ZWxvY2l0eSwgdXBkYXRlIGl0cyBhbmdsZSBiYXNlZCBvbiBpdHMgdmVsb2NpdHkuXG4gICAgICAgICAgICAgICAgdmFsdWUuYW5nbGUgKz0gdmFsdWUudmVsb2NpdHk7XG4gICAgICAgICAgICAgICAgLy8gQ29ycmVjdCB0aGUgYW5nbGUgdG8gYmUgYmV0d2VlbiBbMCwgNCkuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLmFuZ2xlIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hbmdsZSArPSA0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUuYW5nbGUgPj0gNCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hbmdsZSAtPSA0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBEYW1wZW4gdGhlIHZlbG9jaXR5IHRvIGFjaGlldmUgYSBzbG93ZG93biBlZmZlY3QuXG4gICAgICAgICAgICAgICAgdmFsdWUudmVsb2NpdHkgKj0gMC45OTtcbiAgICAgICAgICAgICAgICAvLyBGbG9hdHMgYXJlIGhhcmQsIHNvIHdlIG5lZWQgc29tZSB0aHJlc2hvbGQgYXQgd2hpY2ggd2UnbGxcbiAgICAgICAgICAgICAgICAvLyBkZWNpZGUgdGhhdCB3ZSBzaG91bGQgc3RvcCB0aGUgYXJyb3cgaWYgaXQgcG9pbnRzIGluIGEgdmFsaWRcbiAgICAgICAgICAgICAgICAvLyBkaXJlY3Rpb24uXG4gICAgICAgICAgICAgICAgbGV0IGFic1ZlbG9jaXR5ID0gTWF0aC5hYnModmFsdWUudmVsb2NpdHkpO1xuICAgICAgICAgICAgICAgIGxldCBhbG1vc3RTdG9wcGVkVmVsb2NpdHkgPSAwLjAyO1xuICAgICAgICAgICAgICAgIGxldCBhbG1vc3RTdG9wcGVkID0gYWJzVmVsb2NpdHkgPCBhbG1vc3RTdG9wcGVkVmVsb2NpdHk7XG4gICAgICAgICAgICAgICAgLy8gUmVwcmVzZW50cyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBuZWFyZXN0IGRpc2NyZXRlIGFuZ2xlXG4gICAgICAgICAgICAgICAgLy8gcG9zaXRpb24gYW5kIHRoZSBjdXJyZW50IGFuZ2xlIHBvc2l0aW9uLiBJZiB0aGV5IGFyZSBjbG9zZVxuICAgICAgICAgICAgICAgIC8vIGVub3VnaCwgYW5kIHRoZSBhcnJvdyBpcyBzcGlubmluZyBzbG93bHkgZW5vdWdoLCB3ZSBzdG9wIHRoZVxuICAgICAgICAgICAgICAgIC8vIGFycm93IG9uIHRoZSBkaXNjcmV0ZSBkaXJlY3Rpb24uXG4gICAgICAgICAgICAgICAgbGV0IGFuZ3VsYXJEaWZmZXJlbmNlID0gdGhpcy5nZXRBbmdsZURpZmZlcmVuY2UoXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmFuZ2xlLCBNYXRoLnJvdW5kKHZhbHVlLmFuZ2xlKSk7XG4gICAgICAgICAgICAgICAgaWYgKGFsbW9zdFN0b3BwZWQgJiYgYW5ndWxhckRpZmZlcmVuY2UgPCAwLjAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFN0b3AgdGhlIGFycm93IGZyb20gc3Bpbm5pbmcgYW5kIHNuYXAgaXQgdG8gdGhlIG5lYXJlc3RcbiAgICAgICAgICAgICAgICAgICAgLy8gZGlzY3JldGUgYW5nbGUuXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLnZlbG9jaXR5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuYW5nbGUgPSBNYXRoLnJvdW5kKHZhbHVlLmFuZ2xlKSAlIDQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGFycm93IGhhcyBwcmFjdGljYWxseSBzdG9wcGVkLCBhbmQgd2UgYXJlbid0IGNsb3NlXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGEgZGlzY3JldGUgYW5nbGUsIGdpdmUgaXQgYSBzbWFsbCBraWNrIGluIGEgcmFuZG9tXG4gICAgICAgICAgICAgICAgICAgIC8vIGRpcmVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFic1ZlbG9jaXR5IDwgYWxtb3N0U3RvcHBlZFZlbG9jaXR5IC8gMTApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLnZlbG9jaXR5ICs9IE1hdGgucmFuZG9tKCkgKiAwLjIgLSAwLjE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3Bpbm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzcGlubmluZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBkaWZmZXJlbmNlIG9mIHR3byBhbmdsZXMgcmVwcmVzZW50ZWQgaW4gdGhlIGZvcm0gZGVzY3JpYmVkIGluXG4gICAgICoge0BzZWUgQXJyb3dTcXVhcmVUeXBlfS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGdldEFuZ2xlRGlmZmVyZW5jZShhbmdsZTE6IG51bWJlciwgYW5nbGUyOiBudW1iZXIpIHtcbiAgICAgICAgYW5nbGUxID0gYW5nbGUxICUgNDtcbiAgICAgICAgaWYgKGFuZ2xlMSA8IDApIHtcbiAgICAgICAgICAgIGFuZ2xlMSArPSA0O1xuICAgICAgICB9XG4gICAgICAgIGFuZ2xlMiA9IGFuZ2xlMiAlIDQ7XG4gICAgICAgIGlmIChhbmdsZTIgPCAwKSB7XG4gICAgICAgICAgICBhbmdsZTIgKz0gNDtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgbG9naWMgaGVyZSBpcyB0byBzdXBwb3J0IHRoZSBmb2xsb3dpbmcgY2FzZXM6XG4gICAgICAgIC8vIGFuZ2xlMSA9IDAuMSwgYW5nbGUyID0gMy45XG4gICAgICAgIC8vIGFuZ2xlMSA9IDMuOSwgYW5nbGUyID0gMC4xXG4gICAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLmFicyhhbmdsZTEgLSBhbmdsZTIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoYW5nbGUxIC0gKGFuZ2xlMiArIDQpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKGFuZ2xlMSAtIChhbmdsZTIgLSA0KSkpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEFycm93U3F1YXJlVHlwZSB9IGZyb20gXCIuLi9hcnJvd3MvYXJyb3dzXCI7XG5pbXBvcnQgeyBCb2FyZCB9IGZyb20gXCIuLi9ib2FyZC9ib2FyZFwiO1xuaW1wb3J0IHsgQm9hcmRSZW5kZXJlciwgVXBkYXRhYmxlUmVuZGVyYWJsZSB9IGZyb20gXCIuLi9ib2FyZC9ib2FyZC1yZW5kZXJlclwiO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSByZW5kZXJlciBmb3IgYW4gYEFycm93Qm9hcmRgLiBUaGUgb25seSByZWFsIGJlbmVmaXQgaGVyZSBpcyB0aGF0XG4gKiBpdCBhbGxvd3MgdXMgdG8gaXNvbGF0ZSB0aGUgYXJyb3cgcmVuZGVyaW5nIGZ1bmN0aW9uLCBhbmQgbm90IGNvdXBsZSBpdCB0b1xuICogdGhlIGJvYXJkLiBPdGhlcndpc2UsIHdlJ2QgZWl0aGVyIGhhdmUgdG8gY29kZSB0aGUgYEJvYXJkUmVuZGVyZXJgIHRvIHN1cHBvcnRcbiAqIGFycm93cywgb3IgcGFzcyBpdCByZW5kZXJTcXVhcmUgYXMgYSBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFycm93Qm9hcmRSZW5kZXJlciBleHRlbmRzIEJvYXJkUmVuZGVyZXI8QXJyb3dTcXVhcmVUeXBlPiB7XG4gICAgY29uc3RydWN0b3IoYm9hcmQ6IEJvYXJkPEFycm93U3F1YXJlVHlwZT4pIHtcbiAgICAgICAgc3VwZXIoYm9hcmQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGNvbnRhaW5zIHRoZSBsb2dpYyBmb3IgcmVuZGVyaW5nIGFuIGFycm93IHdpdGhpbiBhIHNxdWFyZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVuZGVyU3F1YXJlKHNxdWFyZTogQXJyb3dTcXVhcmVUeXBlLCBzaXplOiBudW1iZXIpOlxuICAgICAgICAgICAgVXBkYXRhYmxlUmVuZGVyYWJsZTxBcnJvd1NxdWFyZVR5cGU+IHtcbiAgICAgICAgbGV0IGNvbnRhaW5lciA9IG5ldyBQSVhJLkNvbnRhaW5lcigpO1xuICAgICAgICAvLyBBIHNxdWFyZSBtdXN0IHJldHVybiBhIGNvbnRhaW5lciBhbmQgYW4gdXBkYXRlIGZ1bmN0aW9uICh0byBtb2RpZnlcbiAgICAgICAgLy8gcmVuZGVyZWQgc3F1YXJlcykuIFdlIGNvdWxkIHNwZWNpZnkgdGhlIGRlZmF1bHQgZnVuY3Rpb24gaGVyZSwgYnV0XG4gICAgICAgIC8vIHNpbmNlIHdlIHNob3VsZCBuZXZlciBoYXZlIG51bGwgc3F1YXJlcywgd2Ugd291bGQgYWx3YXlzIGJlIGNyZWF0aW5nXG4gICAgICAgIC8vIGEgZnVuY3Rpb24gYW5kIHRoZW4gdGhyb3dpbmcgaXQgYXdheS4gSW5zdGVhZCwgdGhlIGZhbGxiYWNrIGlzIGluIHRoZVxuICAgICAgICAvLyByZXR1cm4gc3RhdGVtZW50LlxuICAgICAgICBsZXQgdXBkYXRlID0gbnVsbDtcbiAgICAgICAgaWYgKHNxdWFyZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAvLyBUaGUgZnVsbCBzaXplIG9mIHRoZSBhcnJvdywgZW5kIHRvIGVuZCwgd2l0aCBzaXplLzIgYmVpbmcgdGhlXG4gICAgICAgICAgICAvLyBtaWRkbGUuXG4gICAgICAgICAgICBsZXQgYXJyb3dTaXplID0gc2l6ZSAqIDAuODtcbiAgICAgICAgICAgIC8vIFRoZSB3aWR0aCBvZiB0aGUgc2hhZnQgb2YgdGhlIGFycm93LlxuICAgICAgICAgICAgbGV0IGFycm93V2lkdGggPSBhcnJvd1NpemUgKiAwLjM1O1xuICAgICAgICAgICAgLy8gVGhlIHdpZHRoIG9mIHRoZSB0aXAgYXQgdGhlIHdpZGVzdCBwb2ludC5cbiAgICAgICAgICAgIGxldCBhcnJvd1RpcFdpZHRoID0gYXJyb3dTaXplICogMC45NTtcbiAgICAgICAgICAgIC8vIEhvdyBmYXIgZnJvbSB0aGUgbWlkZGxlIChhcnJvd1NpemUvMikgdGhlIHRpcCBzaG91bGQgc3RhcnQuXG4gICAgICAgICAgICBsZXQgYXJyb3dTdGVtTGVuZ3RoRnJvbU1pZCA9IDA7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVGhlIGRpYWdyYW0gYmVsb3cgc2hvd3MgdGhlIG9yZGVyIGluIHdoaWNoIHBvaW50cyBhcmUgdmlzaXRlZC5cbiAgICAgICAgICAgICAqIGkuZS4gdGhlIGZpcnN0IG1vdmVUbyBpcyAwLCB0aGUgZmlyc3QgbGluZVRvIGlzIDEsIHRoZSBzZWNvbmRcbiAgICAgICAgICAgICAqIGxpbmVUbyBpcyAyLCBhbmQgc28gb24uIEFsbCBwb2ludHMgYXJlIGRlcml2ZWQgZnJvbSB0aGUgZm91clxuICAgICAgICAgICAgICogbWV0cmljcyBhYm92ZSwgd2hpY2ggYXJlIGluIHR1cm4gZGVyaXZlZCBmcm9tIHRoZSBzcXVhcmUgc2l6ZS5cbiAgICAgICAgICAgICAqICAgICAgICAgICAgIDIgK1xuICAgICAgICAgICAgICogICAgICAgICAgICAgICB8IFxcXG4gICAgICAgICAgICAgKiAgIDAgICAgICAgICAgIHwgIFxcXG4gICAgICAgICAgICAgKiAgICstLS0tLS0tLS0tLSsgMSBcXFxuICAgICAgICAgICAgICogICB8ICAgICAgICAgICAgICAgIFxcIDNcbiAgICAgICAgICAgICAqICAgfCAgICAgICAgICAgNSAgICAvXG4gICAgICAgICAgICAgKiAgICstLS0tLS0tLS0tLSsgICAvXG4gICAgICAgICAgICAgKiAgIDYgICAgICAgICAgIHwgIC9cbiAgICAgICAgICAgICAqICAgICAgICAgICAgICAgfCAvXG4gICAgICAgICAgICAgKiAgICAgICAgICAgICA0ICtcbiAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICBsZXQgZ3JhcGhpY3MgPSBuZXcgUElYSS5HcmFwaGljcygpO1xuICAgICAgICAgICAgY29udGFpbmVyLmFkZENoaWxkKGdyYXBoaWNzKTtcbiAgICAgICAgICAgIGdyYXBoaWNzLmJlZ2luRmlsbCgweEZGMDAwMCk7XG4gICAgICAgICAgICBncmFwaGljcy5tb3ZlVG8oLWFycm93U2l6ZSAvIDIsIC1hcnJvd1dpZHRoIC8gMik7XG4gICAgICAgICAgICBncmFwaGljcy5saW5lVG8oYXJyb3dTdGVtTGVuZ3RoRnJvbU1pZCwgLWFycm93V2lkdGggLyAyKTtcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVUbyhhcnJvd1N0ZW1MZW5ndGhGcm9tTWlkLCAtYXJyb3dUaXBXaWR0aCAvIDIpO1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKGFycm93U2l6ZSAvIDIsIDApO1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKGFycm93U3RlbUxlbmd0aEZyb21NaWQsIGFycm93VGlwV2lkdGggLyAyKTtcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVUbyhhcnJvd1N0ZW1MZW5ndGhGcm9tTWlkLCBhcnJvd1dpZHRoIC8gMik7XG4gICAgICAgICAgICBncmFwaGljcy5saW5lVG8oLWFycm93U2l6ZSAvIDIsIGFycm93V2lkdGggLyAyKTtcbiAgICAgICAgICAgIGdyYXBoaWNzLnBvc2l0aW9uLnggPSBzaXplIC8gMjtcbiAgICAgICAgICAgIGdyYXBoaWNzLnBvc2l0aW9uLnkgPSBzaXplIC8gMjtcbiAgICAgICAgICAgIC8vIFRoZSBvbmx5IGNvbnRyb2wgYW55b25lIGhhcyBvdmVyIHRoZSBhcnJvd3MgZnJvbSB0aGUgbW9kZWwgaXNcbiAgICAgICAgICAgIC8vIHRoZWlyIHJvdGF0aW9uIGFtb3VudCwgc28gd2UgYWxsb3cgdXBkYXRpbmcgdGhhdCBwYXJ0LlxuICAgICAgICAgICAgdXBkYXRlID0gKG5ld1NxdWFyZTogQXJyb3dTcXVhcmVUeXBlKSA9PiAoXG4gICAgICAgICAgICAgICAgZ3JhcGhpY3Mucm90YXRpb24gPSBNYXRoLlBJIC8gMiAqIG5ld1NxdWFyZS5hbmdsZSk7XG4gICAgICAgICAgICAvLyBEbyB0aGUgaW5pdGlhbCByb3RhdGlvbiBhc3NpZ25tZW50IHRvIG1hdGNoIGN1cnJlbnQgc3F1YXJlIGRhdGEuXG4gICAgICAgICAgICB1cGRhdGUoc3F1YXJlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGFpbmVyLFxuICAgICAgICAgICAgdXBkYXRlOiB1cGRhdGUgfHwgKCgpID0+IG51bGwpLFxuICAgICAgICB9O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFBJWElSZWN0IH0gZnJvbSBcIi4uL3JlbmRlcmFibGUvc2hhcGVzL3BpeGktcmVjdFwiO1xuaW1wb3J0IHsgQm9hcmQgfSBmcm9tIFwiLi9ib2FyZFwiO1xuXG5pbXBvcnQgeyBDb29yZFV0aWxzIH0gZnJvbSBcIi4uL3V0aWwvY29vcmQtdXRpbHNcIjtcblxuLyoqXG4gKiBBIHJlbmRlcmFibGUgdGhhdCBjYW4gYmUgdXBkYXRlZCBmcm9tIGEgbW9kZWwgb2YgdHlwZSBULlxuICovXG5leHBvcnQgdHlwZSBVcGRhdGFibGVSZW5kZXJhYmxlPFQ+ID0ge1xuICAgIGNvbnRhaW5lcjogUElYSS5Db250YWluZXIsXG4gICAgdXBkYXRlOiAoVCkgPT4gdm9pZCxcbn07XG5cbi8qKlxuICogQW4gYWJzdHJhY3QgY2xhc3MgdGhhdCBtb3N0bHkga25vd3MgaG93IHRvIHJlbmRlciBgQm9hcmRgcy4gSXQncyBleHBlY3RlZFxuICogdGhhdCBhIHN1YmNsYXNzIHdpbGwgb3ZlcnJpZGUgYHJlbmRlclNxdWFyZWAgdG8gY29tcGxldGUgdGhlIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQm9hcmRSZW5kZXJlcjxUPiB7XG4gICAgcHJpdmF0ZSBib2FyZDogQm9hcmQ8VD47XG4gICAgcHJpdmF0ZSBzcXVhcmVTaXplOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBjbGlja0hhbmRsZXJzOiBBcnJheTwoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWQ+O1xuICAgIC8vIElmIGEgYm9hcmQgaGFzIGJlZW4gcmVuZGVyZWQsIHRoaXMgcHJvcGVydHkgY29udGFpbnMgdGhlIHRvcC1sZXZlbFxuICAgIC8vIGNvbnRhaW5lciBvZiB0aGF0IHJlbmRlcmluZy5cbiAgICBwcml2YXRlIHJlbmRlcmVkOiBQSVhJLkNvbnRhaW5lcjtcbiAgICAvLyBBbiBhcnJheSBvZiByZW5kZXJlZCBjaGlsZHJlbiwgd2hpY2ggY2FuIGJlIHVwZGF0ZWQgb24gZGVtYW5kLlxuICAgIHByaXZhdGUgcmVuZGVyZWRDaGlsZHJlbjogQXJyYXk8VXBkYXRhYmxlUmVuZGVyYWJsZTxUPj47XG5cbiAgICBjb25zdHJ1Y3Rvcihib2FyZDogQm9hcmQ8VD4pIHtcbiAgICAgICAgdGhpcy5ib2FyZCA9IGJvYXJkO1xuICAgICAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdGhpcy5jbGlja0hhbmRsZXJzID0gW107XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgdGhlIHNpemUgb2YgYSBzaW5nbGUgc3F1YXJlLiAqL1xuICAgIHB1YmxpYyBnZXRTcXVhcmVTaXplKCkgeyByZXR1cm4gdGhpcy5zcXVhcmVTaXplOyB9XG5cbiAgICAvKiogUmVnaXN0ZXJzIGEgY2xpY2sgZXZlbnQuICovXG4gICAgcHVibGljIG9uQ2xpY2soaGFuZGxlcjogKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgICAgIHRoaXMuY2xpY2tIYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHJlbmRlcmVkIGdyYXBoaWMgb2YgYSBzaW5nbGUgc3F1YXJlIGFuZCByZXR1cm5zIHRoZSB0b3AtbGV2ZWxcbiAgICAgKiBjb250YWluZXIuXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZSh4OiBudW1iZXIsIHk6IG51bWJlcik6IFBJWEkuQ29udGFpbmVyIHtcbiAgICAgICAgbGV0IHNxdWFyZVNpemUgPSB0aGlzLnNxdWFyZVNpemU7XG4gICAgICAgIGxldCBpbmRleCA9IENvb3JkVXRpbHMuY29vcmRUb0luZGV4KFxuICAgICAgICAgICAgeCwgeSwgdGhpcy5ib2FyZC5nZXRXaWR0aCgpLCB0aGlzLmJvYXJkLmdldEhlaWdodCgpKTtcblxuICAgICAgICBsZXQgY2FjaGVkID0gdGhpcy5yZW5kZXJlZENoaWxkcmVuW2luZGV4XTtcbiAgICAgICAgaWYgKGNhY2hlZCA9PSBudWxsIHx8IGNhY2hlZC5jb250YWluZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gTm90aGluZyBleGlzdHMgaW4gdGhlIGNhY2hlLCBzbyB3ZSBoYXZlIHRvIHJlbmRlciBpdCBub3cuXG4gICAgICAgICAgICBsZXQgc3F1YXJlQ29udGFpbmVyID0gbmV3IFBJWEkuQ29udGFpbmVyKCk7XG4gICAgICAgICAgICAvLyBSZW5kZXIgYSBibGFjayBvciB3aGl0ZSBzcXVhcmUuXG4gICAgICAgICAgICBsZXQgc3F1YXJlUmVjdCA9IG5ldyBQSVhJUmVjdChzcXVhcmVTaXplLCBzcXVhcmVTaXplLCB7XG4gICAgICAgICAgICAgICAgY29ybmVyUmFkaXVzOiAwLFxuICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogeCAlIDIgPT09IHkgJSAyID8gMHgwMDAwMDAgOiAweGZmZmZmZn0pO1xuICAgICAgICAgICAgc3F1YXJlQ29udGFpbmVyLmFkZENoaWxkKHNxdWFyZVJlY3QpO1xuXG4gICAgICAgICAgICAvLyBSZW5kZXIgdGhlIGFjdHVhbCBzcXVhcmUgZ3JhcGhpYy5cbiAgICAgICAgICAgIGxldCB1cGRhdGUgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlbmRlcmVkU3F1YXJlID0gdGhpcy5yZW5kZXJTcXVhcmUoXG4gICAgICAgICAgICAgICAgdGhpcy5ib2FyZC5nZXQoeCwgeSksIHNxdWFyZVNpemUpO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVkU3F1YXJlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBzb21ldGhpbmcgd2FzIHJlbmRlcmVkLCBtYXAgdGhlIHVwZGF0ZSBtZXRob2QgYW5kIGFkZCB0aGVcbiAgICAgICAgICAgICAgICAvLyBjb250YWluZXIgdG8gb3VyIHNxdWFyZSdzIGNvbnRhaW5lci5cbiAgICAgICAgICAgICAgICBzcXVhcmVDb250YWluZXIuYWRkQ2hpbGQocmVuZGVyZWRTcXVhcmUuY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB1cGRhdGUgPSByZW5kZXJlZFNxdWFyZS51cGRhdGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIElmIG5vdGhpbmcgd2FzIHJlbmRlcmVkLCB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IHRoZSB1cGRhdGVcbiAgICAgICAgICAgICAgICAvLyBtZXRob2QgaXMgbm90IG51bGwuXG4gICAgICAgICAgICAgICAgdXBkYXRlID0gKCkgPT4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFJlZ2lzdGVyIGZvciBjbGljayBldmVudHMuXG4gICAgICAgICAgICBzcXVhcmVDb250YWluZXIuaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgc3F1YXJlQ29udGFpbmVyLm9uKFwicG9pbnRlcmRvd25cIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGhhbmRsZXIgb2YgdGhpcy5jbGlja0hhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIoeCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYWNoZWQgPSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyOiBzcXVhcmVDb250YWluZXIsXG4gICAgICAgICAgICAgICAgdXBkYXRlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIElmIHJlbmRlcmVkIHNxdWFyZSBhbHJlYWR5IGV4aXN0cywgdXBkYXRlIGl0LlxuICAgICAgICAgICAgY2FjaGVkLnVwZGF0ZSh0aGlzLmJvYXJkLmdldCh4LCB5KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuW2luZGV4XSA9IGNhY2hlZDtcbiAgICAgICAgcmV0dXJuIGNhY2hlZC5jb250YWluZXI7XG4gICAgfVxuXG4gICAgLyoqIFVwZGF0ZXMgYWxsIHRoZSBzcXVhcmVzIG9uIHRoZSBib2FyZC4gKi9cbiAgICBwdWJsaWMgdXBkYXRlQWxsKCkge1xuICAgICAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gfHwgW107XG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy5ib2FyZC5nZXRIZWlnaHQoKTsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMuYm9hcmQuZ2V0V2lkdGgoKTsgeCsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoeCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhcnMgYWxsIHJlbmRlciBjYWNoZSwgY2F1c2luZyB0aGUgbmV4dCByZW5kZXIgY2FsbCB0byByZXR1cm4gYSBmcmVzaFxuICAgICAqIG5ldyBjb250YWluZXIuXG4gICAgICovXG4gICAgcHVibGljIGNsZWFyUmVuZGVyZWQoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZWQgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdGhpcy5zcXVhcmVTaXplID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBib2FyZCBpbnRvIGEgdmlldyBvZiB0aGUgZ2l2ZW4gc2l6ZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVuZGVyKHZpZXdXaWR0aDogbnVtYmVyLCB2aWV3SGVpZ2h0OiBudW1iZXIpOiBQSVhJLkNvbnRhaW5lciB7XG4gICAgICAgIGlmICh0aGlzLnJlbmRlcmVkID09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBib2FyZCA9IHRoaXMuYm9hcmQ7XG4gICAgICAgICAgICBsZXQgY29udGFpbmVyID0gbmV3IFBJWEkuQ29udGFpbmVyKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVkID0gY29udGFpbmVyO1xuICAgICAgICAgICAgbGV0IGJvYXJkV2lkdGggPSBib2FyZC5nZXRXaWR0aCgpO1xuICAgICAgICAgICAgbGV0IGJvYXJkSGVpZ2h0ID0gYm9hcmQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgICAgICBsZXQgc3F1YXJlU2l6ZSA9IE1hdGguZmxvb3IoTWF0aC5taW4odmlld1dpZHRoIC8gYm9hcmRXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3SGVpZ2h0IC8gYm9hcmRIZWlnaHQpKTtcbiAgICAgICAgICAgIHRoaXMuc3F1YXJlU2l6ZSA9IHNxdWFyZVNpemU7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgYm9hcmRIZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgYm9hcmRXaWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzcXVhcmVDb250YWluZXIgPSB0aGlzLnVwZGF0ZSh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcmVlblggPSB4ICogc3F1YXJlU2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcmVlblkgPSB5ICogc3F1YXJlU2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgc3F1YXJlQ29udGFpbmVyLnBvc2l0aW9uLnggPSBzY3JlZW5YO1xuICAgICAgICAgICAgICAgICAgICBzcXVhcmVDb250YWluZXIucG9zaXRpb24ueSA9IHNjcmVlblk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hZGRDaGlsZChzcXVhcmVDb250YWluZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJlZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgYSBnaXZlbiBzcXVhcmUgYW5kIHJldHVybnMgYW4gVXBkYXRhYmxlUmVuZGVyZXIuXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IHJlbmRlclNxdWFyZShzcXVhcmU6IFQsIHNxdWFyZVNpemU6IG51bWJlcik6XG4gICAgICAgIFVwZGF0YWJsZVJlbmRlcmFibGU8VD47XG59O1xuIiwiaW1wb3J0IHsgQ29vcmRVdGlscyB9IGZyb20gXCIuLi91dGlsL2Nvb3JkLXV0aWxzXCI7XG5cbmV4cG9ydCB0eXBlIEJvYXJkU3F1YXJlSW5pdGlhbGl6ZXI8VD4gPSAoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IFQ7XG5cbi8qKlxuICogVGhpcyBjbGFzcyByZXByZXNlbnRzIGEgYm9hcmQgb2YgYHdpZHRoYHhgaGVpZ2h0YCBkaW1lbnNpb25zLiBUaGUgdHlwZSBvZlxuICogdGhpbmdzIGNvbnRhaW5lZCBvbiB0aGUgYm9hcmQgaXMgb2YgdGhlIHBhcmFtZXRlciBgVGAuXG4gKi9cbmV4cG9ydCBjbGFzcyBCb2FyZDxUPiB7XG4gICAgcHJpdmF0ZSB3aWR0aDogbnVtYmVyO1xuICAgIHByaXZhdGUgaGVpZ2h0OiBudW1iZXI7XG4gICAgcHJpdmF0ZSBib2FyZDogVFtdO1xuXG4gICAgY29uc3RydWN0b3Iod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXI6IEJvYXJkU3F1YXJlSW5pdGlhbGl6ZXI8VD4gPSBudWxsKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuYm9hcmQgPSB0aGlzLmluaXRpYWxpemVCb2FyZEFycmF5KHdpZHRoLCBoZWlnaHQsIGluaXRpYWxpemVyKTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJucyB0aGUgd2lkdGggb2YgdGhlIGJvYXJkLiAqL1xuICAgIHB1YmxpYyBnZXRXaWR0aCgpICB7IHJldHVybiB0aGlzLndpZHRoOyB9XG4gICAgLyoqIFJldHVybnMgdGhlIGhlaWdodCBvZiB0aGUgYm9hcmQuICovXG4gICAgcHVibGljIGdldEhlaWdodCgpIHsgcmV0dXJuIHRoaXMuaGVpZ2h0OyB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyBvdmVyIGFsbCBjb29yZGluYXRlcywgY2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uLCBhbmQgdXBkYXRlcyB0aGVcbiAgICAgKiBib2FyZCB3aXRoIHRoZSByZXN1bHQuXG4gICAgICogVE9ETzogQ291bGQgYmUgZXh0ZW5kZWQgdG8gb3B0aW9uYWxseSByZXR1cm4gYSBuZXcgYm9hcmQuXG4gICAgICovXG4gICAgcHVibGljIG1hcChmOiAodmFsdWU6IFQsIHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiBUKTogQm9hcmQ8VD4ge1xuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMuaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IG9sZFZhbHVlOiBUID0gdGhpcy5nZXQoeCwgeSk7XG4gICAgICAgICAgICAgICAgbGV0IG5ld1ZhbHVlOiBUID0gZihvbGRWYWx1ZSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgdGhpcy5wdXQobmV3VmFsdWUsIHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBQdXRzIGEgdmFsdWUgaW50byB0aGUgc3F1YXJlIGF0IHRoZSBnaXZlbiBjb29yZGluYXRlLiAqL1xuICAgIHB1YmxpYyBwdXQodmFsdWU6IFQsIHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIGxldCBpbmRleCA9IENvb3JkVXRpbHMuY29vcmRUb0luZGV4KHgsIHksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5ib2FyZFtpbmRleF0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgc3F1YXJlIGF0IHRoZSBnaXZlbiBjb29yZGluYXRlLiAqL1xuICAgIHB1YmxpYyBnZXQoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gQ29vcmRVdGlscy5jb29yZFRvSW5kZXgoXG4gICAgICAgICAgICB4LCB5LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgZmFsc2UpO1xuICAgICAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuYm9hcmRbaW5kZXhdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIGFuIGFycmF5IHRoYXQgY2FuIGludGVybmFsbHkgYmUgdXNlZCBmb3IgYSBib2FyZC4gT3B0aW9uYWxseVxuICAgICAqIHRha2VzIGFuIGluaXRpYWxpemVyLiBJZiBvbmUgaXMgbm90IHNwZWNpZmllZCwgYWxsIHNxdWFyZXMgYXJlXG4gICAgICogaW5pdGlhbGl6ZWQgdG8gbnVsbC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGluaXRpYWxpemVCb2FyZEFycmF5KFxuICAgICAgICAgICAgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICBpbml0aWFsaXplcjogQm9hcmRTcXVhcmVJbml0aWFsaXplcjxUPiA9IG51bGwpIHtcbiAgICAgICAgbGV0IGJvYXJkQXJyYXk6IFRbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBib2FyZEFycmF5LnB1c2goaW5pdGlhbGl6ZXIgIT0gbnVsbCA/IGluaXRpYWxpemVyKHgsIHkpIDogbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJvYXJkQXJyYXk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQXJyb3dTcXVhcmVUeXBlIH0gZnJvbSBcIi4uL2Fycm93cy9hcnJvd3NcIjtcbmltcG9ydCB7IEJvYXJkIH0gZnJvbSBcIi4uL2JvYXJkL2JvYXJkXCI7XG5pbXBvcnQgeyBDaGVja2VyIH0gZnJvbSBcIi4vY2hlY2tlclwiO1xuXG5pbXBvcnQgeyBBdWRpbywgU291bmRzIH0gZnJvbSBcIi4uL3V0aWwvYXVkaW9cIjtcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgY29udHJvbHMgdGhlIG1vdmVtZW50IG9mIHRoZSBgQ2hlY2tlcmAuIEVzc2VudGlhbGx5LCB0aGlzIGlzIHRoZVxuICogY2xhc3MgdGhhdCBpbXBsZW1lbnQgdGhlIGxvZ2ljIG9mIHRoZSBjeWNsZS1kZXRlY3RpbmcgYWxnb3JpdGhtLlxuICovXG5leHBvcnQgY2xhc3MgQ2hlY2tlckNvbnRyb2xsZXIge1xuICAgIHByaXZhdGUgYm9hcmQ6IEJvYXJkPEFycm93U3F1YXJlVHlwZT47XG4gICAgcHJpdmF0ZSBjaGVja2VyOiBDaGVja2VyO1xuXG4gICAgLy8gQWxnb3JpdGhtIHByb3BlcnRpZXNcbiAgICAvLyBXaGV0aGVyIHdlIHNob3VsZCBydW4gdGhlIGNvbnN0YW50IG1lbW9yeSBhbGdvcml0aG0uXG4gICAgcHJpdmF0ZSBjb25zdGFudE1lbW9yeTogYm9vbGVhbjtcbiAgICAvLyBXaGV0aGVyIHdlIGhhdmUgZGV0ZWN0ZWQgYSBjeWNsZS5cbiAgICBwcml2YXRlIGRldGVjdGVkQ3ljbGU6IGJvb2xlYW47XG4gICAgLy8gV2hldGhlciB3ZSBoYXZlIGRldGVjdGVkIHRoYXQgd2Ugd2VudCBvZmYgZWRnZS5cbiAgICBwcml2YXRlIGRldGVjdGVkT2ZmRWRnZTogYm9vbGVhbjtcbiAgICAvLyBGb3IgdGhlIG5vbi1jb25zdGFudCBtZW1vcnkgYWxnb3JpdGhtLCBrZWVwcyB0cmFjayBvZiBzcXVhcmVzIHRoYXQgdGhpc1xuICAgIC8vIGNoZWNrZXIgaGFzIGJlZW4gb24uXG4gICAgcHJpdmF0ZSB2aXNpdGVkOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn07XG4gICAgLy8gVGhlIFwiaGFyZVwiIG9mIEZsb3lkJ3MgYWxnb3JpdGhtLiBBIHBvaW50IHRoYXQgbW92ZXMgdHdpY2UgYXMgZmFzdCBhY3Jvc3NcbiAgICAvLyB0aGUgYm9hcmQgYXMgdGhlIGNoZWNrZXIgKHdoaWNoIG1ha2VzIHRoZSBjaGVja2VyIHRoZSB0b3J0b2lzZSkuIElmIHRoZVxuICAgIC8vIGhhcmUgYW5kIHR1cnRsZSBldmVyIGVuZCB1cCBvbiB0aGUgc2FtZSBzcG90LCB0aGVyZSBpcyBhIGN5Y2xlLlxuICAgIHByaXZhdGUgaGFyZToge3g6IG51bWJlciwgeTogbnVtYmVyfTtcblxuICAgIGNvbnN0cnVjdG9yKGJvYXJkOiBCb2FyZDxBcnJvd1NxdWFyZVR5cGU+LFxuICAgICAgICAgICAgICAgIGNoZWNrZXI6IENoZWNrZXIsXG4gICAgICAgICAgICAgICAgY29uc3RhbnRNZW1vcnk6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICB0aGlzLmJvYXJkID0gYm9hcmQ7XG4gICAgICAgIHRoaXMuY2hlY2tlciA9IGNoZWNrZXI7XG4gICAgICAgIHRoaXMucmVzZXQoY29uc3RhbnRNZW1vcnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBpdCBoYXMgYmVlbiBpZGVudGlmaWVkIHRoYXQgdGhpcyBjaGVja2VyIGlzIGluIGEgY3ljbGUuXG4gICAgICovXG4gICAgcHVibGljIGhhc0RldGVjdGVkQ3ljbGUoKSB7IHJldHVybiB0aGlzLmRldGVjdGVkQ3ljbGU7IH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgbmV4dCBtb3ZlIHdvdWxkIG1vdmUgdGhlIGNoZWNrZXIgb2ZmIHRoZSBlZGdlIG9mIHRoZVxuICAgICAqIGJvYXJkLlxuICAgICAqL1xuICAgIHB1YmxpYyBoYXNEZXRlY3RlZEVkZ2UoKSB7IHJldHVybiB0aGlzLmRldGVjdGVkT2ZmRWRnZTsgfVxuXG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBjeWNsZS9lZGdlIHRyYWNraW5nLCBhcyB3ZWxsIGFzIHRoZSBhbGdvcml0aG0gdGhhdCBzaG91bGQgYmVcbiAgICAgKiB1c2VkXG4gICAgICovXG4gICAgcHVibGljIHJlc2V0KGNvbnN0YW50TWVtb3J5OiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5jb25zdGFudE1lbW9yeSA9IGNvbnN0YW50TWVtb3J5O1xuICAgICAgICB0aGlzLmRldGVjdGVkQ3ljbGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kZXRlY3RlZE9mZkVkZ2UgPSBmYWxzZTtcbiAgICAgICAgdGhpcy52aXNpdGVkID0ge307XG4gICAgICAgIHRoaXMuaGFyZSA9IHRoaXMuY2hlY2tlci5nZXRQb3NpdGlvbigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFuaW1hdGVzIHRoZSBjaGVja2VyIGFuZCBzY2hlZHVsZXMgdGhlIG5leHQgbW92ZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlKCkge1xuICAgICAgICBpZiAodGhpcy5hbmltYXRlVG93YXJkc1Bvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuY2hlY2tlci5nZXRQb3NpdGlvbigpO1xuICAgICAgICAgICAgLy8gV2hlbiB0aGUgY2hlY2tlciBoYXMgc3RvcHBlZCwgbW92ZSBpdCB0byB0aGUgbmV4dCBzcXVhcmUuXG4gICAgICAgICAgICBsZXQgc3F1YXJlRGlyZWN0aW9uID0gdGhpcy5nZXREaXJlY3Rpb25PZkJvYXJkU3F1YXJlKFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgaWYgKHNxdWFyZURpcmVjdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHNxdWFyZURpcmVjdGlvbi5keCwgc3F1YXJlRGlyZWN0aW9uLmR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgcG9zaXRpb24gb2Zmc2V0LCBzZXRzIHVwIHRoZSBjaGVja2VyIHNvIHRoYXQgaXQgd2lsbCBhbmltYXRlIHRvXG4gICAgICogdGhlIHNxdWFyZSBpbiB0aGF0IGRpcmVjdGlvbi5cbiAgICAgKi9cbiAgICBwcml2YXRlIG1vdmUoZHg6IG51bWJlciwgZHk6IG51bWJlcikge1xuICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmNoZWNrZXIuZ2V0UG9zaXRpb24oKTtcbiAgICAgICAgbGV0IG54ID0gcG9zaXRpb24ueCArIGR4O1xuICAgICAgICBsZXQgbnkgPSBwb3NpdGlvbi55ICsgZHk7XG4gICAgICAgIGlmICghdGhpcy5jb25zdGFudE1lbW9yeSkge1xuICAgICAgICAgICAgLy8gVGhlIG5vbi1jb25zdGFudCBtZW1vcnkgYWxnb3JpdGhtLiBLZWVwcyBhIGhhc2htYXAgb2YgdmlzaXRlZFxuICAgICAgICAgICAgLy8gcG9zaXRpb25zIGFuZCBjaGVja3Mgd2hldGhlciB0aGUgbmV4dCBwb3NpdGlvbiB3YXMgdmlzaXRlZC5cbiAgICAgICAgICAgIC8vIFRoZSBtZW1vcnkgY29tcGxleGl0eSBpcyBPKE0pLCB3aGVyZSBNIGlzIHRoZSB3aWR0aCAqIGhlaWdodCBvZlxuICAgICAgICAgICAgLy8gdGhlIGJvYXJkLlxuICAgICAgICAgICAgLy8gVGhlcmUgZXhpc3RzIGFub3RoZXIgYWxnb3JpdGhtLCB3aGVyZSBvbmUgd291bGQga2VlcCBhIGxpc3Qgb2ZcbiAgICAgICAgICAgIC8vIGFsbCB2aXNpdGVkIGxvY2F0aW9ucyBhbmQgY29tcGFyZSBhZ2FpbnN0IHRoYXQuIFRoZSBtZW1vcnlcbiAgICAgICAgICAgIC8vIGNvbXBsZXhpdHkgb2YgdGhhdCBhbGdvcml0aG0gd291bGQgYmUgTyhOKSB3aGVyZSBOIHdvdWxkIGJlIHRoZVxuICAgICAgICAgICAgLy8gbnVtYmVyIG9mIG1vdmVzIG1hZGUuXG4gICAgICAgICAgICBsZXQgcG9zaXRpb25LZXkgPSBueCArIFwiL1wiICsgbnk7XG4gICAgICAgICAgICBpZiAodGhpcy52aXNpdGVkW3Bvc2l0aW9uS2V5XSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRDeWNsZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnZpc2l0ZWRbcG9zaXRpb25LZXldID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEEgXCJjb25zdGFudCBtZW1vcnlcIiBhbGdvcml0aG0uIElmIHdlJ3ZlIG1hZGUgbW9yZSBtb3ZlcyB0aGFuXG4gICAgICAgICAgICAvLyB0aGVyZSBhcmUgc3F1YXJlcyBvbiB0aGUgYm9hcmQgYW5kIGhhdmUgbm90IGVuY291bnRlcmVkIGFuIGVkZ2UsXG4gICAgICAgICAgICAvLyB0aGVuIHRoZXJlIGlzIGEgY3ljbGUuIFRoZSBvYnZpb3VzIHRyYWRlLW9mZiBoZXJlIGlzIHRoYXQgd2VcbiAgICAgICAgICAgIC8vIGRvbid0IGZpbmQgb3V0IGFib3V0IHRoZSBjeWNsZSB1bnRpbCBtdWNoIGxhdGVyIHRoYW4gb3RoZXJ3aXNlLlxuICAgICAgICAgICAgLy8gbGV0IGJvYXJkID0gdGhpcy5jaGVja2VyLmdldEJvYXJkKCk7XG4gICAgICAgICAgICAvLyBpZiAoIXRoaXMuZGV0ZWN0ZWRPZmZFZGdlICYmXG4gICAgICAgICAgICAvLyAgICAgICAgIHRoaXMubW92ZXNNYWRlID4gYm9hcmQuZ2V0V2lkdGgoKSAqIGJvYXJkLmdldEhlaWdodCgpKSB7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5kZXRlY3RlZEN5Y2xlID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLy8gRmx5bm4ncyB0dXJ0bGUvaGFyZSBhbGdvcml0aG0uXG4gICAgICAgICAgICAvLyBGb3IgZXZlcnkgb25lIHR1cnRsZSBtb3ZlLCB3ZSBtYWtlIHR3byBoYXJlIG1vdmVzLlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgaGFyZVNxdWFyZURpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uT2ZCb2FyZFNxdWFyZShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXJlLngsIHRoaXMuaGFyZS55KTtcbiAgICAgICAgICAgICAgICBpZiAoaGFyZVNxdWFyZURpcmVjdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRPZmZFZGdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXJlLnggKz0gaGFyZVNxdWFyZURpcmVjdGlvbi5keDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXJlLnkgKz0gaGFyZVNxdWFyZURpcmVjdGlvbi5keTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFyZS54ID09PSBwb3NpdGlvbi54ICYmIHRoaXMuaGFyZS55ID09PSBwb3NpdGlvbi55KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRDeWNsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmJvYXJkLmdldChueCwgbnkpICE9IG51bGwpIHtcbiAgICAgICAgICAgIEF1ZGlvLnBsYXkoU291bmRzLlBMT1ApO1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyLnNldFBvc2l0aW9uKG54LCBueSk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrZXIuc2V0T2Zmc2V0KC1keCwgLWR5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRPZmZFZGdlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vZGlmaWVzIHRoZSBvZmZzZXQgc3VjaCB0aGF0IGl0IGFwcHJvYWNoZXMgMCwgd2hpY2ggbWFrZXMgaXQgYXBwZWFyIGxpa2VcbiAgICAgKiB0aGUgYENoZWNrZXJgIGlzIG1vdmluZyB0b3dhcmRzIGl0cyBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSBjaGVja2VyIGhhcyBzdG9wcGVkIG1vdmluZy5cbiAgICAgKi9cbiAgICBwcml2YXRlIGFuaW1hdGVUb3dhcmRzUG9zaXRpb24oKTogYm9vbGVhbiB7XG4gICAgICAgIGxldCBmcmljdGlvbiA9IDAuOTtcbiAgICAgICAgbGV0IHN0b3BUaHJlc2hvbGQgPSAwLjAzO1xuICAgICAgICBsZXQgb2Zmc2V0ID0gdGhpcy5jaGVja2VyLmdldE9mZnNldCgpO1xuICAgICAgICBpZiAob2Zmc2V0LnggIT09IDApIHtcbiAgICAgICAgICAgIG9mZnNldC54ICo9IGZyaWN0aW9uO1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKG9mZnNldC54KSA8IHN0b3BUaHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBvZmZzZXQueCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9mZnNldC55ICE9PSAwKSB7XG4gICAgICAgICAgICBvZmZzZXQueSAqPSBmcmljdGlvbjtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhvZmZzZXQueSkgPCBzdG9wVGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0LnkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2hlY2tlci5zZXRPZmZzZXQob2Zmc2V0LngsIG9mZnNldC55KTtcbiAgICAgICAgcmV0dXJuIG9mZnNldC54ID09PSAwICYmIG9mZnNldC55ID09PSAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB2ZWN0b3IgcmVwcmVzZW50aW5nIHRoZSBkaXJlY3Rpb24gdGhhdCB0aGUgYXJyb3cgb24gdGhlIGdpdmVuXG4gICAgICogc3F1YXJlIGlzIHBvaW50aW5nLiBNYXkgcmV0dXJuIG51bGwgaWYgbm8gc3F1YXJlIGV4aXN0cyBhbmQgdGhlIGdpdmVuXG4gICAgICogY29vcmRpbmF0ZS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGdldERpcmVjdGlvbk9mQm9hcmRTcXVhcmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAgICAgbGV0IHNxdWFyZTogQXJyb3dTcXVhcmVUeXBlID0gdGhpcy5ib2FyZC5nZXQoeCwgeSk7XG4gICAgICAgIGlmIChzcXVhcmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IGFuZ2xlID0gTWF0aC5yb3VuZChzcXVhcmUuYW5nbGUpICUgNDtcbiAgICAgICAgICAgIGlmIChhbmdsZSA8IDApIHtcbiAgICAgICAgICAgICAgICBhbmdsZSArPSA0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG1vdmVtZW50cyA9IFt7ZHg6IDEsIGR5OiAwfSwge2R4OiAwLCBkeTogMX0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtkeDogLTEsIGR5OiAwfSwge2R4OiAwLCBkeTogLTF9XTtcbiAgICAgICAgICAgIHJldHVybiBtb3ZlbWVudHNbYW5nbGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENoZWNrZXIgfSBmcm9tIFwiLi9jaGVja2VyXCI7XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IGlzIGNhcGFibGUgb2YgcmVuZGVyaW5nIGEgY2hlY2tlciBvbiBpdHMgYm9hcmQuIEl0IGlzIGV4cGVjdGVkXG4gKiB0aGF0IHRoZSBzcXVhcmVTaXplIGlzIHBhc3NlZCB0byB0aGUgcmVuZGVyIGZ1bmN0aW9uLlxuICogVG8gY2hhbmdlIHRoZSBzcXVhcmUgc2l6ZSBhZnRlciB0aGUgZmFjdCwgYHNldFNxdWFyZVNpemVgIG1heSBiZSB1c2VkLCBhbmRcbiAqIHRoZSBwb3NpdGlvbiBhbmQgc2l6ZSBvZiB0aGUgY2hlY2tlciB3aWxsIGJlIGltbWVkaWF0ZWx5IHVwZGF0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGVja2VyUmVuZGVyZXIge1xuICAgIHByaXZhdGUgY2hlY2tlcjogQ2hlY2tlcjtcblxuICAgIC8vIFJlbmRlciBwcm9wZXJ0aWVzXG4gICAgcHJpdmF0ZSByZW5kZXJlZDogUElYSS5Db250YWluZXI7XG4gICAgcHJpdmF0ZSBzcXVhcmVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihjaGVja2VyOiBDaGVja2VyKSB7XG4gICAgICAgIHRoaXMuY2hlY2tlciA9IGNoZWNrZXI7XG4gICAgICAgIHRoaXMucmVuZGVyZWQgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKiBTZXRzIHRoZSBzcXVhcmUgc2l6ZSBvZiB0aGUgYm9hcmQgdGhpcyBjaGVja2VyIGlzIG9uLiAqL1xuICAgIHB1YmxpYyBzZXRTcXVhcmVTaXplKG5ld1NxdWFyZVNpemU6IG51bWJlcikge1xuICAgICAgICB0aGlzLnNxdWFyZVNpemUgPSBuZXdTcXVhcmVTaXplO1xuICAgICAgICB0aGlzLnJlcmVuZGVyKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSWYgdGhpcyByZW5kZXJlciBoYXMgcmVuZGVyZWQgdGhlIGNoZWNrZXIsIHRoaXMgd2lsbCByZXR1cm4gdGhlIHRvcC1sZXZlbFxuICAgICAqIFBJWEkgY29udGFpbmVyIHRoYXQgaGFzIGl0LiBPdGhlcndpc2UsIGl0IHdpbGwgcmV0dXJuIG51bGwuXG4gICAgICovXG4gICAgcHVibGljIGdldFJlbmRlcmVkKCk6IFBJWEkuQ29udGFpbmVyIHsgcmV0dXJuIHRoaXMucmVuZGVyZWQ7IH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBncmFwaGljcyBiYXNlZCBvbiB0aGUgdXBkYXRlZCBgQ2hlY2tlcmBcbiAgICAgKiBwb3NpdGlvbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlKCkge1xuICAgICAgICBpZiAodGhpcy5yZW5kZXJlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmNoZWNrZXIuZ2V0T2Zmc2V0UG9zaXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZWQucG9zaXRpb24ueCA9IHRoaXMuc3F1YXJlU2l6ZSAqIHBvc2l0aW9uLng7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVkLnBvc2l0aW9uLnkgPSB0aGlzLnNxdWFyZVNpemUgKiBwb3NpdGlvbi55O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBzcXVhcmUgc2l6ZSwgcmVuZGVycyB0aGUgY2hlY2tlciBhbmQgcmV0dXJucyBhbiBlbGVtZW50IHRoYXRcbiAgICAgKiBjb250YWlucyBpdC5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVuZGVyKHNxdWFyZVNpemU6IG51bWJlcik6IFBJWEkuQ29udGFpbmVyIHtcbiAgICAgICAgaWYgKHRoaXMucmVuZGVyZWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zcXVhcmVTaXplID0gc3F1YXJlU2l6ZTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZWQgPSBuZXcgUElYSS5Db250YWluZXIoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZWQuYWRkQ2hpbGQodGhpcy5idWlsZEdyYXBoaWNzKCkpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJlZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgdGhlIHBhdGggdXNlZCB0byByZXByZXNlbnQgdGhlIGNoZWNrZXIgYW5kIHBvc2l0aW9ucyBpdCBpbiB0aGVcbiAgICAgKiBtaWRkbGUgb2YgaXRzIGNvbnRhaW5lciwgd2hpY2ggc2hvdWxkIGJlIG9mIHNpemUgYHNxdWFyZVNpemVgLlxuICAgICAqL1xuICAgIHByaXZhdGUgYnVpbGRHcmFwaGljcygpIHtcbiAgICAgICAgbGV0IGhhbGZTcXVhcmVTaXplID0gdGhpcy5zcXVhcmVTaXplIC8gMjtcbiAgICAgICAgbGV0IHJhZGl1cyA9IGhhbGZTcXVhcmVTaXplICogMC42O1xuXG4gICAgICAgIGxldCBjb2xvcnMgPSBbMHhEQTE0MzQsIDB4RkI0NDM0XTtcbiAgICAgICAgbGV0IGcgPSBuZXcgUElYSS5HcmFwaGljcygpO1xuICAgICAgICBnLmJlZ2luRmlsbChjb2xvcnNbMF0pO1xuICAgICAgICBnLmRyYXdDaXJjbGUoaGFsZlNxdWFyZVNpemUsIGhhbGZTcXVhcmVTaXplLCByYWRpdXMpO1xuXG4gICAgICAgIGxldCBpbm5lclJpbmcgPSAwLjI7XG4gICAgICAgIGxldCByaW5ncyA9IE1hdGguZmxvb3IoaGFsZlNxdWFyZVNpemUgLyA1KTtcbiAgICAgICAgZm9yIChsZXQgcmluZyA9IDE7IHJpbmcgPCByaW5nczsgcmluZysrKSB7XG4gICAgICAgICAgICBnLmJlZ2luRmlsbChjb2xvcnNbcmluZyAlIGNvbG9ycy5sZW5ndGhdKTtcbiAgICAgICAgICAgIGcuZHJhd0NpcmNsZShoYWxmU3F1YXJlU2l6ZSwgaGFsZlNxdWFyZVNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKHJhZGl1cyAtIGlubmVyUmluZykgKiAocmluZ3MgLSByaW5nKSAvIHJpbmdzICsgaW5uZXJSaW5nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhcnMgZXZlcnl0aGluZyBmcm9tIHRoZSByZW5kZXJlZCBjb250YWluZXIsIGFuZCByZXJlbmRlcnMgdGhlXG4gICAgICogZ3JhcGhpY3MuXG4gICAgICovXG4gICAgcHJpdmF0ZSByZXJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlZC5yZW1vdmVDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLnJlbmRlcmVkLmFkZENoaWxkKHRoaXMuYnVpbGRHcmFwaGljcygpKTtcbiAgICB9XG59XG4iLCIvKipcbiAqIFJlcHJlc2VudHMgdGhlIGNoZWNrZXIgYXQgc29tZSBwb3NpdGlvbiBvbiB0aGUgYm9hcmQuIGB4YCBhbmQgYHlgIHNob3VsZCBiZVxuICogaW50ZWdlcnMgdGhhdCB0b2dldGhlciBmb3JtIHRoZSBjb29yZGluYXRlIG9mIHRoZSBzcXVhcmUgb24gdGhlIGBCb2FyZGAuXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGVja2VyIHtcbiAgICAvLyBUaGUgYHhgIGFuZCBgeWAgY29tcG9uZW50cyBvZiB0aGUgY29vcmRpbmF0ZSBvZiB0aGUgbG9jYXRpb24gb2YgdGhpc1xuICAgIC8vIGBDaGVja2VyYCBvbiBhIGBCb2FyZGAuXG4gICAgcHJpdmF0ZSB4OiBudW1iZXI7XG4gICAgcHJpdmF0ZSB5OiBudW1iZXI7XG4gICAgLy8gQSBmbG9hdGluZyBwb2ludCBvZmZzZXQgdGhhdCBpcyB1c2VkIHRvIGFuaW1hdGUgdGhlIGNoZWNrZXIgdG8gaXRzIG5ld1xuICAgIC8vIHBvc2l0aW9uLiBCb3RoIGB4YCBhbmQgYHlgIHNob3VsZCBiZSBiZXR3ZWVuIC0xIGFuZCAxLlxuICAgIHByaXZhdGUgb2Zmc2V0OiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xuXG4gICAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy54ID0geCB8IDA7XG4gICAgICAgIHRoaXMueSA9IHkgfCAwO1xuICAgICAgICB0aGlzLm9mZnNldCA9IHt4OiAwLCB5OiAwfTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJucyB0aGUgcG9zaXRpb24gb2YgdGhpcyBjaGVja2VyLiAqL1xuICAgIHB1YmxpYyBnZXRQb3NpdGlvbigpIHsgcmV0dXJuIHt4OiB0aGlzLngsIHk6IHRoaXMueX07IH1cblxuICAgIC8qKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGlzIGBDaGVja2VyYCBvbiBhIGBCb2FyZGAuICovXG4gICAgcHVibGljIHNldFBvc2l0aW9uKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMueCA9IHggfCAwO1xuICAgICAgICB0aGlzLnkgPSB5IHwgMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgdGhlIGZsb2F0aW5nIHBvaW50IG9mZnNldCBvZiB0aGlzIGBDaGVja2VyYC4gKi9cbiAgICBwdWJsaWMgZ2V0T2Zmc2V0KCk6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0ge1xuICAgICAgICByZXR1cm4ge3g6IHRoaXMub2Zmc2V0LngsIHk6IHRoaXMub2Zmc2V0Lnl9O1xuICAgIH1cblxuICAgIC8qKiBTZXRzIHRoZSBmbG9hdGluZyBwb2ludCBvZmZzZXQgb2YgdGhpcyBgQ2hlY2tlcmAuICovXG4gICAgcHVibGljIHNldE9mZnNldChkeDogbnVtYmVyLCBkeTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMub2Zmc2V0LnggPSBkeDtcbiAgICAgICAgdGhpcy5vZmZzZXQueSA9IGR5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogUmV0dXJucyB0aGUgc3VtIG9mIHRoZSBwb3NpdGlvbiBhbmQgdGhlIG9mZnNldC4gKi9cbiAgICBwdWJsaWMgZ2V0T2Zmc2V0UG9zaXRpb24oKToge3g6IG51bWJlciwgeTogbnVtYmVyfSB7XG4gICAgICAgIHJldHVybiB7eDogdGhpcy54ICsgdGhpcy5vZmZzZXQueCxcbiAgICAgICAgICAgICAgICB5OiB0aGlzLnkgKyB0aGlzLm9mZnNldC55fTtcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIgLz5cblxuaW1wb3J0IHsgV29ybGQgfSBmcm9tIFwiLi93b3JsZFwiO1xuXG4vLyBDcmVhdGUgdGhlIHdvcmxkXG5sZXQgd29ybGQgPSBuZXcgV29ybGQoKTtcblxuZnVuY3Rpb24gc3RhcnRMb29wKGYpIHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gc3RhcnRMb29wKGYpKTtcbiAgICBmKCk7XG59O1xuXG5zdGFydExvb3AoKCkgPT4ge1xuICAgIHdvcmxkLnVwZGF0ZSgpO1xuICAgIHdvcmxkLnJlbmRlcigpO1xufSk7XG4iLCIvKipcbiAqIFRoZSByZW5kZXJpbmcgcGFyYW1ldGVycyBvZiBhIFBJWElSZWN0LlxuICovXG50eXBlIFBJWElSZWN0UmVuZGVyaW5nUGFyYW1ldGVycyA9IHtcbiAgICAvLyBUaGUgd2lkdGggYW5kIGhlaWdodCBvZiB0aGUgcmVjdGFuZ2xlLlxuICAgIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLFxuICAgIC8vIFRoZSByYWRpdXMgb2YgdGhlIGNvcm5lcnMsIG9yIDAuXG4gICAgY29ybmVyUmFkaXVzOiBudW1iZXIsXG4gICAgLy8gVGhlIGZpbGwgY29sb3IgYXMgYSBudW1iZXIuIGkuZS4gMHhGRjAwMDAgZm9yIHJlZC5cbiAgICBmaWxsQ29sb3I6IG51bWJlcixcbiAgICAvLyBUaGUgc3Ryb2tlIGNvbG9yIGFzIGEgbnVtYmVyLlxuICAgIHN0cm9rZUNvbG9yOiBudW1iZXIsXG4gICAgLy8gVGhlIGxpbmUgd2lkdGggb2YgdGhlIG91dGxpbmUsIG9yIDAuXG4gICAgbGluZVdpZHRoOiBudW1iZXIsXG59O1xuXG4vKipcbiAqIEEgYmFzaWMgcmVjdGFuZ2xlIHRoYXQgaXMgcmVuZGVyYWJsZSB0byBQSVhJIChhcyBvcHBvc2VkIHRvIGFcbiAqIFBJWEkuUmVjdGFuZ2xlKSwgb3B0aW9uYWxseSB3aXRoIHJvdW5kZWQgY29ybmVycy5cbiAqL1xuZXhwb3J0IGNsYXNzIFBJWElSZWN0IGV4dGVuZHMgUElYSS5HcmFwaGljcyB7XG4gICAgcHJpdmF0ZSBvcHRpb25zOiBQSVhJUmVjdFJlbmRlcmluZ1BhcmFtZXRlcnM7XG5cbiAgICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7Y29ybmVyUmFkaXVzPzogbnVtYmVyLCBmaWxsQ29sb3I/OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aD86IG51bWJlciwgc3Ryb2tlQ29sb3I/OiBudW1iZXJ9ID0gbnVsbCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICBjb3JuZXJSYWRpdXM6IG9wdGlvbnMgJiYgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMuY29ybmVyUmFkaXVzID09IG51bGwgPyA1IDogb3B0aW9ucy5jb3JuZXJSYWRpdXMpLFxuICAgICAgICAgICAgZmlsbENvbG9yOiBvcHRpb25zICYmIG9wdGlvbnMuZmlsbENvbG9yIHx8IDAsXG4gICAgICAgICAgICBsaW5lV2lkdGg6IG9wdGlvbnMgJiYgb3B0aW9ucy5saW5lV2lkdGggfHwgMCxcbiAgICAgICAgICAgIHN0cm9rZUNvbG9yOiBvcHRpb25zICYmIG9wdGlvbnMuc3Ryb2tlQ29sb3IsXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51cGRhdGVHZW9tZXRyeSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBuZXcgcGFyYW1ldGVycyBmb3IgdGhlIGZpbGwgYW5kIHN0cm9rZSBjb2xvcnMuXG4gICAgICovXG4gICAgcHVibGljIHNldENvbG9ycyhjb2xvcnM6IHtmaWxsPzogbnVtYmVyLCBzdHJva2U/OiBudW1iZXJ9KSB7XG4gICAgICAgIGlmIChjb2xvcnMuZmlsbCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZmlsbENvbG9yID0gY29sb3JzLmZpbGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbG9ycy5zdHJva2UgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnN0cm9rZUNvbG9yID0gY29sb3JzLnN0cm9rZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZUdlb21ldHJ5KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgcGF0aCBhc3NvY2lhdGVkIHdpdGggdGhpcyBQSVhJLkdyYXBoaWNzIG9iamVjdCB0byBhY2N1cmF0ZWx5XG4gICAgICogcmVwcmVzZW50IHRoZSByZWN0YW5nbGUgZGV0YWlsZWQgYnkgdGhlIG9wdGlvbnMuXG4gICAgICovXG4gICAgcHJpdmF0ZSB1cGRhdGVHZW9tZXRyeSgpIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgIGxldCB3aWR0aCA9IG9wdGlvbnMud2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSBvcHRpb25zLmhlaWdodDtcbiAgICAgICAgbGV0IHJhZGl1cyA9IG9wdGlvbnMuY29ybmVyUmFkaXVzO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCZWxvdyBpcyBhIGRpYWdyYW0gb2YgdGhlIG9yZGVyIGluIHdoaWNoIHRoZSByZWN0YW5nbGUgaXMgcmVuZGVyZWQuXG4gICAgICAgICAqIFRoZSBudW1iZXJzIGNvaW5jaWRlIHdpdGggY29tbWVudHMgb24gdGhlIGxpbmVzIGJlbG93IHRoYXQgYXJlIHVzZWRcbiAgICAgICAgICogdG8gY29uc3RydWN0IHRoZSBnZW9tZXRyeSBmb3IgdGhlIHJlY3RhbmdsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIDgvMCAtLS0tLS0tLS0tLS0tLS0gMVxuICAgICAgICAgKiAgICAgLyAgICAgICAgICAgICAgICAgICAgIFxcXG4gICAgICAgICAqICAgNyAgICAgICAgICAgICAgICAgICAgICAgICAyXG4gICAgICAgICAqICAgfCAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICAgICAqICAgfCAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICAgICAqICAgfCAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICAgICAqICAgfCAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgICAgICAqICAgNiAgICAgICAgICAgICAgICAgICAgICAgICAzXG4gICAgICAgICAqICAgICBcXCAgICAgICAgICAgICAgICAgICAgIC9cbiAgICAgICAgICogICAgICAgNSAtLS0tLS0tLS0tLS0tLS0gNFxuICAgICAgICAgKi9cblxuICAgICAgICAvLyBOT1RFOiBUaGUgYXJjcyBhcmUgc29tZXRpbWVzIGltcHJlY2lzZSB3aGVuIHJlbmRlcmVkLCBhbmQgaGF2aW5nIGFcbiAgICAgICAgLy8gbGluZVRvIGNvbW1hbmQgYWZ0ZXIgdGhlbSBoZWxwcyBtYWtlIHRoZW0gbG9vayBiZXR0ZXIuIFRoZXNlIGxpbmVUb1xuICAgICAgICAvLyBjb21tYW5kcyB3aWxsIGJlIG51bWJlcmVkIGFzIE4uNSwgd2hlcmUgTiBpcyB0aGUgbnVtYmVyIG9mIHRoZSBhcmMuXG5cbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLmJlZ2luRmlsbChvcHRpb25zLmZpbGxDb2xvcik7XG4gICAgICAgIHRoaXMubGluZVN0eWxlKG9wdGlvbnMubGluZVdpZHRoLCBvcHRpb25zLnN0cm9rZUNvbG9yKTtcbiAgICAgICAgdGhpcy5tb3ZlVG8ocmFkaXVzLCAwKTsgICAgICAgICAgLy8gMFxuICAgICAgICB0aGlzLmxpbmVUbyh3aWR0aCAtIHJhZGl1cywgMCk7ICAvLyAxXG4gICAgICAgIGlmIChyYWRpdXMgPiAwKSB7XG4gICAgICAgICAgICAvLyAoMikgVG9wLXJpZ2h0IGNvcm5lci5cbiAgICAgICAgICAgIHRoaXMuYXJjKHdpZHRoIC0gcmFkaXVzLCByYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICByYWRpdXMsIE1hdGguUEkgLyAyICogMywgTWF0aC5QSSAqIDIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGluZVRvKHdpZHRoLCByYWRpdXMpOyAgICAgICAgICAgLy8gMi41XG4gICAgICAgIHRoaXMubGluZVRvKHdpZHRoLCBoZWlnaHQgLSByYWRpdXMpOyAgLy8gM1xuICAgICAgICBpZiAocmFkaXVzID4gMCkge1xuICAgICAgICAgICAgLy8gKDQpIEJvdHRvbS1yaWdodCBjb3JuZXIuXG4gICAgICAgICAgICB0aGlzLmFyYyh3aWR0aCAtIHJhZGl1cywgaGVpZ2h0IC0gcmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgcmFkaXVzLCAwLCBNYXRoLlBJIC8gMik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lVG8od2lkdGggLSByYWRpdXMsIGhlaWdodCk7ICAvLyA0LjVcbiAgICAgICAgdGhpcy5saW5lVG8ocmFkaXVzLCBoZWlnaHQpOyAgICAgICAgICAvLyA1XG4gICAgICAgIGlmIChyYWRpdXMgPiAwKSB7XG4gICAgICAgICAgICAvLyAoNikgQm90dG9tLWxlZnQgY29ybmVyLlxuICAgICAgICAgICAgdGhpcy5hcmMocmFkaXVzLCBoZWlnaHQgLSByYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICByYWRpdXMsIE1hdGguUEkgLyAyLCBNYXRoLlBJKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVUbygwLCBoZWlnaHQgLSByYWRpdXMpOyAgLy8gNi41XG4gICAgICAgIHRoaXMubGluZVRvKDAsIHJhZGl1cyk7ICAgICAgICAgICAvLyA3XG4gICAgICAgIGlmIChyYWRpdXMgPiAwKSB7XG4gICAgICAgICAgICAvLyAoOCkgVG9wLWxlZnQgY29ybmVyLlxuICAgICAgICAgICAgdGhpcy5hcmMocmFkaXVzLCByYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICByYWRpdXMsIE1hdGguUEksIE1hdGguUEkgLyAyICogMyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJsZXQgQnV0dG9uU3RhdGUgPSB7XG4gICAgRE9XTjogXCJkb3duXCIsXG4gICAgSE9WRVI6IFwiaG92ZXJcIixcbiAgICBOT1JNQUw6IFwibm9ybWFsXCIsXG59O1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgZW5jYXBzdWxhdGVzIHRoZSBsb2dpYyBmb3Igc3RhdGUgdHJhbnNpdGlvbnMgb24gYSBidXR0b24uIEl0IGVtaXRzXG4gKiBldmVudHMgd2hlbiBhIGJ1dHRvbiBzaG91bGQgY2hhbmdlIHRoZSBzdGF0ZSwgd2l0aCBlYWNoIGRpZmZlcmVudCBldmVudFxuICogc2lnbmlmeWluZyBhIGRpZmZlcmVudCBzdGF0ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEJ1dHRvblN0YXRlSGFuZGxlciB7XG4gICAgLy8gVGhlIHRhcmdldCBQSVhJIG9iamVjdCB0aGF0IHdpbGwgYmUgcmVjZWl2aW5nIGV2ZW50cy5cbiAgICBwcml2YXRlIHRhcmdldDogUElYSS5Db250YWluZXI7XG4gICAgLy8gSGFuZGxlcnMgZm9yIHRoZSBldmVudHMgd2Ugd2lsbCBiZSBmaXJpbmcsIHNvIHRoYXQgd2UgZG9uJ3QgbGVhayBldmVudHNcbiAgICAvLyB0byBhbnlvbmUgb3V0c2lkZSB0aGlzIGZpbGUuXG4gICAgcHJpdmF0ZSBoYW5kbGVyczoge1trZXk6IHN0cmluZ106IEFycmF5PCgpID0+IHZvaWQ+fTtcbiAgICBwcml2YXRlIG1vdXNlOiB7ZG93bjogYm9vbGVhbiwgaW5zaWRlOiBib29sZWFufTtcblxuICAgIGNvbnN0cnVjdG9yKHRhcmdldDogUElYSS5Db250YWluZXIpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICAgICAgdGhpcy5tb3VzZSA9IHtkb3duOiBmYWxzZSwgaW5zaWRlOiBmYWxzZX07XG5cbiAgICAgICAgdGhpcy50YXJnZXQuaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgICAgICB0aGlzLnRhcmdldC5idXR0b25Nb2RlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50YXJnZXQub24oXCJwb2ludGVyZG93blwiLCAoKSA9PiB0aGlzLmhhbmRsZU1vdXNlRG93bigpKTtcbiAgICAgICAgdGhpcy50YXJnZXQub24oXCJwb2ludGVydXBcIiwgKCkgPT4gdGhpcy5oYW5kbGVNb3VzZVVwKCkpO1xuICAgICAgICB0aGlzLnRhcmdldC5vbihcInBvaW50ZXJ1cG91dHNpZGVcIiwgKCkgPT4gdGhpcy5oYW5kbGVNb3VzZVVwKCkpO1xuICAgICAgICB0aGlzLnRhcmdldC5vbihcInBvaW50ZXJtb3ZlXCIsIChldmVudCkgPT4gdGhpcy5oYW5kbGVNb3VzZU1vdmUoZXZlbnQpKTtcbiAgICB9XG5cbiAgICAvKiogUmVnaXN0ZXJzIGEgaG92ZXIgaGFuZGxlci4gKi9cbiAgICBwdWJsaWMgd2hlbkhvdmVyZWQoaGFuZGxlcjogKCkgPT4gdm9pZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW4oQnV0dG9uU3RhdGUuSE9WRVIsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKiBSZWdpc3RlcnMgYSBidXR0b24gZG93biBoYW5kbGVyLiAqL1xuICAgIHB1YmxpYyB3aGVuRG93bihoYW5kbGVyOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbihCdXR0b25TdGF0ZS5ET1dOLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKiogUmVnaXN0ZXJzIGEgYnV0dG9uIG5vcm1hbCBoYW5kbGVyLiAqL1xuICAgIHB1YmxpYyB3aGVuTm9ybWFsKGhhbmRsZXI6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuKEJ1dHRvblN0YXRlLk5PUk1BTCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgYSBQSVhJIHBvaW50ZXJkb3duIGV2ZW50LlxuICAgICAqL1xuICAgIHByaXZhdGUgaGFuZGxlTW91c2VEb3duKCkge1xuICAgICAgICAvLyBXaGVuIHdlIGdldCB0aGlzIGV2ZW50LCB0aGUgbW91c2UgaXMgZ3VhcmFudGVlZCB0byBiZSBpbnNpZGUgdGhlXG4gICAgICAgIC8vIGJ1dHRvbi5cbiAgICAgICAgdGhpcy5tb3VzZS5pbnNpZGUgPSB0cnVlO1xuICAgICAgICB0aGlzLm1vdXNlLmRvd24gPSB0cnVlO1xuICAgICAgICB0aGlzLmZpcmUoQnV0dG9uU3RhdGUuRE9XTik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgYSBQSVhJIHBvaW50ZXJ1cCBldmVudC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGhhbmRsZU1vdXNlVXAoKSB7XG4gICAgICAgIHRoaXMuZmlyZSh0aGlzLm1vdXNlLmluc2lkZSA/IEJ1dHRvblN0YXRlLkhPVkVSIDogQnV0dG9uU3RhdGUuTk9STUFMKTtcbiAgICAgICAgdGhpcy5tb3VzZS5kb3duID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgYSBQSVhJIHBvaW50ZXJtb3ZlIGV2ZW50LiBUaGlzIG1ldGhvZCBjb250cm9scyB0aGUgc3RhdGUgb2ZcbiAgICAgKiBgbW91c2UuaW5zaWRlYCwgYW5kIHBvc3NpYmx5IGZpcmVzIEJ1dHRvblN0YXRlLkhPVkVSIGFuZFxuICAgICAqIEJ1dHRvblN0YXRlLk5PUk1BTCBldmVudHMgd2hlbiB0aGUgc3RhdGUgY2hhbmdlcy5cbiAgICAgKi9cbiAgICBwcml2YXRlIGhhbmRsZU1vdXNlTW92ZShldmVudDogUElYSS5pbnRlcmFjdGlvbi5JbnRlcmFjdGlvbkV2ZW50KSB7XG4gICAgICAgIC8vIElnbm9yZSB0aGUgZXZlbnQgZW50aXJlIGlmIHRoZSBtb3VzZSBidXR0b24gaXMgbm90IGRvd24uXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IGV2ZW50LmRhdGEuZ2xvYmFsO1xuICAgICAgICAvLyBEZXRlcm1pbmUgd2hldGhlciB0aGUgcG9pbnRlciBpcyBpbnNpZGUgdGhlIGJvdW5kcyBvZiB0aGUgYnV0dG9uLlxuICAgICAgICBsZXQgaXNQb2ludGVySW5zaWRlID0gIShcbiAgICAgICAgICAgIHBvc2l0aW9uLnggPCB0aGlzLnRhcmdldC5wb3NpdGlvbi54IHx8XG4gICAgICAgICAgICBwb3NpdGlvbi55IDwgdGhpcy50YXJnZXQucG9zaXRpb24ueSB8fFxuICAgICAgICAgICAgcG9zaXRpb24ueCA+IHRoaXMudGFyZ2V0LnBvc2l0aW9uLnggKyB0aGlzLnRhcmdldC53aWR0aCB8fFxuICAgICAgICAgICAgcG9zaXRpb24ueSA+IHRoaXMudGFyZ2V0LnBvc2l0aW9uLnkgKyB0aGlzLnRhcmdldC5oZWlnaHQpO1xuICAgICAgICBpZiAoaXNQb2ludGVySW5zaWRlICE9PSB0aGlzLm1vdXNlLmluc2lkZSkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIFwiaW5zaWRlXCIgc3RhdGUgaGFzIGNoYW5nZWQsIHdlIG5lZWQgdG8gcmFpc2UgdGhlIGNvcnJlY3RcbiAgICAgICAgICAgIC8vIGV2ZW50cyBzbyB0aGF0IHRoZSBidXR0b24gYXBwZWFyYW5jZSBjYW4gY2hhbmdlLlxuICAgICAgICAgICAgdGhpcy5tb3VzZS5pbnNpZGUgPSBpc1BvaW50ZXJJbnNpZGU7XG4gICAgICAgICAgICBpZiAoIXRoaXMubW91c2UuZG93bikge1xuICAgICAgICAgICAgICAgIGlmIChpc1BvaW50ZXJJbnNpZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKEJ1dHRvblN0YXRlLkhPVkVSKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpcmUoQnV0dG9uU3RhdGUuTk9STUFMKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQSBwcml2YXRlIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIGEgbGlzdGVuZXIgZm9yIGFuIGFyYml0cmFyeSBldmVudC4gKi9cbiAgICBwcml2YXRlIGxpc3RlbihldmVudDogc3RyaW5nLCBoYW5kbGVyOiAoKSA9PiB2b2lkKTogQnV0dG9uU3RhdGVIYW5kbGVyIHtcbiAgICAgICAgaWYgKHRoaXMuaGFuZGxlcnNbZXZlbnRdID09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlcnNbZXZlbnRdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5oYW5kbGVyc1tldmVudF0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEEgcHJpdmF0ZSBmdW5jdGlvbiB0byBmaXJlIHRoZSBnaXZlbiBldmVudC4gKi9cbiAgICBwcml2YXRlIGZpcmUoZXZlbnQ6IHN0cmluZykge1xuICAgICAgICBsZXQgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzW2V2ZW50XTtcbiAgICAgICAgaWYgKGhhbmRsZXJzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGhhbmRsZXIgb2YgaGFuZGxlcnMpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLyBUaGlzIGZpbGUgY29udGFpbnMgc29tZSBidXR0b24gY29sb3JzIGFuZCBvdGhlciBzdHlsZSBwcm9wZXJ0aWVzIHRoYXQgbG9va1xuLy8gZmFpcmx5IGRlY2VudC4gVGhlc2UgYnV0dG9uIHN0eWxlcyB3ZXJlIGJvcnJvd2VkIGZyb20gdGhlIEJvb3RzdHJhcCBkZWZhdWx0XG4vLyBjb25maWd1cmF0aW9uLlxuXG4vLyBDb2xvcnMgb2YgdGhlIGJ1dHRvbiBiYWNrZ3JvdW5kcywgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiB0aGUgYnV0dG9uLlxuZXhwb3J0IGNvbnN0IEJ1dHRvbkNvbG9ycyA9IHtcbiAgICBEQU5HRVI6IHtub3JtYWw6IDB4ZDk1MzRmLCBob3ZlcmVkOiAweGM5MzAyYywgZG93bjogMHhhYzI5MjV9LFxuICAgIFNVQ0NFU1M6IHtub3JtYWw6IDB4NUNCODVDLCBob3ZlcmVkOiAweDQ0OUQ0NCwgZG93bjogMHgzOTg0Mzl9LFxuICAgIFdBUk5JTkc6IHtub3JtYWw6IDB4ZjBhZDRlLCBob3ZlcmVkOiAweGVjOTcxZiwgZG93bjogMHhkNTg1MTJ9LFxufTtcblxuLy8gQ29sb3JzIG9mIHRoZSBidXR0b24gYm9yZGVycywgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiB0aGUgYnV0dG9uLlxuZXhwb3J0IGNvbnN0IEJ1dHRvbkJvcmRlckNvbG9ycyA9IHtcbiAgICBEQU5HRVI6IHtub3JtYWw6IDB4ZDQzZjNhLCBob3ZlcmVkOiAweGFjMjkyNSwgZG93bjogMHg3NjFjMTl9LFxuICAgIFNVQ0NFU1M6IHtub3JtYWw6IDB4NGNhZTRjLCBob3ZlcmVkOiAweDM5ODQzOSwgZG93bjogMHgyNTU2MjV9LFxuICAgIFdBUk5JTkc6IHtub3JtYWw6IDB4ZWVhMjM2LCBob3ZlcmVkOiAweGQ1ODUxMiwgZG93bjogMHg5ODVmMGR9LFxufTtcblxuLy8gQSB0ZXh0IHN0eWxlIHRoYXQgaXMgY29udmVuaWVudCB0byB1c2UgZm9yIHRoZSBidXR0b25zLlxuZXhwb3J0IGNvbnN0IEJ1dHRvblRleHRTdHlsZSA9IHtcbiAgICBmaWxsOiAweEZGRkZGRixcbiAgICBmb250RmFtaWx5OiBcIkhlbHZldGljYSBOZXVlXCIsXG4gICAgZm9udFNpemU6IDE0LFxufTtcblxuLy8gQ29tbW9uIGJ1dHRvbiBzdHlsZSBjb25maWd1cmF0aW9uIHRoYXQgY2FuIGJlIHBhc3NlZCBkaXJlY3RseSB0byBhXG4vLyBQSVhJQnV0dG9uLlxuZXhwb3J0IGNvbnN0IEJ1dHRvblN0eWxlcyA9IHtcbiAgICBEQU5HRVI6IHtjb2xvcnM6IEJ1dHRvbkNvbG9ycy5EQU5HRVIsIHRleHQ6IEJ1dHRvblRleHRTdHlsZSxcbiAgICAgICAgICAgICBib3JkZXI6IHt3aWR0aDogMSwgY29sb3JzOiBCdXR0b25Cb3JkZXJDb2xvcnMuREFOR0VSfX0sXG4gICAgU1VDQ0VTUzoge2NvbG9yczogQnV0dG9uQ29sb3JzLlNVQ0NFU1MsIHRleHQ6IEJ1dHRvblRleHRTdHlsZSxcbiAgICAgICAgICAgICAgYm9yZGVyOiB7d2lkdGg6IDEsIGNvbG9yczogQnV0dG9uQm9yZGVyQ29sb3JzLlNVQ0NFU1N9fSxcbiAgICBXQVJOSU5HOiB7Y29sb3JzOiBCdXR0b25Db2xvcnMuV0FSTklORywgdGV4dDogQnV0dG9uVGV4dFN0eWxlLFxuICAgICAgICAgICAgICBib3JkZXI6IHt3aWR0aDogMSwgY29sb3JzOiBCdXR0b25Cb3JkZXJDb2xvcnMuV0FSTklOR319LFxufTtcblxuLy8gb3BwYSBidXR0b24gc3R5bGVcbiIsImltcG9ydCB7IFBJWElSZWN0IH0gZnJvbSBcIi4uL3NoYXBlcy9waXhpLXJlY3RcIjtcbmltcG9ydCB7IEJ1dHRvblN0YXRlSGFuZGxlciB9IGZyb20gXCIuL2J1dHRvbi1zdGF0ZS1oYW5kbGVyXCI7XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgc3R5bGluZyBpbmZvcm1hdGlvbiB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYSBQSVhJQnV0dG9uLlxuICovXG5leHBvcnQgdHlwZSBQSVhJQnV0dG9uU3R5bGUgPSB7XG4gICAgdGV4dD86IFBJWEkuVGV4dFN0eWxlT3B0aW9ucyxcbiAgICBib3JkZXI/OiB7XG4gICAgICAgIHdpZHRoPzogbnVtYmVyLFxuICAgICAgICBjb2xvcnM/OiB7XG4gICAgICAgICAgICBkb3duPzogbnVtYmVyLFxuICAgICAgICAgICAgaG92ZXJlZD86IG51bWJlcixcbiAgICAgICAgICAgIG5vcm1hbD86IG51bWJlcixcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGNvbG9ycz86IHtcbiAgICAgICAgZG93bj86IG51bWJlcixcbiAgICAgICAgaG92ZXJlZD86IG51bWJlcixcbiAgICAgICAgbm9ybWFsPzogbnVtYmVyLFxuICAgIH0sXG59O1xuXG5mdW5jdGlvbiBhY2Nlc3NPckRlZmF1bHQob2JqOiBPYmplY3QsIHBhdGg6IHN0cmluZ1tdLCBkZWZhdWx0VmFsdWU/OiBhbnkpIHtcbiAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgcGF0aCkge1xuICAgICAgICBvYmogPSBvYmpbY29tcG9uZW50XTtcbiAgICAgICAgaWYgKG9iaiA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG59O1xuXG4vKipcbiAqIEEgYnV0dG9uIGNvbXBvbmVudCB0aGF0IGNhbiBiZSBhZGRlZCB0byBhIHNjZW5lIGFuZCB3aWxsIGZpcmUgYW4gZXZlbnQgd2hlblxuICogY2xpY2tlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFBJWElCdXR0b24gZXh0ZW5kcyBQSVhJLkNvbnRhaW5lciB7XG4gICAgcHJpdmF0ZSBsYWJlbDogc3RyaW5nO1xuICAgIHByaXZhdGUgY2xpY2tIYW5kbGVyczogQXJyYXk8KCkgPT4gdm9pZD47XG4gICAgcHJpdmF0ZSBwYWRkaW5nOiBudW1iZXI7XG5cbiAgICBwcml2YXRlIHRleHQ6IFBJWEkuVGV4dDtcbiAgICBwcml2YXRlIG91dGxpbmU6IFBJWElSZWN0O1xuICAgIHByaXZhdGUgc3R5bGU6IFBJWElCdXR0b25TdHlsZTtcblxuICAgIHByaXZhdGUgYnV0dG9uV2lkdGg6IG51bWJlcjtcbiAgICBwcml2YXRlIGJ1dHRvbkhlaWdodDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IobGFiZWw6IHN0cmluZywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgc3R5bGU6IFBJWElCdXR0b25TdHlsZSA9IG51bGwpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5idXR0b25XaWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmJ1dHRvbkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5zdHlsZSA9IHN0eWxlO1xuXG4gICAgICAgIGxldCBjb3JuZXJSYWRpdXMgPSA0O1xuICAgICAgICB0aGlzLnBhZGRpbmcgPSA1O1xuICAgICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gICAgICAgIHRoaXMuY2xpY2tIYW5kbGVycyA9IFtdO1xuXG4gICAgICAgIGxldCBkb3duRmlsbENvbG9yID0gYWNjZXNzT3JEZWZhdWx0KFxuICAgICAgICAgICAgc3R5bGUsIFtcImNvbG9yc1wiLCBcImRvd25cIl0sIDB4MDBBQTAwKTtcbiAgICAgICAgbGV0IG5vcm1hbEZpbGxDb2xvciA9IGFjY2Vzc09yRGVmYXVsdChcbiAgICAgICAgICAgIHN0eWxlLCBbXCJjb2xvcnNcIiwgXCJub3JtYWxcIl0sIDB4MDBGRjAwKTtcbiAgICAgICAgbGV0IGhvdmVyRmlsbENvbG9yID0gYWNjZXNzT3JEZWZhdWx0KFxuICAgICAgICAgICAgc3R5bGUsIFtcImNvbG9yc1wiLCBcImhvdmVyZWRcIl0sIDB4NjZGRjY2KTtcblxuICAgICAgICBsZXQgZG93bkJvcmRlckNvbG9yID0gYWNjZXNzT3JEZWZhdWx0KFxuICAgICAgICAgICAgc3R5bGUsIFtcImJvcmRlclwiLCBcImNvbG9yc1wiLCBcImRvd25cIl0sIGRvd25GaWxsQ29sb3IpO1xuICAgICAgICBsZXQgbm9ybWFsQm9yZGVyQ29sb3IgPSBhY2Nlc3NPckRlZmF1bHQoXG4gICAgICAgICAgICBzdHlsZSwgW1wiYm9yZGVyXCIsIFwiY29sb3JzXCIsIFwibm9ybWFsXCJdLCBub3JtYWxGaWxsQ29sb3IpO1xuICAgICAgICBsZXQgaG92ZXJCb3JkZXJDb2xvciA9IGFjY2Vzc09yRGVmYXVsdChcbiAgICAgICAgICAgIHN0eWxlLCBbXCJib3JkZXJcIiwgXCJjb2xvcnNcIiwgXCJob3ZlcmVkXCJdLCBob3ZlckZpbGxDb2xvcik7XG5cbiAgICAgICAgdGhpcy5vdXRsaW5lID0gbmV3IFBJWElSZWN0KHdpZHRoLCBoZWlnaHQsIHtcbiAgICAgICAgICAgIGNvcm5lclJhZGl1cywgZmlsbENvbG9yOiBub3JtYWxGaWxsQ29sb3IsXG4gICAgICAgICAgICBsaW5lV2lkdGg6IHN0eWxlICYmIHN0eWxlLmJvcmRlciAmJiBzdHlsZS5ib3JkZXIud2lkdGggfHwgMCxcbiAgICAgICAgICAgIHN0cm9rZUNvbG9yOiBub3JtYWxCb3JkZXJDb2xvcn0pO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMub3V0bGluZSk7XG5cbiAgICAgICAgdGhpcy50ZXh0ID0gdGhpcy5yZW5kZXJUZXh0KCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy50ZXh0KTtcblxuICAgICAgICBuZXcgQnV0dG9uU3RhdGVIYW5kbGVyKHRoaXMpXG4gICAgICAgICAgICAud2hlbk5vcm1hbCgoKCkgPT4gdGhpcy5vdXRsaW5lLnNldENvbG9ycyh7XG4gICAgICAgICAgICAgICAgZmlsbDogbm9ybWFsRmlsbENvbG9yLCBzdHJva2U6IG5vcm1hbEJvcmRlckNvbG9yfSkpLmJpbmQodGhpcykpXG4gICAgICAgICAgICAud2hlbkhvdmVyZWQoKCgpID0+IHRoaXMub3V0bGluZS5zZXRDb2xvcnMoe1xuICAgICAgICAgICAgICAgIGZpbGw6IGhvdmVyRmlsbENvbG9yLCBzdHJva2U6IGhvdmVyQm9yZGVyQ29sb3J9KSkuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC53aGVuRG93bigoKCkgPT4gdGhpcy5vdXRsaW5lLnNldENvbG9ycyh7XG4gICAgICAgICAgICAgICAgZmlsbDogZG93bkZpbGxDb2xvciwgc3Ryb2tlOiBkb3duQm9yZGVyQ29sb3J9KSkuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbGFiZWwgb2YgdGhlIGJ1dHRvbi4gVGhpcyBhdXRvbWF0aWNhbGx5IHJlZnJlc2hlcyB0aGUgdmlldy4gS2VlcFxuICAgICAqIGluIG1pbmQgdGhhdCB0aGUgdGV4dCB3aWxsIG5vdCBiZSB3cmFwcGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBzZXRMYWJlbChuZXdUZXh0OiBzdHJpbmcpOiBQSVhJQnV0dG9uIHtcbiAgICAgICAgdGhpcy50ZXh0ID0gdGhpcy5yZW5kZXJUZXh0KG5ld1RleHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhIGhhbmRsZXIgZm9yIGEgY2xpY2sgZXZlbnQuIEVxdWl2YWxlbnQgdG9cbiAgICAgKiBgYnV0dG9uLm9uKCdjbGljaycsIC4uLilgLCBidXQgbW9yZSBjb252ZW5pZW50IGJlY2F1c2UgaXQgcmV0dXJucyB0aGVcbiAgICAgKiBidXR0b24uXG4gICAgICovXG4gICAgcHVibGljIG9uQ2xpY2soaGFuZGxlcjogKCkgPT4gdm9pZCk6IFBJWElCdXR0b24ge1xuICAgICAgICB0aGlzLm9uKFwiY2xpY2tcIiwgaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBSZW5kZXJzIGFuZCBwb3NpdGlvbnMgdGhlIHRleHQgbGFiZWwgb2YgdGhlIGJ1dHRvbi4gKi9cbiAgICBwcml2YXRlIHJlbmRlclRleHQobGFiZWw/OiBzdHJpbmcpOiBQSVhJLlRleHQge1xuICAgICAgICBsYWJlbCA9IGxhYmVsICE9IG51bGwgPyBsYWJlbCA6IHRoaXMubGFiZWw7XG4gICAgICAgIGlmICh0aGlzLnRleHQgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy50ZXh0LnRleHQgPSBsYWJlbDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGV4dCA9IHRoaXMudGV4dCB8fCBuZXcgUElYSS5UZXh0KFxuICAgICAgICAgICAgbGFiZWwsIHRoaXMuc3R5bGUgJiYgdGhpcy5zdHlsZS50ZXh0KTtcbiAgICAgICAgdGV4dC5wb3NpdGlvbi54ID0gTWF0aC5mbG9vcih0aGlzLmJ1dHRvbldpZHRoIC8gMiAtIHRleHQud2lkdGggLyAyKTtcbiAgICAgICAgdGV4dC5wb3NpdGlvbi55ID0gTWF0aC5mbG9vcih0aGlzLmJ1dHRvbkhlaWdodCAvIDIgLSB0ZXh0LmhlaWdodCAvIDIpO1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG59XG4iLCJ0eXBlIFBJWElTdGFja09wdGlvbnMgPSB7XG4gICAgcGFkZGluZz86IG51bWJlcixcbiAgICBzZXBhcmF0aW9uPzogbnVtYmVyLFxufTtcblxuLyoqXG4gKiBBIHNpbXBsZSBjbGFzcyB0aGF0IGtlZXBzIHRoZSBjb21tb24gb3B0aW9ucyBiZXR3ZWVuIHRoZSB2ZXJ0aWNhbCBhbmRcbiAqIGhvcml6b250YWwgc3RhY2tzLiBDdXJyZW50bHksIHR3byBvcHRpb25zIGFyZSBzdXBwb3J0ZWQ6XG4gKiBwYWRkaW5nOiB0aGUgYW1vdW50IG9mIHNwYWNlIGFyb3VuZCB0aGUgZWxlbWVudHMgaW4gdGhlIHN0YWNrLlxuICogc2VwYXJhdGlvbjogdGhlIGFtb3VudCBvZiBzcGFjZSBiZXR3ZWVuIHRoZSBlbGVtZW50cyBpbiB0aGUgc3RhY2suXG4gKi9cbmNsYXNzIFBJWElTdGFjayBleHRlbmRzIFBJWEkuQ29udGFpbmVyIHtcbiAgICBwcm90ZWN0ZWQgcGFkZGluZzogbnVtYmVyO1xuICAgIHByb3RlY3RlZCBzZXBhcmF0aW9uOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUElYSVN0YWNrT3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnBhZGRpbmcgPSBvcHRpb25zICYmIG9wdGlvbnMucGFkZGluZyB8fCAwO1xuICAgICAgICB0aGlzLnNlcGFyYXRpb24gPSBvcHRpb25zICYmIG9wdGlvbnMuc2VwYXJhdGlvbiB8fCAwO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBIGhvcml6b250YWwgc3RhY2sgdGhhdCBsYXlzIG91dCBpdHMgY2hpbGRyZW4gd2hlbiB0aGV5IGFyZSBhZGRlZC4gSXQgaXNcbiAqIGV4cGVjdGVkIHRoYXQgdGhlIHNpemUgY2hhbmdlcyBvZiB0aGUgY2hpbGRyZW4gKGlmIGFueSkgZG8gbm90IGFmZmVjdCB0aGVcbiAqIHBvc2l0aW9uaW5nIG9mIHRoZSBvdGhlciBjaGlsZHJlbi4gU3RhY2tzIGZyb20gbGVmdCB0byByaWdodC5cbiAqL1xuZXhwb3J0IGNsYXNzIFBJWElIU3RhY2sgZXh0ZW5kcyBQSVhJU3RhY2sge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBQSVhJU3RhY2tPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRDaGlsZChjaGlsZDogUElYSS5Db250YWluZXIpIHtcbiAgICAgICAgbGV0IGxhc3RDaGlsZCA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gMCA/XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnNsaWNlKC0xKVswXSA6IG51bGw7XG4gICAgICAgIGxldCBsYXN0Q2hpbGRSZWN0ID0gbGFzdENoaWxkID09IG51bGwgPyBudWxsIDogbGFzdENoaWxkLmdldEJvdW5kcygpO1xuICAgICAgICBzdXBlci5hZGRDaGlsZChjaGlsZCk7XG4gICAgICAgIGNoaWxkLnBvc2l0aW9uLnggPSAobGFzdENoaWxkUmVjdCA9PSBudWxsID8gdGhpcy5wYWRkaW5nIDpcbiAgICAgICAgICAgIChsYXN0Q2hpbGRSZWN0LnJpZ2h0IC0gdGhpcy5nZXRCb3VuZHMoKS5sZWZ0ICsgdGhpcy5zZXBhcmF0aW9uKSk7XG4gICAgICAgIGNoaWxkLnBvc2l0aW9uLnkgPSB0aGlzLnBhZGRpbmc7XG4gICAgfVxufVxuXG4vKipcbiAqIEEgdmVydGljYWwgc3RhY2sgdGhhdCBsYXlzIG91dCBpdHMgY2hpbGRyZW4gd2hlbiB0aGV5IGFyZSBhZGRlZC4gSXQgaXNcbiAqIGV4cGVjdGVkIHRoYXQgdGhlIHNpemUgY2hhbmdlcyBvZiB0aGUgY2hpbGRyZW4gKGlmIGFueSkgZG8gbm90IGFmZmVjdCB0aGVcbiAqIHBvc2l0aW9uaW5nIG9mIHRoZSBvdGhlciBjaGlsZHJlbi4gU3RhY2tzIGZyb20gdG9wIHRvIGJvdHRvbS5cbiAqL1xuZXhwb3J0IGNsYXNzIFBJWElWU3RhY2sgZXh0ZW5kcyBQSVhJU3RhY2sge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBQSVhJU3RhY2tPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRDaGlsZChjaGlsZDogUElYSS5Db250YWluZXIpIHtcbiAgICAgICAgbGV0IGxhc3RDaGlsZCA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gMCA/XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnNsaWNlKC0xKVswXSA6IG51bGw7XG4gICAgICAgIGxldCBsYXN0Q2hpbGRSZWN0ID0gbGFzdENoaWxkID09IG51bGwgPyBudWxsIDogbGFzdENoaWxkLmdldEJvdW5kcygpO1xuICAgICAgICBzdXBlci5hZGRDaGlsZChjaGlsZCk7XG4gICAgICAgIGNoaWxkLnBvc2l0aW9uLnggPSB0aGlzLnBhZGRpbmc7XG4gICAgICAgIGNoaWxkLnBvc2l0aW9uLnkgPSAobGFzdENoaWxkUmVjdCA9PSBudWxsID8gdGhpcy5wYWRkaW5nIDpcbiAgICAgICAgICAgIChsYXN0Q2hpbGRSZWN0LmJvdHRvbSAtIHRoaXMuZ2V0Qm91bmRzKCkudG9wICsgdGhpcy5zZXBhcmF0aW9uKSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgUElYSVJlY3QgfSBmcm9tIFwiLi4vc2hhcGVzL3BpeGktcmVjdFwiO1xuXG4vKipcbiAqIFRoZSBvcHRpb25zIHRoYXQgYXJlIGFjY2VwdGVkIGJ5IFBJWElUZXh0SW5wdXQgdG8gZGVzY3JpYmUgaXRzIGFwcGVhcmFuY2UuXG4gKi9cbnR5cGUgUElYSVRleHRJbnB1dFN0eWxlID0ge1xuICAgIC8vIFRoZSBzdHlsZSBvZiB0aGUgdGV4dCBpdHNlbGYuXG4gICAgdGV4dD86IFBJWEkuVGV4dFN0eWxlT3B0aW9ucyxcbiAgICAvLyBUaGUgY29sb3Igb2YgdGhlIHRleHQgZmlsbC5cbiAgICBjb2xvcj86IG51bWJlcixcbiAgICAvLyBUaGUgc3R5bGUgb2YgdGhlIHRleHQgb3V0bGluZS5cbiAgICBib3JkZXI/OiB7XG4gICAgICAgIHdpZHRoPzogbnVtYmVyLFxuICAgICAgICBjb2xvcj86IG51bWJlcixcbiAgICB9LFxufTtcblxuLyoqXG4gKiBBICh2ZXJ5KSBzaW1wbGUgdGV4dCBpbnB1dCBmaWVsZCB3aXRoIHJ1ZGltZW50YXJ5IGZvY3VzIHN1cHBvcnQuXG4gKiBUaGUgZm9sbG93aW5nIGZlYXR1cmVzIGNvdWxkIGJlIHN1cHBvcnRlZCwgYnV0IGFyZSBub3Q6XG4gKiAtIE11bHRpbGluZSB0ZXh0XG4gKiAtIEhvcml6b250YWwgc2Nyb2xsaW5nXG4gKiAtIFRleHQgc2VsZWN0aW9uXG4gKiAtIENvcHkgcGFzdGVcbiAqIC0gTW92aW5nIHRoZSBjdXJzb3IgdmlhIHRoZSBtb3VzZVxuICogLSBNb3ZpbmcgdGhlIGN1cnNvciB2aWEgdGhlIHVwIGFuZCBkb3duIGFycm93c1xuICpcbiAqIFRoaXMgY29tcG9uZW50IHdpbGwgZW1pdCBhICdmb2N1cycgZXZlbnQgd2hlbiBpdCBpcyBjbGlja2VkXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJVGV4dElucHV0IGV4dGVuZHMgUElYSS5Db250YWluZXIge1xuICAgIC8vIEEgZnVuY3Rpb24gdGhhdCBjb252ZXJ0cyBhIGtleUNvZGUgdG8gYSBzdHJpbmcuXG4gICAgcHJpdmF0ZSBrZXlDb2RlVG9DaGFyOiAoa2V5OiBudW1iZXIpID0+IHN0cmluZztcbiAgICAvLyBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0cnVlIHdoZW4gYSBrZXkgc2hvdWxkIGJlIGFjY2VwdGVkIGFzIGEgdHlwYWJsZVxuICAgIC8vIGNoYXJhY3Rlci5cbiAgICBwcml2YXRlIGtleUZpbHRlcjogKGtleTogbnVtYmVyKSA9PiBib29sZWFuO1xuXG4gICAgLy8gVGhlIGN1cnJlbnQgdGV4dCBvZiB0aGUgaW5wdXQuXG4gICAgcHJpdmF0ZSB0ZXh0OiBzdHJpbmc7XG4gICAgLy8gVGhlIGFtb3VudCBvZiBwYWRkaW5nIGFyb3VuZCB0aGUgdGV4dC5cbiAgICBwcml2YXRlIHBhZGRpbmc6IG51bWJlcjtcbiAgICAvLyBUaGUgbWF4aW11bSBhbGxvd2VkIGxlbmd0aCwgb3IgbnVsbCBpZiBub25lIGV4aXN0cyAobm90IHJlY29tbWVuZGVkKS5cbiAgICBwcml2YXRlIG1heExlbmd0aDogbnVtYmVyO1xuICAgIC8vIFRoZSBpbmRleCBpbnRvIHRoZSB0ZXh0IHJlcHJlc2VudGluZyB3aGVyZSB0aGUgY3Vyc29yIGN1cnJlbnRseSBpcy5cbiAgICBwcml2YXRlIGN1cnNvcjogbnVtYmVyO1xuICAgIC8vIFdoZXRoZXIgdGhpcyBjb250cm9sIGlzIGZvY3VzZWQuIFdoZW4gYSB0ZXh0IGlucHV0IGlzIGZvY3VzZWQsIGFsbCBrZXlcbiAgICAvLyBldmVudHMgd2lsbCBiZSBzZW50IHRvIGl0LiBJdCBpcyByZWNvbW1lbmRlZCB0aGF0IHRoaW5ncyBhcmUgYXJyYW5nZWQgaW5cbiAgICAvLyBhIHdheSB3aGVyZSBvbmx5IG9uZSBlbGVtZW50IGlzIGZvY3VzZWQgYXQgYSB0aW1lLlxuICAgIHByaXZhdGUgZm9jdXNlZDogYm9vbGVhbjtcblxuICAgIC8vIFRoZSBvYmplY3QgdXNlZCB0byBtZWFzdXJlIHRleHQgdG8gcGxhY2UgdGhlIGN1cnNvci5cbiAgICBwcml2YXRlIG1lYXN1cmVUZXh0T2JqZWN0OiBQSVhJLlRleHQ7XG4gICAgLy8gVGhlIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGFjdHVhbCBkaXNwbGF5ZWQgdGV4dC5cbiAgICBwcml2YXRlIHRleHRPYmplY3Q6IFBJWEkuVGV4dDtcbiAgICAvLyBUaGUgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgY3Vyc29yLlxuICAgIHByaXZhdGUgY3Vyc29yT2JqZWN0OiBQSVhJLkdyYXBoaWNzO1xuICAgIC8vIFRoZSByZWN0IG91dGxpbmUgb2YgdGhlIHRleHQgaW5wdXRcbiAgICBwcml2YXRlIG91dGxpbmU6IFBJWElSZWN0O1xuXG4gICAgY29uc3RydWN0b3IodGV4dDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICBzdHlsZTogUElYSVRleHRJbnB1dFN0eWxlID0gbnVsbCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdGhlIHByb3BlcnRpZXMgYW5kIHZhcmlhYmxlcyB0aGF0IGFmZmVjdCB2aXN1YWxcbiAgICAgICAgLy8gYXBwZWFyYW5jZS5cbiAgICAgICAgbGV0IGNvcm5lclJhZGl1cyA9IDQ7XG4gICAgICAgIHRoaXMucGFkZGluZyA9IDU7XG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG5cbiAgICAgICAgdGhpcy5mb2N1c2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY3Vyc29yID0gMDtcblxuICAgICAgICBsZXQgYmFja2dyb3VuZENvbG9yID0gc3R5bGUgJiYgc3R5bGUuY29sb3I7XG4gICAgICAgIGlmIChiYWNrZ3JvdW5kQ29sb3IgPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yID0gMHhGRkZGRkY7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBncmFwaGljIG9iamVjdHMuXG4gICAgICAgIHRoaXMub3V0bGluZSA9IG5ldyBQSVhJUmVjdCh3aWR0aCwgaGVpZ2h0LCB7XG4gICAgICAgICAgICBjb3JuZXJSYWRpdXMsIGZpbGxDb2xvcjogYmFja2dyb3VuZENvbG9yLFxuICAgICAgICAgICAgbGluZVdpZHRoOiBzdHlsZSAmJiBzdHlsZS5ib3JkZXIgJiYgc3R5bGUuYm9yZGVyLndpZHRoIHx8IDAsXG4gICAgICAgICAgICBzdHJva2VDb2xvcjogc3R5bGUgJiYgc3R5bGUuYm9yZGVyICYmIHN0eWxlLmJvcmRlci5jb2xvciB8fCAwfSk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5vdXRsaW5lKTtcblxuICAgICAgICB0aGlzLm1lYXN1cmVUZXh0T2JqZWN0ID0gbmV3IFBJWEkuVGV4dChcIlwiLCBzdHlsZS50ZXh0KTtcbiAgICAgICAgdGhpcy50ZXh0T2JqZWN0ID0gbmV3IFBJWEkuVGV4dCh0aGlzLnRleHQsIHN0eWxlLnRleHQpO1xuICAgICAgICB0aGlzLnRleHRPYmplY3QucG9zaXRpb24ueCA9IHRoaXMucGFkZGluZztcbiAgICAgICAgdGhpcy50ZXh0T2JqZWN0LnBvc2l0aW9uLnkgPSB0aGlzLnBhZGRpbmc7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy50ZXh0T2JqZWN0KTtcblxuICAgICAgICB0aGlzLmN1cnNvck9iamVjdCA9IHRoaXMuYnVpbGRUZXh0Q3Vyc29yKCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5jdXJzb3JPYmplY3QpO1xuICAgICAgICB0aGlzLm1vdmVDdXJzb3IoMCk7XG4gICAgICAgIHRoaXMuY3Vyc29yT2JqZWN0LmFscGhhID0gMDtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBpbnRlcmFjdGl2aXR5IGxvZ2ljLlxuICAgICAgICB0aGlzLmludGVyYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5vbihcInBvaW50ZXJkb3duXCIsICgpID0+IHtcbiAgICAgICAgICAgIC8vIEZvY3VzIG9uIHRoaXMgdGV4dCBpbnB1dC5cbiAgICAgICAgICAgIHRoaXMuZm9jdXNlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmN1cnNvck9iamVjdC5hbHBoYSA9IDE7XG4gICAgICAgICAgICB0aGlzLmVtaXQoXCJmb2N1c1wiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5vbihcInVuZm9jdXNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgLy8gSWYgc29tZXRoaW5nIGVtaXRzIGFuIHVuZm9jdXMgZXZlbnQgb24gdGhpcyB0ZXh0IGlucHV0LCBpdCBzaG91bGRcbiAgICAgICAgICAgIC8vIHJlYWN0LlxuICAgICAgICAgICAgdGhpcy5mb2N1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmN1cnNvck9iamVjdC5hbHBoYSA9IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlKSA9PiB7XG4gICAgICAgICAgICAvLyBJZ25vcmUga2V5cyB3aGVuIG5vdCBmb2N1c2VkLlxuICAgICAgICAgICAgaWYgKCF0aGlzLmZvY3VzZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUtleURvd24oZS5rZXlDb2RlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIHZhbHVlIG9mIHRoZSBjdXJyZW50bHkgZW50ZXJlZCB0ZXh0LiAqL1xuICAgIHB1YmxpYyBnZXRUZXh0KCkgeyByZXR1cm4gdGhpcy50ZXh0OyB9XG5cbiAgICAvKiogU2V0cyB0aGUga2V5Y29kZSBjb252ZXJ0ZXIuICovXG4gICAgcHVibGljIHNldEtleUNvZGVDb252ZXJ0ZXIoY29udmVydGVyOiAoa2V5Q29kZTogbnVtYmVyKSA9PiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5rZXlDb2RlVG9DaGFyID0gY29udmVydGVyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogU2V0cyB0aGUgbWF4IGxlbmd0aC4gKi9cbiAgICBwdWJsaWMgc2V0TWF4TGVuZ3RoKG1heExlbmd0aDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMubWF4TGVuZ3RoID0gbWF4TGVuZ3RoO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogU2V0cyB0aGUga2V5IGZpbHRlci4gKi9cbiAgICBwdWJsaWMgc2V0S2V5RmlsdGVyKGZpbHRlcjogKGtleUNvZGU6IG51bWJlcikgPT4gYm9vbGVhbikge1xuICAgICAgICB0aGlzLmtleUZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBidWlsZFRleHRDdXJzb3IoKTogUElYSS5HcmFwaGljcyB7XG4gICAgICAgIGxldCBjdXJzb3JPYmplY3QgPSBuZXcgUElYSS5HcmFwaGljcygpO1xuICAgICAgICBjdXJzb3JPYmplY3QuYmVnaW5GaWxsKDApO1xuICAgICAgICBjdXJzb3JPYmplY3QubW92ZVRvKC0xLCB0aGlzLnBhZGRpbmcpO1xuICAgICAgICBjdXJzb3JPYmplY3QubGluZVRvKC0xLCB0aGlzLm91dGxpbmUuaGVpZ2h0IC0gdGhpcy5wYWRkaW5nKTtcbiAgICAgICAgY3Vyc29yT2JqZWN0LmxpbmVUbygwLCB0aGlzLm91dGxpbmUuaGVpZ2h0IC0gdGhpcy5wYWRkaW5nKTtcbiAgICAgICAgY3Vyc29yT2JqZWN0LmxpbmVUbygwLCB0aGlzLnBhZGRpbmcpO1xuICAgICAgICByZXR1cm4gY3Vyc29yT2JqZWN0O1xuICAgIH1cblxuICAgIHByaXZhdGUgaGFuZGxlS2V5RG93bihrZXlDb2RlOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKGtleUNvZGUgPT09IDM3KSB7IC8vIGxlZnRcbiAgICAgICAgICAgIHRoaXMubW92ZUN1cnNvcihNYXRoLm1heCgwLCB0aGlzLmN1cnNvciAtIDEpKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSAzOSkgeyAvLyByaWdodFxuICAgICAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yKE1hdGgubWluKHRoaXMudGV4dC5sZW5ndGgsIHRoaXMuY3Vyc29yICsgMSkpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09IDgpIHsgLy8gYmFja3NwYWNlXG4gICAgICAgICAgICBsZXQgZmlyc3RIYWxmID0gdGhpcy50ZXh0LnNsaWNlKDAsIE1hdGgubWF4KDAsIHRoaXMuY3Vyc29yIC0gMSkpO1xuICAgICAgICAgICAgbGV0IHNlY29uZEhhbGYgPSB0aGlzLnRleHQuc2xpY2UodGhpcy5jdXJzb3IpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yKHRoaXMuY3Vyc29yIC0gMSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVRleHQoZmlyc3RIYWxmICsgc2Vjb25kSGFsZik7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gNDYpIHsgLy8gZGVsZXRlXG4gICAgICAgICAgICBsZXQgZmlyc3RIYWxmID0gdGhpcy50ZXh0LnNsaWNlKDAsIHRoaXMuY3Vyc29yKTtcbiAgICAgICAgICAgIGxldCBzZWNvbmRIYWxmID0gdGhpcy50ZXh0LnNsaWNlKFxuICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMudGV4dC5sZW5ndGgsIHRoaXMuY3Vyc29yICsgMSkpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KGZpcnN0SGFsZiArIHNlY29uZEhhbGYpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMua2V5RmlsdGVyID09IG51bGwgfHwgdGhpcy5rZXlGaWx0ZXIoa2V5Q29kZSkpIHtcbiAgICAgICAgICAgIGxldCBzdHIgPSB0aGlzLmtleUNvZGVUb0NoYXIoa2V5Q29kZSk7XG4gICAgICAgICAgICBpZiAodGhpcy51cGRhdGVUZXh0KHRoaXMudGV4dC5zbGljZSgwLCB0aGlzLmN1cnNvcikgKyBzdHIgK1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRleHQuc2xpY2UodGhpcy5jdXJzb3IpKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZUN1cnNvcih0aGlzLmN1cnNvciArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgZGlzcGxheWVkIHRleHQsIHVubGVzcyB0aGUgdGV4dCBpcyB0b28gbG9uZy5cbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHRleHQgd2FzIHVwZGF0ZWQuXG4gICAgICovXG4gICAgcHJpdmF0ZSB1cGRhdGVUZXh0KG5ld1RleHQ6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5tYXhMZW5ndGggIT0gbnVsbCAmJiBuZXdUZXh0Lmxlbmd0aCA+IHRoaXMubWF4TGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ZXh0ID0gbmV3VGV4dDtcbiAgICAgICAgdGhpcy50ZXh0T2JqZWN0LnRleHQgPSBuZXdUZXh0O1xuICAgICAgICB0aGlzLm1vdmVDdXJzb3IodGhpcy5jdXJzb3IpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZWFzdXJlcyB0aGUgZ2l2ZW4gdGV4dC5cbiAgICAgKi9cbiAgICBwcml2YXRlIG1lYXN1cmVUZXh0KHRleHQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLm1lYXN1cmVUZXh0T2JqZWN0LnRleHQgPSB0ZXh0O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IHRoaXMubWVhc3VyZVRleHRPYmplY3Qud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMubWVhc3VyZVRleHRPYmplY3QuaGVpZ2h0LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBjdXJzb3IgdG8gYG5ld1Bvc2l0aW9uYCwgd2hpY2ggc2hvdWxkIGJlIGJldHdlZW4gMCBhbmRcbiAgICAgKiB0aGlzLnRleHQubGVuZ3RoIChpbmNsdXNpdmUpLlxuICAgICAqL1xuICAgIHByaXZhdGUgbW92ZUN1cnNvcihuZXdQb3NpdGlvbjogbnVtYmVyKSB7XG4gICAgICAgIGlmIChuZXdQb3NpdGlvbiA8IDApIHtcbiAgICAgICAgICAgIG5ld1Bvc2l0aW9uID0gMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV3UG9zaXRpb24gPiB0aGlzLnRleHQubGVuZ3RoKSB7XG4gICAgICAgICAgICBuZXdQb3NpdGlvbiA9IHRoaXMudGV4dC5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGV4dFBhcnQgPSB0aGlzLnRleHQuc2xpY2UoMCwgbmV3UG9zaXRpb24pO1xuICAgICAgICB0aGlzLmN1cnNvciA9IG5ld1Bvc2l0aW9uO1xuICAgICAgICBsZXQgbWVhc3VyZWRXaWR0aCA9IHRleHRQYXJ0Lmxlbmd0aCA+IDAgP1xuICAgICAgICAgICAgdGhpcy5tZWFzdXJlVGV4dCh0ZXh0UGFydCkud2lkdGggOiAwO1xuICAgICAgICB0aGlzLmN1cnNvck9iamVjdC5wb3NpdGlvbi54ID0gbWVhc3VyZWRXaWR0aCArIHRoaXMucGFkZGluZztcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIb3dsLCBIb3dsZXIgfSBmcm9tIFwiaG93bGVyXCI7XG5cbi8qKlxuICogQW4gZW51bWVyYXRpb24gb2YgaWRlbnRpZmllcnMgZm9yIHNvdW5kcyB1c2VkIGJ5IHRoaXMgYXBwLlxuICovXG5leHBvcnQgZW51bSBTb3VuZHMge1xuICAgIFBMT1AsXG59XG5cbi8qKlxuICogQSBjbGFzcyBjb250YWluaW5nIG1ldGhvZHMgdXNlZCB0byBwbGF5IHNvdW5kcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEF1ZGlvIHtcbiAgICAvKiogSW5pdGlhbGl6ZXMgdGhlIHNvdW5kcyByZXBvc2l0b3J5LiAqL1xuICAgIHB1YmxpYyBzdGF0aWMgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKEF1ZGlvLnNvdW5kcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBBdWRpby5zb3VuZHMgPSB7fTtcbiAgICAgICAgICAgIEF1ZGlvLnNvdW5kc1tTb3VuZHMuUExPUF0gPSBuZXcgSG93bCh7XG4gICAgICAgICAgICAgICAgLy8gbXAzIGlzIHB1YmxpYyBkb21haW4sIGRvd25sb2FkZWQgZnJvbVxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9zb3VuZGJpYmxlLmNvbS8yMDY3LUJsb3AuaHRtbFxuICAgICAgICAgICAgICAgIHNyYzogW1wic291bmRzL0Jsb3AtTWFya19EaUFuZ2Vsby03OTA1NDMzNC5tcDNcIl0sXG4gICAgICAgICAgICAgICAgdm9sdW1lOiAwLjEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBQbGF5cyB0aGUgc291bmQgd2l0aCB0aGUgZ2l2ZW4gaWRlbnRpZmllci4gKi9cbiAgICBwdWJsaWMgc3RhdGljIHBsYXkoc291bmQ6IFNvdW5kcykge1xuICAgICAgICBBdWRpby5pbml0aWFsaXplKCk7XG4gICAgICAgIGxldCBob3dsID0gQXVkaW8uc291bmRzW3NvdW5kXTtcbiAgICAgICAgaWYgKGhvd2wgIT0gbnVsbCkge1xuICAgICAgICAgICAgaG93bC5wbGF5KCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gQ29udGFpbnMgdGhlIHNvdW5kcyBhcyBIb3dscy5cbiAgICBwcml2YXRlIHN0YXRpYyBzb3VuZHM6IHtba2V5OiBzdHJpbmddOiBIb3dsfTtcbn1cblxuLy8gSW5pdGlhbGl6ZSB0aGUgYXVkaW8gc28gdGhhdCB0aGUgcmVzb3VyY2VzIGFyZSBwcmVsb2FkZWQgYmVmb3JlIHdlIGF0dGVtcHQgdG9cbi8vIHBsYXkgYW55dGhpbmcuXG5BdWRpby5pbml0aWFsaXplKCk7XG4iLCJsZXQgY2xhbXAgPSAobnVtOiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcikgPT5cbiAgICBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgbnVtKSk7XG5cbmV4cG9ydCBjbGFzcyBDb29yZFV0aWxzIHtcbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIGNvb3JkaW5hdGUgYW5kIHNpemUgKGFsbCBpbiBpbnRlZ2VycyksIHRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm5cbiAgICAgKiB0aGUgaW5kZXggb2YgdGhhdCBjb29yZGluYXRlIGluIGEgZmxhdCBhcnJheS5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNvb3JkVG9JbmRleCh4OiBudW1iZXIsIHk6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG91bGRDbGFtcDogYm9vbGVhbiA9IHRydWUpOiBudW1iZXIge1xuICAgICAgICB4ID0geCB8IDA7XG4gICAgICAgIHkgPSB5IHwgMDtcbiAgICAgICAgaWYgKHNob3VsZENsYW1wKSB7XG4gICAgICAgICAgICB4ID0gY2xhbXAoeCwgMCwgd2lkdGggLSAxKTtcbiAgICAgICAgICAgIHkgPSBjbGFtcCh5LCAwLCBoZWlnaHQgLSAxKTtcbiAgICAgICAgfSBlbHNlIGlmICh4IDwgMCB8fCB5IDwgMCB8fCB4ID49IHdpZHRoIHx8IHkgPj0gaGVpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geSAqIHdpZHRoICsgeDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhbiBpbmRleCBhbmQgc2l6ZSwgdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgY29vcmRpbmF0ZS4gVGhpc1xuICAgICAqIGZ1bmN0aW9uIGlzIHRoZSBpbnZlcnNlIG9mIGNvb3JkVG9JbmRleC5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGluZGV4VG9Db29yZChcbiAgICAgICAgICAgIGluZGV4OiBudW1iZXIsIHdpZHRoOiBudW1iZXIpOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9IHtcbiAgICAgICAgaW5kZXggPSBpbmRleCB8IDA7XG4gICAgICAgIHdpZHRoID0gd2lkdGggfCAwO1xuICAgICAgICBsZXQgeCA9IGluZGV4ICUgd2lkdGg7XG4gICAgICAgIGxldCB5ID0gKGluZGV4IC0geCkgLyB3aWR0aDtcbiAgICAgICAgcmV0dXJuIHt4LCB5fTtcbiAgICB9XG59XG4iLCJpbXBvcnQgUElYSSA9IHJlcXVpcmUoXCJwaXhpLmpzXCIpO1xuXG5pbXBvcnQgeyBBcnJvd0JvYXJkQ29udHJvbGxlciB9IGZyb20gXCIuL2Fycm93cy9hcnJvdy1ib2FyZC1jb250cm9sbGVyXCI7XG5pbXBvcnQgeyBBcnJvd0JvYXJkUmVuZGVyZXIgfSBmcm9tIFwiLi9hcnJvd3MvYXJyb3ctYm9hcmQtcmVuZGVyZXJcIjtcbmltcG9ydCB7IEFycm93U3F1YXJlVHlwZSB9IGZyb20gXCIuL2Fycm93cy9hcnJvd3NcIjtcbmltcG9ydCB7IEJvYXJkLCBCb2FyZFNxdWFyZUluaXRpYWxpemVyIH0gZnJvbSBcIi4vYm9hcmQvYm9hcmRcIjtcbmltcG9ydCB7IENoZWNrZXIgfSBmcm9tIFwiLi9jaGVja2VyL2NoZWNrZXJcIjtcbmltcG9ydCB7IENoZWNrZXJDb250cm9sbGVyIH0gZnJvbSBcIi4vY2hlY2tlci9jaGVja2VyLWNvbnRyb2xsZXJcIjtcbmltcG9ydCB7IENoZWNrZXJSZW5kZXJlciB9IGZyb20gXCIuL2NoZWNrZXIvY2hlY2tlci1yZW5kZXJlclwiO1xuXG4vLyBDdXN0b20gUElYSSBjb250cm9scy9zdHlsaW5nXG5pbXBvcnQgeyBCdXR0b25TdHlsZXMgfSBmcm9tIFwiLi9yZW5kZXJhYmxlL3dpZGdldHMvYnV0dG9uLXN0eWxlXCI7XG5pbXBvcnQgeyBQSVhJQnV0dG9uIH0gZnJvbSBcIi4vcmVuZGVyYWJsZS93aWRnZXRzL3BpeGktYnV0dG9uXCI7XG5pbXBvcnQgeyBQSVhJSFN0YWNrLCBQSVhJVlN0YWNrIH0gZnJvbSBcIi4vcmVuZGVyYWJsZS93aWRnZXRzL3BpeGktc3RhY2tcIjtcbmltcG9ydCB7IFBJWElUZXh0SW5wdXQgfSBmcm9tIFwiLi9yZW5kZXJhYmxlL3dpZGdldHMvcGl4aS10ZXh0LWlucHV0XCI7XG5cbmltcG9ydCB7IEF1ZGlvLCBTb3VuZHMgfSBmcm9tIFwiLi91dGlsL2F1ZGlvXCI7XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgd29ybGQsIG9yIHRoZSBhcHAuIFRoaXMgY2xhc3MgaGFzIHRvcC1sZXZlbCBjb250cm9sIG92ZXIgYWxsXG4gKiBmdW5jdGlvbmFsaXR5IG9mIHRoZSBhcHAuIEl0IGJ1aWxkcyB0aGUgVUkgYW5kIHRpZXMgaXQgdG8gYWN0dWFsXG4gKiBmdW5jdGlvbmFsaXR5LlxuICovXG5leHBvcnQgY2xhc3MgV29ybGQge1xuICAgIHByaXZhdGUgcmVuZGVyZXI6IFBJWEkuV2ViR0xSZW5kZXJlcjtcbiAgICBwcml2YXRlIHN0YWdlOiBQSVhJLkNvbnRhaW5lcjtcblxuICAgIHByaXZhdGUgbWFpblN0YWNrOiBQSVhJLkNvbnRhaW5lcjtcbiAgICBwcml2YXRlIGxlZnRNZW51OiBQSVhJLkNvbnRhaW5lcjtcbiAgICBwcml2YXRlIHJpZ2h0U2lkZTogUElYSS5Db250YWluZXI7XG4gICAgcHJpdmF0ZSB0b3BCYXI6IFBJWEkuQ29udGFpbmVyO1xuICAgIHByaXZhdGUgYm9hcmRDb250YWluZXI6IFBJWEkuQ29udGFpbmVyO1xuICAgIHByaXZhdGUgc3RhdHVzTGFiZWw6IFBJWEkuVGV4dDtcblxuICAgIHByaXZhdGUgdXNlQ29uc3RNZW1vcnlBbGdvcml0aG06IGJvb2xlYW47XG5cbiAgICAvLyBHYW1lIHN0YXRlXG4gICAgcHJpdmF0ZSBwYXVzZWQ6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBib2FyZFdpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBib2FyZEhlaWdodDogbnVtYmVyO1xuXG4gICAgcHJpdmF0ZSBib2FyZDogQm9hcmQ8QXJyb3dTcXVhcmVUeXBlPjtcbiAgICBwcml2YXRlIGJvYXJkQ29udHJvbGxlcjogQXJyb3dCb2FyZENvbnRyb2xsZXI7XG4gICAgcHJpdmF0ZSBib2FyZFJlbmRlcmVyOiBBcnJvd0JvYXJkUmVuZGVyZXI7XG5cbiAgICBwcml2YXRlIGNoZWNrZXI6IENoZWNrZXI7XG4gICAgcHJpdmF0ZSBjaGVja2VyUmVuZGVyZXI6IENoZWNrZXJSZW5kZXJlcjtcbiAgICBwcml2YXRlIGNoZWNrZXJDb250cm9sbGVyOiBDaGVja2VyQ29udHJvbGxlcjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmJvYXJkV2lkdGggPSAxMDtcbiAgICAgICAgdGhpcy5ib2FyZEhlaWdodCA9IDEwO1xuXG4gICAgICAgIHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0gPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVyID0gdGhpcy5pbml0aWFsaXplUmVuZGVyZXIoKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLnJlbmRlcmVyLnZpZXcpO1xuICAgICAgICB0aGlzLnN0YWdlID0gbmV3IFBJWEkuQ29udGFpbmVyKCk7XG5cbiAgICAgICAgdGhpcy5sZWZ0TWVudSA9IHRoaXMuYnVpbGRMZWZ0TWVudSgpO1xuICAgICAgICB0aGlzLnJpZ2h0U2lkZSA9IHRoaXMuYnVpbGRSaWdodFNpZGUoKTtcblxuICAgICAgICB0aGlzLm1haW5TdGFjayA9IG5ldyBQSVhJSFN0YWNrKHtwYWRkaW5nOiAxMCwgc2VwYXJhdGlvbjogMTB9KTtcbiAgICAgICAgdGhpcy5zdGFnZS5hZGRDaGlsZCh0aGlzLm1haW5TdGFjayk7XG4gICAgICAgIHRoaXMubWFpblN0YWNrLmFkZENoaWxkKHRoaXMubGVmdE1lbnUpO1xuICAgICAgICB0aGlzLm1haW5TdGFjay5hZGRDaGlsZCh0aGlzLnJpZ2h0U2lkZSk7XG5cbiAgICAgICAgdGhpcy5jcmVhdGVOZXdCb2FyZCgpO1xuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsICgpID0+IHRoaXMuaGFuZGxlV2luZG93UmVzaXplKFxuICAgICAgICAgICAgd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCkpO1xuICAgICAgICB0aGlzLmhhbmRsZVdpbmRvd1Jlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSBjaGVja2VyLCBpZiB0aGVyZSBpcyBvbmUsIGFuZCByZWluc3RhbnRpYXRlcyBhbGwgdGhlIGNsYXNzZXNcbiAgICAgKiBhc3NvY2lhdGVkIHdpdGggdGhlIGJvYXJkLlxuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVOZXdCb2FyZCgpIHtcbiAgICAgICAgLy8gSWYgYSBjaGVja2VyIGV4aXN0cywgcmVtb3ZlIGl0cyByZW5kZXJlZCBlbGVtZW50IGFuZCByZXNldCBhbGxcbiAgICAgICAgLy8gY2hlY2tlci1yZWxhdGVkIHByb3BlcnRpZXMuXG4gICAgICAgIGlmICh0aGlzLmNoZWNrZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IHJlbmRlcmVkQ2hlY2tlciA9IHRoaXMuY2hlY2tlclJlbmRlcmVyLmdldFJlbmRlcmVkKCk7XG4gICAgICAgICAgICBpZiAocmVuZGVyZWRDaGVja2VyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJvYXJkQ29udGFpbmVyLnJlbW92ZUNoaWxkKHJlbmRlcmVkQ2hlY2tlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNoZWNrZXIgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyQ29udHJvbGxlciA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmNoZWNrZXJSZW5kZXJlciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCB0aGUgYm9hcmQuXG4gICAgICAgIHRoaXMuYm9hcmQgPSBuZXcgQm9hcmQ8QXJyb3dTcXVhcmVUeXBlPihcbiAgICAgICAgICAgIHRoaXMuYm9hcmRXaWR0aCwgdGhpcy5ib2FyZEhlaWdodCwgdGhpcy5hcnJvd1NxdWFyZUluaXRpYWxpemVyKTtcbiAgICAgICAgdGhpcy5ib2FyZENvbnRyb2xsZXIgPSBuZXcgQXJyb3dCb2FyZENvbnRyb2xsZXIodGhpcy5ib2FyZCk7XG4gICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlciA9IG5ldyBBcnJvd0JvYXJkUmVuZGVyZXIodGhpcy5ib2FyZCk7XG4gICAgICAgIC8vIEF0dGFjaCB0aGUgbmV3IGNsaWNrIGhhbmRsZXIsIHNpbmNlIHdlIGhhdmUgYSBuZXcgcmVuZGVyZXIgaW5zdGFuY2UuXG4gICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlci5vbkNsaWNrKCh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgbGV0IHNxdWFyZSA9IHRoaXMuYm9hcmQuZ2V0KHgsIHkpO1xuICAgICAgICAgICAgaWYgKHNxdWFyZS5hbmdsZSA9PT0gTWF0aC5yb3VuZChzcXVhcmUuYW5nbGUpKSB7XG4gICAgICAgICAgICAgICAgc3F1YXJlLmFuZ2xlID0gKHNxdWFyZS5hbmdsZSArIDEpICUgNDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYm9hcmQucHV0KHNxdWFyZSwgeCwgeSk7XG4gICAgICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIudXBkYXRlKHgsIHkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuY2hlY2tlckNvbnRyb2xsZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tlckNvbnRyb2xsZXIucmVzZXQodGhpcy51c2VDb25zdE1lbW9yeUFsZ29yaXRobSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBUaGlzIHdpbGwgY2xlYXIgdGhlIGJvYXJkIGNvbnRhaW5lciBhbmQgcmVuZGVyIHRoZSBib2FyZCBpbnRvIHRoZVxuICAgICAgICAvLyByZW5kZXJlciB2aWV3cG9ydC5cbiAgICAgICAgdGhpcy5yZXJlbmRlckJvYXJkKCk7XG4gICAgICAgIC8vIFNwaW4gdGhlIGFycm93cyBmb3IgZWZmZWN0LlxuICAgICAgICB0aGlzLmJvYXJkQ29udHJvbGxlci5pbml0aWF0ZVJvdGF0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqIFVwZGF0ZXMgdGhlIHdvcmxkLiAqL1xuICAgIHB1YmxpYyB1cGRhdGUoKSB7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5ib2FyZENvbnRyb2xsZXIudXBkYXRlKCkpIHtcbiAgICAgICAgICAgIC8vIElmIGFyZSBpbiB0aGlzIGJsb2NrLCB0aGF0IG1lYW5zIGFsbCBhcnJvd3MgYXJlIGRvbmUgc3Bpbm5pbmcuXG4gICAgICAgICAgICAvLyBJbiB0aGlzIGNhc2UsIHdlIG1pZ2h0IGVpdGhlciBoYXZlIHRvIGNyZWF0ZSBhIHJhbmRvbSBjaGVja2VyIG9yXG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGV4aXN0aW5nIG9uZS5cbiAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlci51cGRhdGVBbGwoKTtcbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBhIHJhbmRvbSBwb3NpdGlvbi5cbiAgICAgICAgICAgICAgICBsZXQgd2lkdGggPSB0aGlzLmJvYXJkLmdldFdpZHRoKCk7XG4gICAgICAgICAgICAgICAgbGV0IGkgPSBNYXRoLmZsb29yKFxuICAgICAgICAgICAgICAgICAgICBNYXRoLnJhbmRvbSgpICogd2lkdGggKiB0aGlzLmJvYXJkLmdldEhlaWdodCgpKTtcbiAgICAgICAgICAgICAgICBsZXQgeCA9IGkgJSB3aWR0aDtcbiAgICAgICAgICAgICAgICBsZXQgeSA9IChpIC0geCkgLyB3aWR0aDtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgb3VyIGNoZWNrZXIgYW5kIGFzc29jaWF0ZWQgb2JqZWN0cy5cbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXIgPSBuZXcgQ2hlY2tlcih4LCB5KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXJDb250cm9sbGVyID0gbmV3IENoZWNrZXJDb250cm9sbGVyKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJvYXJkLCB0aGlzLmNoZWNrZXIsIHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tlclJlbmRlcmVyID0gbmV3IENoZWNrZXJSZW5kZXJlcih0aGlzLmNoZWNrZXIpO1xuICAgICAgICAgICAgICAgIC8vIFJlbmRlciB0aGUgY2hlY2tlciBvbiB0aGUgYm9hcmQuIFRoaXMgaXMgY29udmVuaWVudCBiZWNhdXNlXG4gICAgICAgICAgICAgICAgLy8gdGhpcyB3YXkgdGhlIGNoZWNrZXIgd2lsbCBoYXZlIHRoZSBzYW1lIG9mZnNldCBhcyB0aGUgYm9hcmQuXG4gICAgICAgICAgICAgICAgdGhpcy5ib2FyZENvbnRhaW5lci5hZGRDaGlsZCh0aGlzLmNoZWNrZXJSZW5kZXJlci5yZW5kZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlci5nZXRTcXVhcmVTaXplKCkpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja2VyQ29udHJvbGxlci51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXJSZW5kZXJlci51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGVja2VyQ29udHJvbGxlci5oYXNEZXRlY3RlZEN5Y2xlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoXCJEZXRlY3RlZCBjeWNsZVwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY2hlY2tlckNvbnRyb2xsZXIuaGFzRGV0ZWN0ZWRFZGdlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoXCJEZXRlY3RlZCBlZGdlXCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdHVzKFwiU2VhcmNoaW5nLi4uXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEZ1dHVyZSB3b3JrLCB3ZSBjb3VsZCBkbyBiZXR0ZXIgaGVyZSBieSBoYXZpbmdcbiAgICAgICAgICAgIC8vIEFycm93Qm9hcmRDb250cm9sbGVyLnVwZGF0ZSByZXR1cm4gdGhlIHVwZGF0ZWQgc3F1YXJlXG4gICAgICAgICAgICAvLyBjb29yZGluYXRlcywgc28gd2UgY291bGQgb25seSB1cGRhdGUgdGhvc2UuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXR1cyhcIkluaXRpYWxpemluZy4uLlwiKTtcbiAgICAgICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlci51cGRhdGVBbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMuc3RhZ2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgc21hbGwgaGVscGVyIGZ1bmN0aW9uIHRoYXQgYWxsb3dzIHVzIHRvIGVhc2lseSBpbml0aWFsaXplIGFuIGFycm93XG4gICAgICogYm9hcmQgd2hlcmUgYWxsIHRoZSBhcnJvd3MgYXJlIHBvaW50aW5nIGluIGEgcmFuZG9tIGRpcmVjdGlvbi5cbiAgICAgKi9cbiAgICBwcml2YXRlIGFycm93U3F1YXJlSW5pdGlhbGl6ZXIoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAgICAgbGV0IHZlbG9jaXR5QmFzZSA9IChNYXRoLnJhbmRvbSgpIC0gLjUpIC8gMjtcbiAgICAgICAgbGV0IHZlbG9jaXR5U2lnbiA9IHZlbG9jaXR5QmFzZSA+PSAwID8gMSA6IC0xO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYW5nbGU6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDQpLFxuICAgICAgICAgICAgdmVsb2NpdHk6IHZlbG9jaXR5QmFzZSArIHZlbG9jaXR5U2lnbiAqIDAuMixcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgYSBQSVhJIHJlbmRlcmVyIGFuZCByZXR1cm5zIGl0LlxuICAgICAqL1xuICAgIHByaXZhdGUgaW5pdGlhbGl6ZVJlbmRlcmVyKCkge1xuICAgICAgICBjb25zdCByZW5kZXJlcjogUElYSS5XZWJHTFJlbmRlcmVyID0gbmV3IFBJWEkuV2ViR0xSZW5kZXJlcigxMjgwLCA3MjApO1xuICAgICAgICAvLyBGb3IgdGhlIE1hY0Jvb2tzIHdpdGggcmV0aW5hIGRpc3BsYXlzLCA0IGlzIGEgZ29vZCBudW1iZXIgaGVyZS5cbiAgICAgICAgLy8gSSdkIGd1ZXNzIHRoYXQgMiB3b3VsZCBiZSBhIGdvb2QgbnVtYmVyIGZvciBub24tcmV0aW5hIGRpc3BsYXlzLlxuICAgICAgICByZW5kZXJlci5yZXNvbHV0aW9uID0gNDtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJhc2VkIG9uIHRoZSB2YWx1ZSBvZiBgdXNlQ29uc3RNZW1vcnlBbGdvcml0aG1gLCByZXR1cm5zIHRoZSBsYWJlbCBvZiBhXG4gICAgICogYnV0dG9uIHRoYXQgd291bGQgc3dpdGNoIHRvIHRoZSBvcHBvc2l0ZS9uZXh0IG1vZGUuXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXRBbGdvcml0aG1CdXR0b25MYWJlbCgpIHtcbiAgICAgICAgbGV0IHRvQ29uc3RhbnRUaW1lTGFiZWwgPSBcIlN3aXRjaCB0byBDb25zdGFudCBNZW1vcnlcIjtcbiAgICAgICAgbGV0IHRvSGFzaE1hcExhYmVsID0gXCJTd2l0Y2ggdG8gSGFzaE1hcFwiO1xuICAgICAgICByZXR1cm4gKHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0gP1xuICAgICAgICAgICAgICAgIHRvSGFzaE1hcExhYmVsIDogdG9Db25zdGFudFRpbWVMYWJlbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQnVpbGRzIHRoZSBsZWZ0IG1lbnUuIFJldHVybnMgYSBgUElYSS5Db250YWluZXJgLCB3aGljaCBjb250YWlucyBhbGwgdGhlXG4gICAgICogYnV0dG9ucyBsYWlkIG91dCB2ZXJ0aWNhbGx5LiBDb250YWlucyB0aGUgZm9sbG93aW5nIGJ1dHRvbnM6XG4gICAgICogYFN0YXJ0YDogVW5wYXVzZXMgdGhlIGdhbWUgaWYgaXQgaXMgcGF1c2VkLlxuICAgICAqIGBTdG9wYDogUGF1c2VzIHRoZSBnYW1lIGlmIGl0IHVucGF1c2VkLlxuICAgICAqIGBSZXNldGA6IFJlc2V0cyB0aGUgYm9hcmQgYW5kIG1vdmVzIHRoZSBjaGVja2VyIHRvIGEgbmV3IHJhbmRvbSBwb3NpdGlvbi5cbiAgICAgKiBgU2h1ZmZsZSBBcnJvd3NgOiBSZXNldHMgdGhlIGJvYXJkLCBidXQgZG9lcyBub3QgbW92ZSB0aGUgY2hlY2tlci5cbiAgICAgKiBgY29uc3RhbnRNZW1vcnlCdXR0b25gOiBTd2l0Y2hlcyBiZXR3ZWVuIHRoZSB0d28gaW1wbGVtZW50ZWQgYWxnb3JpdGhtczpcbiAgICAgKiAgICAgQSBoYXNobWFwIHZlcnNpb24gdGhhdCBpcyBPKE0pIGluIG1lbW9yeSBncm93dGggKHdoZXJlIE0gaXMgdGhlIHRvdGFsXG4gICAgICogICAgICAgICBudW1iZXIgb2Ygc3F1YXJlcykuXG4gICAgICogICAgIEFuIGltcGxlbWVudGF0aW9uIG9mIEZsb3lkJ3MgVG9ydG9pc2UgYW5kIEhhcmUgYWxnb3JpdGhtLCB3aGljaCBpc1xuICAgICAqICAgICAgICAgY29uc3RhbnQgbWVtb3J5IGNvbXBsZXhpdHkuXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZExlZnRNZW51KCk6IFBJWEkuQ29udGFpbmVyIHtcbiAgICAgICAgbGV0IGJ1dHRvbldpZHRoID0gMTkwO1xuICAgICAgICBsZXQgc3RhY2sgPSBuZXcgUElYSVZTdGFjayh7c2VwYXJhdGlvbjogMTB9KTtcbiAgICAgICAgc3RhY2suYWRkQ2hpbGQoXG4gICAgICAgICAgICBuZXcgUElYSUJ1dHRvbihcIlN0YXJ0XCIsIGJ1dHRvbldpZHRoLCAzNCwgQnV0dG9uU3R5bGVzLlNVQ0NFU1MpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLmhhbmRsZVN0YXJ0R2FtZSgpKSk7XG4gICAgICAgIHN0YWNrLmFkZENoaWxkKFxuICAgICAgICAgICAgbmV3IFBJWElCdXR0b24oXCJTdG9wXCIsIGJ1dHRvbldpZHRoLCAzNCwgQnV0dG9uU3R5bGVzLldBUk5JTkcpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLmhhbmRsZVN0b3BHYW1lKCkpKTtcbiAgICAgICAgc3RhY2suYWRkQ2hpbGQoXG4gICAgICAgICAgICBuZXcgUElYSUJ1dHRvbihcIlJlc2V0XCIsIGJ1dHRvbldpZHRoLCAzNCwgQnV0dG9uU3R5bGVzLkRBTkdFUilcbiAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHRoaXMuaGFuZGxlUmVzZXRHYW1lKCkpKTtcbiAgICAgICAgc3RhY2suYWRkQ2hpbGQoXG4gICAgICAgICAgICBuZXcgUElYSUJ1dHRvbihcbiAgICAgICAgICAgICAgICBcIlNodWZmbGUgQXJyb3dzXCIsIGJ1dHRvbldpZHRoLCAzNCwgQnV0dG9uU3R5bGVzLlNVQ0NFU1MpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLmhhbmRsZVNodWZmbGVBcnJvd3MoKSkpO1xuXG4gICAgICAgIGxldCBjb25zdGFudE1lbW9yeUJ1dHRvbiA9IG5ldyBQSVhJQnV0dG9uKFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0QWxnb3JpdGhtQnV0dG9uTGFiZWwoKSwgYnV0dG9uV2lkdGgsIDM0LFxuICAgICAgICAgICAgICAgIEJ1dHRvblN0eWxlcy5XQVJOSU5HKVxuICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT5cbiAgICAgICAgICAgICAgICBjb25zdGFudE1lbW9yeUJ1dHRvbi5zZXRMYWJlbCh0aGlzLmhhbmRsZVRvZ2dsZUFsZ29yaXRobSgpKSk7XG4gICAgICAgIHN0YWNrLmFkZENoaWxkKGNvbnN0YW50TWVtb3J5QnV0dG9uKTtcbiAgICAgICAgcmV0dXJuIHN0YWNrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgVUkgd2hpY2ggY29udGFpbnMgdGhlIHRvcCBiYXIgYW5kIHRoZSBib2FyZC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGJ1aWxkUmlnaHRTaWRlKCk6IFBJWEkuQ29udGFpbmVyIHtcbiAgICAgICAgbGV0IGNvbnRhaW5lciA9IG5ldyBQSVhJVlN0YWNrKHtzZXBhcmF0aW9uOiAxMH0pO1xuICAgICAgICBjb250YWluZXIuYWRkQ2hpbGQodGhpcy50b3BCYXIgPSB0aGlzLmJ1aWxkVG9wQmFyKCkpO1xuICAgICAgICBjb250YWluZXIuYWRkQ2hpbGQodGhpcy5ib2FyZENvbnRhaW5lciA9IG5ldyBQSVhJLkNvbnRhaW5lcigpKTtcbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIGhlbHBlciBtZXRob2QgdGhhdCBzZXRzIHVwIGEgdGV4dCBpbnB1dCBmb3IgbnVtYmVyIGVudHJ5LlxuICAgICAqL1xuICAgIHByaXZhdGUgc2V0dXBTaXplSW5wdXQoaW5pdGlhbFZhbHVlOiBzdHJpbmcpOiBQSVhJVGV4dElucHV0IHtcbiAgICAgICAgbGV0IGlucHV0ID0gbmV3IFBJWElUZXh0SW5wdXQoaW5pdGlhbFZhbHVlLCA2NSwgMzAsIHtcbiAgICAgICAgICAgICAgICBib3JkZXI6IHtjb2xvcjogMHg4ODg4ODgsIHdpZHRoOiAxfSwgY29sb3I6IDB4RkZGRkZGLFxuICAgICAgICAgICAgICAgIHRleHQ6IHtmb250U2l6ZTogMTV9fSlcbiAgICAgICAgICAgIC5zZXRLZXlGaWx0ZXIoKGtleUNvZGU6IG51bWJlcikgPT4gKGtleUNvZGUgPj0gNDggJiYga2V5Q29kZSA8IDU4KSlcbiAgICAgICAgICAgIC5zZXRLZXlDb2RlQ29udmVydGVyKChrZXlDb2RlOiBudW1iZXIpID0+IFN0cmluZyhrZXlDb2RlIC0gNDgpKVxuICAgICAgICAgICAgLnNldE1heExlbmd0aCg0KTtcbiAgICAgICAgaW5wdXQub24oXCJmb2N1c1wiLCB0aGlzLnVuZm9jdXNBbGxFeGNlcHQoaW5wdXQpKTtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyB0aGUgdG9wIGJhciwgd2hpY2ggY29udGFpbnMgdGhlIHR3byB0ZXh0IGlucHV0cyBuZWNlc3NhcnkgdG9cbiAgICAgKiBjaGFuZ2UgdGhlIGJvYXJkIHNpemUsIGFuZCBhIGJ1dHRvbiB0byBhcHBseSB0aGUgY2hhbmdlOyBhcyB3ZWxsIGFzIGFcbiAgICAgKiBsYWJlbCB0aGF0IHNob3dzIHRoZSBjdXJyZW50IHN0YXR1cy5cbiAgICAgKi9cbiAgICBwcml2YXRlIGJ1aWxkVG9wQmFyKCk6IFBJWEkuQ29udGFpbmVyIHtcbiAgICAgICAgbGV0IHdpZHRoSW5wdXQgPSB0aGlzLnNldHVwU2l6ZUlucHV0KFN0cmluZyh0aGlzLmJvYXJkV2lkdGgpKTtcbiAgICAgICAgbGV0IGhlaWdodElucHV0ID0gdGhpcy5zZXR1cFNpemVJbnB1dChTdHJpbmcodGhpcy5ib2FyZEhlaWdodCkpO1xuXG4gICAgICAgIGxldCBoc3RhY2sgPSBuZXcgUElYSUhTdGFjayh7c2VwYXJhdGlvbjogMTB9KTtcbiAgICAgICAgaHN0YWNrLmFkZENoaWxkKHdpZHRoSW5wdXQpO1xuICAgICAgICBoc3RhY2suYWRkQ2hpbGQobmV3IFBJWEkuVGV4dChcbiAgICAgICAgICAgIFwieFwiLCB7Zm9udEZhbWlseTogXCJBcmlhbFwiLCBmb250U2l6ZTogMTgsIGZpbGw6IDB4ZmZmZmZmfSkpO1xuICAgICAgICBoc3RhY2suYWRkQ2hpbGQoaGVpZ2h0SW5wdXQpO1xuICAgICAgICBoc3RhY2suYWRkQ2hpbGQobmV3IFBJWElCdXR0b24oXG4gICAgICAgICAgICBcIkNoYW5nZSBCb2FyZCBTaXplXCIsIDE0MCwgMzAsIEJ1dHRvblN0eWxlcy5TVUNDRVNTKS5vbkNsaWNrKFxuICAgICAgICAgICAgKCkgPT4gdGhpcy5oYW5kbGVCb2FyZFJlc2l6ZShcbiAgICAgICAgICAgICAgICB3aWR0aElucHV0LmdldFRleHQoKSwgaGVpZ2h0SW5wdXQuZ2V0VGV4dCgpKSkpO1xuICAgICAgICBoc3RhY2suYWRkQ2hpbGQodGhpcy5zdGF0dXNMYWJlbCA9IG5ldyBQSVhJLlRleHQoXG4gICAgICAgICAgICBcIlNlYXJjaGluZy4uLlwiLCB7ZmlsbDogQnV0dG9uU3R5bGVzLldBUk5JTkcuY29sb3JzLm5vcm1hbH0pKTtcbiAgICAgICAgcmV0dXJuIGhzdGFjaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSB0ZXh0IGRpc3BsYXllZCBvbiB0aGUgc3RhdHVzIGxhYmVsLlxuICAgICAqL1xuICAgIHByaXZhdGUgc2V0U3RhdHVzKG5ld1N0YXR1czogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzTGFiZWwudGV4dCA9IG5ld1N0YXR1cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhcnMgdGhlIGJvYXJkIGNvbnRhaW5lciBhbmQgYXR0YWNoZXMgYSBuZXdseSByZW5kZXJlZCBib2FyZC5cbiAgICAgKi9cbiAgICBwcml2YXRlIHJlcmVuZGVyQm9hcmQoKSB7XG4gICAgICAgIGxldCBib2FyZENvbnRhaW5lckJvdW5kcyA9IHRoaXMuYm9hcmRDb250YWluZXIuZ2V0Qm91bmRzKCk7XG4gICAgICAgIHRoaXMuYm9hcmRDb250YWluZXIucmVtb3ZlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5ib2FyZFJlbmRlcmVyLmNsZWFyUmVuZGVyZWQoKTtcbiAgICAgICAgdGhpcy5ib2FyZENvbnRhaW5lci5hZGRDaGlsZCh0aGlzLmJvYXJkUmVuZGVyZXIucmVuZGVyKFxuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci53aWR0aCAtIGJvYXJkQ29udGFpbmVyQm91bmRzLmxlZnQsXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLmhlaWdodCAtIGJvYXJkQ29udGFpbmVyQm91bmRzLnRvcCkpO1xuICAgICAgICBpZiAodGhpcy5jaGVja2VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYm9hcmRDb250YWluZXIuYWRkQ2hpbGQodGhpcy5jaGVja2VyUmVuZGVyZXIucmVuZGVyKFxuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlci5nZXRTcXVhcmVTaXplKCkpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgc21hbGwgaGVscGVyIGZ1bmN0aW9uLCB3aGljaCB3aWxsIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBlbWl0IHRoZVxuICAgICAqICd1bmZvY3VzJyBldmVudCB0byBhbGwgb2JqZWN0cyBpbiB0aGUgc2NlbmUgZ3JhcGggZXhjZXB0IHRoZSBvYmplY3RcbiAgICAgKiBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbi5cbiAgICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgY29udHJvbGxpbmcgd2hpY2ggdGV4dCBpbnB1dCBpcyBmb2N1c2VkLlxuICAgICAqL1xuICAgIHByaXZhdGUgdW5mb2N1c0FsbEV4Y2VwdChjb250cm9sOiBQSVhJLkRpc3BsYXlPYmplY3QpIHtcbiAgICAgICAgcmV0dXJuICgpID0+IHsgIC8vIEFycm93IGZ1bmN0aW9uIHRvIGNhcHR1cmUgdGhpcy5cbiAgICAgICAgICAgIGxldCBzdGFjazogUElYSS5EaXNwbGF5T2JqZWN0W10gPSBbdGhpcy5zdGFnZV07XG4gICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBjb250YWluZXIgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyICE9PSBjb250cm9sKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5lbWl0KFwidW5mb2N1c1wiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lciBpbnN0YW5jZW9mIFBJWEkuQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBjaGlsZCBvZiBjb250YWluZXIuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWQuIFRoaXMgbWV0aG9kIHJlc2l6ZXMgdGhlIHJlbmRlcmVyLFxuICAgICAqIHJlcmVuZGVycyB0aGUgYm9hcmQgYW5kIHVwZGF0ZXMgdGhlIGNoZWNrZXIuXG4gICAgICovXG4gICAgcHJpdmF0ZSBoYW5kbGVXaW5kb3dSZXNpemUobmV3V2lkdGg6IG51bWJlciwgbmV3SGVpZ2h0OiBudW1iZXIpIHtcbiAgICAgICAgbGV0IG9sZFZpZXcgPSB0aGlzLnJlbmRlcmVyLnZpZXc7XG4gICAgICAgIHRoaXMucmVuZGVyZXIucmVzaXplKG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnZpZXcud2lkdGggPSBuZXdXaWR0aDtcbiAgICAgICAgdGhpcy5yZW5kZXJlci52aWV3LmhlaWdodCA9IG5ld0hlaWdodDtcbiAgICAgICAgdGhpcy5yZXJlbmRlckJvYXJkKCk7XG4gICAgICAgIGlmICh0aGlzLmNoZWNrZXJSZW5kZXJlciAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrZXJSZW5kZXJlci5zZXRTcXVhcmVTaXplKFxuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlci5nZXRTcXVhcmVTaXplKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gY2hhbmdlIHRoZSBib2FyZCBzaXplLiBEaXJlY3RseSB0YWtlc1xuICAgICAqIHN0cmluZ3MgdGhhdCB3aWxsIHJlcHJlc2VudCB0aGUgbmV3IGJvYXJkIHdpZHRoIGFuZCBoZWlnaHQuXG4gICAgICogSWYgZWl0aGVyIHZhbHVlIGlzIGVtcHR5IG9yIG51bGwsIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy5cbiAgICAgKi9cbiAgICBwcml2YXRlIGhhbmRsZUJvYXJkUmVzaXplKHdpZHRoU3RyOiBzdHJpbmcsIGhlaWdodFN0cjogc3RyaW5nKSB7XG4gICAgICAgIGlmICh3aWR0aFN0ciAhPSBudWxsICYmIHdpZHRoU3RyLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgIGhlaWdodFN0ciAhPSBudWxsICYmIGhlaWdodFN0ci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsZXQgd2lkdGggPSBwYXJzZUludCh3aWR0aFN0ciwgMTApO1xuICAgICAgICAgICAgbGV0IGhlaWdodCA9IHBhcnNlSW50KGhlaWdodFN0ciwgMTApO1xuICAgICAgICAgICAgaWYgKHdpZHRoID4gMCAmJiBoZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ib2FyZFdpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5ib2FyZEhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZU5ld0JvYXJkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogVW5wYXVzZXMgdGhlIGdhbWUuICovXG4gICAgcHJpdmF0ZSBoYW5kbGVTdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIFBhdXNlcyB0aGUgZ2FtZS4gKi9cbiAgICBwcml2YXRlIGhhbmRsZVN0b3BHYW1lKCkge1xuICAgICAgICB0aGlzLnBhdXNlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuc2V0U3RhdHVzKFwiUGF1c2VkXCIpO1xuICAgIH1cblxuICAgIC8qKiBSZXNldHMgdGhlIGdhbWUgYnkgc3Bpbm5pbmcgdGhlIGFycm93cyBhbmQgcmVzZXR0aW5nIHRoZSBjaGVja2VyLiAqL1xuICAgIHByaXZhdGUgaGFuZGxlUmVzZXRHYW1lKCkge1xuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNyZWF0ZU5ld0JvYXJkKCk7XG4gICAgfVxuXG4gICAgLyoqIFNodWZmbGVzIHRoZSBhcnJvd3Mgd2l0aG91dCBtb3ZpbmcgdGhlIGNoZWNrZXIuICovXG4gICAgcHJpdmF0ZSBoYW5kbGVTaHVmZmxlQXJyb3dzKCkge1xuICAgICAgICBpZiAodGhpcy5jaGVja2VyQ29udHJvbGxlciAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrZXJDb250cm9sbGVyLnJlc2V0KHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYm9hcmRDb250cm9sbGVyLmluaXRpYXRlUm90YXRpb24oKTtcbiAgICB9XG5cbiAgICAvKiogVG9nZ2xlcyB3aGV0aGVyIHRoZSBjb25zdGFudCBtZW1vcnkgYWxnb3JpdGhtIHNob3VsZCBiZSB1c2VkLiAqL1xuICAgIHByaXZhdGUgaGFuZGxlVG9nZ2xlQWxnb3JpdGhtKCk6IHN0cmluZyB7XG4gICAgICAgIHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0gPSAhdGhpcy51c2VDb25zdE1lbW9yeUFsZ29yaXRobTtcbiAgICAgICAgaWYgKHRoaXMuY2hlY2tlckNvbnRyb2xsZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyQ29udHJvbGxlci5yZXNldCh0aGlzLnVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5nZXRBbGdvcml0aG1CdXR0b25MYWJlbCgpO1xuICAgIH1cbn1cbiJdfQ==
