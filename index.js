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
            if (this.visited[positionKey] &&
                Object.keys(this.visited).length > 1) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXJyb3dzL2Fycm93LWJvYXJkLWNvbnRyb2xsZXIudHMiLCJzcmMvYXJyb3dzL2Fycm93LWJvYXJkLXJlbmRlcmVyLnRzIiwic3JjL2JvYXJkL2JvYXJkLXJlbmRlcmVyLnRzIiwic3JjL2JvYXJkL2JvYXJkLnRzIiwic3JjL2NoZWNrZXIvY2hlY2tlci1jb250cm9sbGVyLnRzIiwic3JjL2NoZWNrZXIvY2hlY2tlci1yZW5kZXJlci50cyIsInNyYy9jaGVja2VyL2NoZWNrZXIudHMiLCJzcmMvaW5kZXgudHMiLCJzcmMvcmVuZGVyYWJsZS9zaGFwZXMvcGl4aS1yZWN0LnRzIiwic3JjL3JlbmRlcmFibGUvd2lkZ2V0cy9idXR0b24tc3RhdGUtaGFuZGxlci50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvYnV0dG9uLXN0eWxlLnRzIiwic3JjL3JlbmRlcmFibGUvd2lkZ2V0cy9waXhpLWJ1dHRvbi50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvcGl4aS1zdGFjay50cyIsInNyYy9yZW5kZXJhYmxlL3dpZGdldHMvcGl4aS10ZXh0LWlucHV0LnRzIiwic3JjL3V0aWwvYXVkaW8udHMiLCJzcmMvdXRpbC9jb29yZC11dGlscy50cyIsInNyYy93b3JsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNJQTs7OztHQUlHO0FBQ0g7SUFHSSxZQUFZLEtBQTZCO1FBQ3JDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7T0FFRztJQUNJLGdCQUFnQjtRQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQXNCLEVBQUUsQ0FBUyxFQUFFLENBQVM7WUFDeEQsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLElBQUksWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFD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QUMsdUJBQXVCLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFRCxvRUFBb0U7SUFDNUQscUJBQXFCO1FBQ3pCLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztRQUM3RCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDMUMsQ0FBQztBQUNMLENBQUM7QUF4WFksYUFBSyxRQXdYakIsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgeyBCb2FyZCB9IGZyb20gXCIuLi9ib2FyZC9ib2FyZFwiO1xuaW1wb3J0IHsgQm9hcmRSZW5kZXJlciB9IGZyb20gXCIuLi9ib2FyZC9ib2FyZC1yZW5kZXJlclwiO1xuaW1wb3J0IHsgQXJyb3dTcXVhcmVUeXBlIH0gZnJvbSBcIi4vYXJyb3dzXCI7XG5cbi8qKlxuICogQSBib2FyZCBjb250cm9sbGVyIHRoYXQga25vd3MgYWJvdXQgYEJvYXJkYHMgd2l0aCBhcnJvd3MuIEFsbG93cyB1cyB0byByb3RhdGVcbiAqIGFycm93cyB3aXRoaW4gdGhlIGJvYXJkIG9uIHVwZGF0ZSwgYXMgd2VsbCBhcyBpbml0aWF0ZSB0aGUgcm90YXRpb24gb2YgdGhvc2VcbiAqIGFycm93cy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFycm93Qm9hcmRDb250cm9sbGVyIHtcbiAgICBwcml2YXRlIGJvYXJkOiBCb2FyZDxBcnJvd1NxdWFyZVR5cGU+O1xuXG4gICAgY29uc3RydWN0b3IoYm9hcmQ6IEJvYXJkPEFycm93U3F1YXJlVHlwZT4pIHtcbiAgICAgICAgdGhpcy5ib2FyZCA9IGJvYXJkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgYSByYW5kb20gcm90YXRpb25hbCB2ZWxvY2l0eSBvbiBhbGwgYXJyb3dzLlxuICAgICAqL1xuICAgIHB1YmxpYyBpbml0aWF0ZVJvdGF0aW9uKCkge1xuICAgICAgICB0aGlzLmJvYXJkLm1hcCgodmFsdWU6IEFycm93U3F1YXJlVHlwZSwgeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IHZlbG9jaXR5QmFzZSA9IChNYXRoLnJhbmRvbSgpIC0gLjUpIC8gMjtcbiAgICAgICAgICAgICAgICBsZXQgdmVsb2NpdHlTaWduID0gdmVsb2NpdHlCYXNlID49IDAgPyAxIDogLTE7XG4gICAgICAgICAgICAgICAgdmFsdWUudmVsb2NpdHkgKz0gdmVsb2NpdHlCYXNlICsgdmVsb2NpdHlTaWduICogMC40O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBhbmdsZSBhbmQgdmVsb2NpdHkgb2YgYWxsIHRoZSBzcGlubmluZyBhcnJvd3Mgb24gdGhlIGJvYXJkLlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhbnkgYXJyb3dzIGFyZSBzdGlsbCBzcGlubmluZy5cbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlKCkge1xuICAgICAgICBsZXQgc3Bpbm5pbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ib2FyZC5tYXAoKHZhbHVlOiBBcnJvd1NxdWFyZVR5cGUsIHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiB2YWx1ZS52ZWxvY2l0eSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIElmIGl0J3MgYSBub24tbnVsbCBzcXVhcmUsIGFuZCB0aGUgYXJyb3cgaGFzIHNwaW5uaW5nXG4gICAgICAgICAgICAgICAgLy8gdmVsb2NpdHksIHVwZGF0ZSBpdHMgYW5nbGUgYmFzZWQgb24gaXRzIHZlbG9jaXR5LlxuICAgICAgICAgICAgICAgIHZhbHVlLmFuZ2xlICs9IHZhbHVlLnZlbG9jaXR5O1xuICAgICAgICAgICAgICAgIC8vIENvcnJlY3QgdGhlIGFuZ2xlIHRvIGJlIGJldHdlZW4gWzAsIDQpLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5hbmdsZSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuYW5nbGUgKz0gNDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLmFuZ2xlID49IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuYW5nbGUgLT0gNDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gRGFtcGVuIHRoZSB2ZWxvY2l0eSB0byBhY2hpZXZlIGEgc2xvd2Rvd24gZWZmZWN0LlxuICAgICAgICAgICAgICAgIHZhbHVlLnZlbG9jaXR5ICo9IDAuOTk7XG4gICAgICAgICAgICAgICAgLy8gRmxvYXRzIGFyZSBoYXJkLCBzbyB3ZSBuZWVkIHNvbWUgdGhyZXNob2xkIGF0IHdoaWNoIHdlJ2xsXG4gICAgICAgICAgICAgICAgLy8gZGVjaWRlIHRoYXQgd2Ugc2hvdWxkIHN0b3AgdGhlIGFycm93IGlmIGl0IHBvaW50cyBpbiBhIHZhbGlkXG4gICAgICAgICAgICAgICAgLy8gZGlyZWN0aW9uLlxuICAgICAgICAgICAgICAgIGxldCBhYnNWZWxvY2l0eSA9IE1hdGguYWJzKHZhbHVlLnZlbG9jaXR5KTtcbiAgICAgICAgICAgICAgICBsZXQgYWxtb3N0U3RvcHBlZFZlbG9jaXR5ID0gMC4wMjtcbiAgICAgICAgICAgICAgICBsZXQgYWxtb3N0U3RvcHBlZCA9IGFic1ZlbG9jaXR5IDwgYWxtb3N0U3RvcHBlZFZlbG9jaXR5O1xuICAgICAgICAgICAgICAgIC8vIFJlcHJlc2VudHMgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgbmVhcmVzdCBkaXNjcmV0ZSBhbmdsZVxuICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uIGFuZCB0aGUgY3VycmVudCBhbmdsZSBwb3NpdGlvbi4gSWYgdGhleSBhcmUgY2xvc2VcbiAgICAgICAgICAgICAgICAvLyBlbm91Z2gsIGFuZCB0aGUgYXJyb3cgaXMgc3Bpbm5pbmcgc2xvd2x5IGVub3VnaCwgd2Ugc3RvcCB0aGVcbiAgICAgICAgICAgICAgICAvLyBhcnJvdyBvbiB0aGUgZGlzY3JldGUgZGlyZWN0aW9uLlxuICAgICAgICAgICAgICAgIGxldCBhbmd1bGFyRGlmZmVyZW5jZSA9IHRoaXMuZ2V0QW5nbGVEaWZmZXJlbmNlKFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hbmdsZSwgTWF0aC5yb3VuZCh2YWx1ZS5hbmdsZSkpO1xuICAgICAgICAgICAgICAgIGlmIChhbG1vc3RTdG9wcGVkICYmIGFuZ3VsYXJEaWZmZXJlbmNlIDwgMC4wMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTdG9wIHRoZSBhcnJvdyBmcm9tIHNwaW5uaW5nIGFuZCBzbmFwIGl0IHRvIHRoZSBuZWFyZXN0XG4gICAgICAgICAgICAgICAgICAgIC8vIGRpc2NyZXRlIGFuZ2xlLlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS52ZWxvY2l0eSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmFuZ2xlID0gTWF0aC5yb3VuZCh2YWx1ZS5hbmdsZSkgJSA0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBhcnJvdyBoYXMgcHJhY3RpY2FsbHkgc3RvcHBlZCwgYW5kIHdlIGFyZW4ndCBjbG9zZVxuICAgICAgICAgICAgICAgICAgICAvLyB0byBhIGRpc2NyZXRlIGFuZ2xlLCBnaXZlIGl0IGEgc21hbGwga2ljayBpbiBhIHJhbmRvbVxuICAgICAgICAgICAgICAgICAgICAvLyBkaXJlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIGlmIChhYnNWZWxvY2l0eSA8IGFsbW9zdFN0b3BwZWRWZWxvY2l0eSAvIDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS52ZWxvY2l0eSArPSBNYXRoLnJhbmRvbSgpICogMC4yIC0gMC4xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNwaW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3Bpbm5pbmc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgZGlmZmVyZW5jZSBvZiB0d28gYW5nbGVzIHJlcHJlc2VudGVkIGluIHRoZSBmb3JtIGRlc2NyaWJlZCBpblxuICAgICAqIHtAc2VlIEFycm93U3F1YXJlVHlwZX0uXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXRBbmdsZURpZmZlcmVuY2UoYW5nbGUxOiBudW1iZXIsIGFuZ2xlMjogbnVtYmVyKSB7XG4gICAgICAgIGFuZ2xlMSA9IGFuZ2xlMSAlIDQ7XG4gICAgICAgIGlmIChhbmdsZTEgPCAwKSB7XG4gICAgICAgICAgICBhbmdsZTEgKz0gNDtcbiAgICAgICAgfVxuICAgICAgICBhbmdsZTIgPSBhbmdsZTIgJSA0O1xuICAgICAgICBpZiAoYW5nbGUyIDwgMCkge1xuICAgICAgICAgICAgYW5nbGUyICs9IDQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlIGxvZ2ljIGhlcmUgaXMgdG8gc3VwcG9ydCB0aGUgZm9sbG93aW5nIGNhc2VzOlxuICAgICAgICAvLyBhbmdsZTEgPSAwLjEsIGFuZ2xlMiA9IDMuOVxuICAgICAgICAvLyBhbmdsZTEgPSAzLjksIGFuZ2xlMiA9IDAuMVxuICAgICAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5hYnMoYW5nbGUxIC0gYW5nbGUyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKGFuZ2xlMSAtIChhbmdsZTIgKyA0KSksXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhhbmdsZTEgLSAoYW5nbGUyIC0gNCkpKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBBcnJvd1NxdWFyZVR5cGUgfSBmcm9tIFwiLi4vYXJyb3dzL2Fycm93c1wiO1xuaW1wb3J0IHsgQm9hcmQgfSBmcm9tIFwiLi4vYm9hcmQvYm9hcmRcIjtcbmltcG9ydCB7IEJvYXJkUmVuZGVyZXIsIFVwZGF0YWJsZVJlbmRlcmFibGUgfSBmcm9tIFwiLi4vYm9hcmQvYm9hcmQtcmVuZGVyZXJcIjtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgcmVuZGVyZXIgZm9yIGFuIGBBcnJvd0JvYXJkYC4gVGhlIG9ubHkgcmVhbCBiZW5lZml0IGhlcmUgaXMgdGhhdFxuICogaXQgYWxsb3dzIHVzIHRvIGlzb2xhdGUgdGhlIGFycm93IHJlbmRlcmluZyBmdW5jdGlvbiwgYW5kIG5vdCBjb3VwbGUgaXQgdG9cbiAqIHRoZSBib2FyZC4gT3RoZXJ3aXNlLCB3ZSdkIGVpdGhlciBoYXZlIHRvIGNvZGUgdGhlIGBCb2FyZFJlbmRlcmVyYCB0byBzdXBwb3J0XG4gKiBhcnJvd3MsIG9yIHBhc3MgaXQgcmVuZGVyU3F1YXJlIGFzIGEgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBBcnJvd0JvYXJkUmVuZGVyZXIgZXh0ZW5kcyBCb2FyZFJlbmRlcmVyPEFycm93U3F1YXJlVHlwZT4ge1xuICAgIGNvbnN0cnVjdG9yKGJvYXJkOiBCb2FyZDxBcnJvd1NxdWFyZVR5cGU+KSB7XG4gICAgICAgIHN1cGVyKGJvYXJkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBjb250YWlucyB0aGUgbG9naWMgZm9yIHJlbmRlcmluZyBhbiBhcnJvdyB3aXRoaW4gYSBzcXVhcmUuXG4gICAgICovXG4gICAgcHVibGljIHJlbmRlclNxdWFyZShzcXVhcmU6IEFycm93U3F1YXJlVHlwZSwgc2l6ZTogbnVtYmVyKTpcbiAgICAgICAgICAgIFVwZGF0YWJsZVJlbmRlcmFibGU8QXJyb3dTcXVhcmVUeXBlPiB7XG4gICAgICAgIGxldCBjb250YWluZXIgPSBuZXcgUElYSS5Db250YWluZXIoKTtcbiAgICAgICAgLy8gQSBzcXVhcmUgbXVzdCByZXR1cm4gYSBjb250YWluZXIgYW5kIGFuIHVwZGF0ZSBmdW5jdGlvbiAodG8gbW9kaWZ5XG4gICAgICAgIC8vIHJlbmRlcmVkIHNxdWFyZXMpLiBXZSBjb3VsZCBzcGVjaWZ5IHRoZSBkZWZhdWx0IGZ1bmN0aW9uIGhlcmUsIGJ1dFxuICAgICAgICAvLyBzaW5jZSB3ZSBzaG91bGQgbmV2ZXIgaGF2ZSBudWxsIHNxdWFyZXMsIHdlIHdvdWxkIGFsd2F5cyBiZSBjcmVhdGluZ1xuICAgICAgICAvLyBhIGZ1bmN0aW9uIGFuZCB0aGVuIHRocm93aW5nIGl0IGF3YXkuIEluc3RlYWQsIHRoZSBmYWxsYmFjayBpcyBpbiB0aGVcbiAgICAgICAgLy8gcmV0dXJuIHN0YXRlbWVudC5cbiAgICAgICAgbGV0IHVwZGF0ZSA9IG51bGw7XG4gICAgICAgIGlmIChzcXVhcmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gVGhlIGZ1bGwgc2l6ZSBvZiB0aGUgYXJyb3csIGVuZCB0byBlbmQsIHdpdGggc2l6ZS8yIGJlaW5nIHRoZVxuICAgICAgICAgICAgLy8gbWlkZGxlLlxuICAgICAgICAgICAgbGV0IGFycm93U2l6ZSA9IHNpemUgKiAwLjg7XG4gICAgICAgICAgICAvLyBUaGUgd2lkdGggb2YgdGhlIHNoYWZ0IG9mIHRoZSBhcnJvdy5cbiAgICAgICAgICAgIGxldCBhcnJvd1dpZHRoID0gYXJyb3dTaXplICogMC4zNTtcbiAgICAgICAgICAgIC8vIFRoZSB3aWR0aCBvZiB0aGUgdGlwIGF0IHRoZSB3aWRlc3QgcG9pbnQuXG4gICAgICAgICAgICBsZXQgYXJyb3dUaXBXaWR0aCA9IGFycm93U2l6ZSAqIDAuOTU7XG4gICAgICAgICAgICAvLyBIb3cgZmFyIGZyb20gdGhlIG1pZGRsZSAoYXJyb3dTaXplLzIpIHRoZSB0aXAgc2hvdWxkIHN0YXJ0LlxuICAgICAgICAgICAgbGV0IGFycm93U3RlbUxlbmd0aEZyb21NaWQgPSAwO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRoZSBkaWFncmFtIGJlbG93IHNob3dzIHRoZSBvcmRlciBpbiB3aGljaCBwb2ludHMgYXJlIHZpc2l0ZWQuXG4gICAgICAgICAgICAgKiBpLmUuIHRoZSBmaXJzdCBtb3ZlVG8gaXMgMCwgdGhlIGZpcnN0IGxpbmVUbyBpcyAxLCB0aGUgc2Vjb25kXG4gICAgICAgICAgICAgKiBsaW5lVG8gaXMgMiwgYW5kIHNvIG9uLiBBbGwgcG9pbnRzIGFyZSBkZXJpdmVkIGZyb20gdGhlIGZvdXJcbiAgICAgICAgICAgICAqIG1ldHJpY3MgYWJvdmUsIHdoaWNoIGFyZSBpbiB0dXJuIGRlcml2ZWQgZnJvbSB0aGUgc3F1YXJlIHNpemUuXG4gICAgICAgICAgICAgKiAgICAgICAgICAgICAyICtcbiAgICAgICAgICAgICAqICAgICAgICAgICAgICAgfCBcXFxuICAgICAgICAgICAgICogICAwICAgICAgICAgICB8ICBcXFxuICAgICAgICAgICAgICogICArLS0tLS0tLS0tLS0rIDEgXFxcbiAgICAgICAgICAgICAqICAgfCAgICAgICAgICAgICAgICBcXCAzXG4gICAgICAgICAgICAgKiAgIHwgICAgICAgICAgIDUgICAgL1xuICAgICAgICAgICAgICogICArLS0tLS0tLS0tLS0rICAgL1xuICAgICAgICAgICAgICogICA2ICAgICAgICAgICB8ICAvXG4gICAgICAgICAgICAgKiAgICAgICAgICAgICAgIHwgL1xuICAgICAgICAgICAgICogICAgICAgICAgICAgNCArXG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgbGV0IGdyYXBoaWNzID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hZGRDaGlsZChncmFwaGljcyk7XG4gICAgICAgICAgICBncmFwaGljcy5iZWdpbkZpbGwoMHhGRjAwMDApO1xuICAgICAgICAgICAgZ3JhcGhpY3MubW92ZVRvKC1hcnJvd1NpemUgLyAyLCAtYXJyb3dXaWR0aCAvIDIpO1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKGFycm93U3RlbUxlbmd0aEZyb21NaWQsIC1hcnJvd1dpZHRoIC8gMik7XG4gICAgICAgICAgICBncmFwaGljcy5saW5lVG8oYXJyb3dTdGVtTGVuZ3RoRnJvbU1pZCwgLWFycm93VGlwV2lkdGggLyAyKTtcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVUbyhhcnJvd1NpemUgLyAyLCAwKTtcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVUbyhhcnJvd1N0ZW1MZW5ndGhGcm9tTWlkLCBhcnJvd1RpcFdpZHRoIC8gMik7XG4gICAgICAgICAgICBncmFwaGljcy5saW5lVG8oYXJyb3dTdGVtTGVuZ3RoRnJvbU1pZCwgYXJyb3dXaWR0aCAvIDIpO1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKC1hcnJvd1NpemUgLyAyLCBhcnJvd1dpZHRoIC8gMik7XG4gICAgICAgICAgICBncmFwaGljcy5wb3NpdGlvbi54ID0gc2l6ZSAvIDI7XG4gICAgICAgICAgICBncmFwaGljcy5wb3NpdGlvbi55ID0gc2l6ZSAvIDI7XG4gICAgICAgICAgICAvLyBUaGUgb25seSBjb250cm9sIGFueW9uZSBoYXMgb3ZlciB0aGUgYXJyb3dzIGZyb20gdGhlIG1vZGVsIGlzXG4gICAgICAgICAgICAvLyB0aGVpciByb3RhdGlvbiBhbW91bnQsIHNvIHdlIGFsbG93IHVwZGF0aW5nIHRoYXQgcGFydC5cbiAgICAgICAgICAgIHVwZGF0ZSA9IChuZXdTcXVhcmU6IEFycm93U3F1YXJlVHlwZSkgPT4gKFxuICAgICAgICAgICAgICAgIGdyYXBoaWNzLnJvdGF0aW9uID0gTWF0aC5QSSAvIDIgKiBuZXdTcXVhcmUuYW5nbGUpO1xuICAgICAgICAgICAgLy8gRG8gdGhlIGluaXRpYWwgcm90YXRpb24gYXNzaWdubWVudCB0byBtYXRjaCBjdXJyZW50IHNxdWFyZSBkYXRhLlxuICAgICAgICAgICAgdXBkYXRlKHNxdWFyZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgIHVwZGF0ZTogdXBkYXRlIHx8ICgoKSA9PiBudWxsKSxcbiAgICAgICAgfTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBQSVhJUmVjdCB9IGZyb20gXCIuLi9yZW5kZXJhYmxlL3NoYXBlcy9waXhpLXJlY3RcIjtcbmltcG9ydCB7IEJvYXJkIH0gZnJvbSBcIi4vYm9hcmRcIjtcblxuaW1wb3J0IHsgQ29vcmRVdGlscyB9IGZyb20gXCIuLi91dGlsL2Nvb3JkLXV0aWxzXCI7XG5cbi8qKlxuICogQSByZW5kZXJhYmxlIHRoYXQgY2FuIGJlIHVwZGF0ZWQgZnJvbSBhIG1vZGVsIG9mIHR5cGUgVC5cbiAqL1xuZXhwb3J0IHR5cGUgVXBkYXRhYmxlUmVuZGVyYWJsZTxUPiA9IHtcbiAgICBjb250YWluZXI6IFBJWEkuQ29udGFpbmVyLFxuICAgIHVwZGF0ZTogKFQpID0+IHZvaWQsXG59O1xuXG4vKipcbiAqIEFuIGFic3RyYWN0IGNsYXNzIHRoYXQgbW9zdGx5IGtub3dzIGhvdyB0byByZW5kZXIgYEJvYXJkYHMuIEl0J3MgZXhwZWN0ZWRcbiAqIHRoYXQgYSBzdWJjbGFzcyB3aWxsIG92ZXJyaWRlIGByZW5kZXJTcXVhcmVgIHRvIGNvbXBsZXRlIHRoZSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJvYXJkUmVuZGVyZXI8VD4ge1xuICAgIHByaXZhdGUgYm9hcmQ6IEJvYXJkPFQ+O1xuICAgIHByaXZhdGUgc3F1YXJlU2l6ZTogbnVtYmVyO1xuICAgIHByaXZhdGUgY2xpY2tIYW5kbGVyczogQXJyYXk8KHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkPjtcbiAgICAvLyBJZiBhIGJvYXJkIGhhcyBiZWVuIHJlbmRlcmVkLCB0aGlzIHByb3BlcnR5IGNvbnRhaW5zIHRoZSB0b3AtbGV2ZWxcbiAgICAvLyBjb250YWluZXIgb2YgdGhhdCByZW5kZXJpbmcuXG4gICAgcHJpdmF0ZSByZW5kZXJlZDogUElYSS5Db250YWluZXI7XG4gICAgLy8gQW4gYXJyYXkgb2YgcmVuZGVyZWQgY2hpbGRyZW4sIHdoaWNoIGNhbiBiZSB1cGRhdGVkIG9uIGRlbWFuZC5cbiAgICBwcml2YXRlIHJlbmRlcmVkQ2hpbGRyZW46IEFycmF5PFVwZGF0YWJsZVJlbmRlcmFibGU8VD4+O1xuXG4gICAgY29uc3RydWN0b3IoYm9hcmQ6IEJvYXJkPFQ+KSB7XG4gICAgICAgIHRoaXMuYm9hcmQgPSBib2FyZDtcbiAgICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gW107XG4gICAgICAgIHRoaXMuY2xpY2tIYW5kbGVycyA9IFtdO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIHRoZSBzaXplIG9mIGEgc2luZ2xlIHNxdWFyZS4gKi9cbiAgICBwdWJsaWMgZ2V0U3F1YXJlU2l6ZSgpIHsgcmV0dXJuIHRoaXMuc3F1YXJlU2l6ZTsgfVxuXG4gICAgLyoqIFJlZ2lzdGVycyBhIGNsaWNrIGV2ZW50LiAqL1xuICAgIHB1YmxpYyBvbkNsaWNrKGhhbmRsZXI6ICh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLmNsaWNrSGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSByZW5kZXJlZCBncmFwaGljIG9mIGEgc2luZ2xlIHNxdWFyZSBhbmQgcmV0dXJucyB0aGUgdG9wLWxldmVsXG4gICAgICogY29udGFpbmVyLlxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGUoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBQSVhJLkNvbnRhaW5lciB7XG4gICAgICAgIGxldCBzcXVhcmVTaXplID0gdGhpcy5zcXVhcmVTaXplO1xuICAgICAgICBsZXQgaW5kZXggPSBDb29yZFV0aWxzLmNvb3JkVG9JbmRleChcbiAgICAgICAgICAgIHgsIHksIHRoaXMuYm9hcmQuZ2V0V2lkdGgoKSwgdGhpcy5ib2FyZC5nZXRIZWlnaHQoKSk7XG5cbiAgICAgICAgbGV0IGNhY2hlZCA9IHRoaXMucmVuZGVyZWRDaGlsZHJlbltpbmRleF07XG4gICAgICAgIGlmIChjYWNoZWQgPT0gbnVsbCB8fCBjYWNoZWQuY29udGFpbmVyID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgZXhpc3RzIGluIHRoZSBjYWNoZSwgc28gd2UgaGF2ZSB0byByZW5kZXIgaXQgbm93LlxuICAgICAgICAgICAgbGV0IHNxdWFyZUNvbnRhaW5lciA9IG5ldyBQSVhJLkNvbnRhaW5lcigpO1xuICAgICAgICAgICAgLy8gUmVuZGVyIGEgYmxhY2sgb3Igd2hpdGUgc3F1YXJlLlxuICAgICAgICAgICAgbGV0IHNxdWFyZVJlY3QgPSBuZXcgUElYSVJlY3Qoc3F1YXJlU2l6ZSwgc3F1YXJlU2l6ZSwge1xuICAgICAgICAgICAgICAgIGNvcm5lclJhZGl1czogMCxcbiAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IHggJSAyID09PSB5ICUgMiA/IDB4MDAwMDAwIDogMHhmZmZmZmZ9KTtcbiAgICAgICAgICAgIHNxdWFyZUNvbnRhaW5lci5hZGRDaGlsZChzcXVhcmVSZWN0KTtcblxuICAgICAgICAgICAgLy8gUmVuZGVyIHRoZSBhY3R1YWwgc3F1YXJlIGdyYXBoaWMuXG4gICAgICAgICAgICBsZXQgdXBkYXRlID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZW5kZXJlZFNxdWFyZSA9IHRoaXMucmVuZGVyU3F1YXJlKFxuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmQuZ2V0KHgsIHkpLCBzcXVhcmVTaXplKTtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlZFNxdWFyZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgc29tZXRoaW5nIHdhcyByZW5kZXJlZCwgbWFwIHRoZSB1cGRhdGUgbWV0aG9kIGFuZCBhZGQgdGhlXG4gICAgICAgICAgICAgICAgLy8gY29udGFpbmVyIHRvIG91ciBzcXVhcmUncyBjb250YWluZXIuXG4gICAgICAgICAgICAgICAgc3F1YXJlQ29udGFpbmVyLmFkZENoaWxkKHJlbmRlcmVkU3F1YXJlLmNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgdXBkYXRlID0gcmVuZGVyZWRTcXVhcmUudXBkYXRlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBub3RoaW5nIHdhcyByZW5kZXJlZCwgd2UgbmVlZCB0byBlbnN1cmUgdGhhdCB0aGUgdXBkYXRlXG4gICAgICAgICAgICAgICAgLy8gbWV0aG9kIGlzIG5vdCBudWxsLlxuICAgICAgICAgICAgICAgIHVwZGF0ZSA9ICgpID0+IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSZWdpc3RlciBmb3IgY2xpY2sgZXZlbnRzLlxuICAgICAgICAgICAgc3F1YXJlQ29udGFpbmVyLmludGVyYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIHNxdWFyZUNvbnRhaW5lci5vbihcInBvaW50ZXJkb3duXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBoYW5kbGVyIG9mIHRoaXMuY2xpY2tIYW5kbGVycykge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyKHgsIHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2FjaGVkID0ge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogc3F1YXJlQ29udGFpbmVyLFxuICAgICAgICAgICAgICAgIHVwZGF0ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJZiByZW5kZXJlZCBzcXVhcmUgYWxyZWFkeSBleGlzdHMsIHVwZGF0ZSBpdC5cbiAgICAgICAgICAgIGNhY2hlZC51cGRhdGUodGhpcy5ib2FyZC5nZXQoeCwgeSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVuZGVyZWRDaGlsZHJlbltpbmRleF0gPSBjYWNoZWQ7XG4gICAgICAgIHJldHVybiBjYWNoZWQuY29udGFpbmVyO1xuICAgIH1cblxuICAgIC8qKiBVcGRhdGVzIGFsbCB0aGUgc3F1YXJlcyBvbiB0aGUgYm9hcmQuICovXG4gICAgcHVibGljIHVwZGF0ZUFsbCgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gdGhpcy5yZW5kZXJlZENoaWxkcmVuIHx8IFtdO1xuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMuYm9hcmQuZ2V0SGVpZ2h0KCk7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLmJvYXJkLmdldFdpZHRoKCk7IHgrKykge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYXJzIGFsbCByZW5kZXIgY2FjaGUsIGNhdXNpbmcgdGhlIG5leHQgcmVuZGVyIGNhbGwgdG8gcmV0dXJuIGEgZnJlc2hcbiAgICAgKiBuZXcgY29udGFpbmVyLlxuICAgICAqL1xuICAgIHB1YmxpYyBjbGVhclJlbmRlcmVkKCkge1xuICAgICAgICB0aGlzLnJlbmRlcmVkID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gW107XG4gICAgICAgIHRoaXMuc3F1YXJlU2l6ZSA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVycyB0aGUgYm9hcmQgaW50byBhIHZpZXcgb2YgdGhlIGdpdmVuIHNpemUuXG4gICAgICovXG4gICAgcHVibGljIHJlbmRlcih2aWV3V2lkdGg6IG51bWJlciwgdmlld0hlaWdodDogbnVtYmVyKTogUElYSS5Db250YWluZXIge1xuICAgICAgICBpZiAodGhpcy5yZW5kZXJlZCA9PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgYm9hcmQgPSB0aGlzLmJvYXJkO1xuICAgICAgICAgICAgbGV0IGNvbnRhaW5lciA9IG5ldyBQSVhJLkNvbnRhaW5lcigpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlZCA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgIGxldCBib2FyZFdpZHRoID0gYm9hcmQuZ2V0V2lkdGgoKTtcbiAgICAgICAgICAgIGxldCBib2FyZEhlaWdodCA9IGJvYXJkLmdldEhlaWdodCgpO1xuICAgICAgICAgICAgbGV0IHNxdWFyZVNpemUgPSBNYXRoLmZsb29yKE1hdGgubWluKHZpZXdXaWR0aCAvIGJvYXJkV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld0hlaWdodCAvIGJvYXJkSGVpZ2h0KSk7XG4gICAgICAgICAgICB0aGlzLnNxdWFyZVNpemUgPSBzcXVhcmVTaXplO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGJvYXJkSGVpZ2h0OyB5KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGJvYXJkV2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgc3F1YXJlQ29udGFpbmVyID0gdGhpcy51cGRhdGUoeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzY3JlZW5YID0geCAqIHNxdWFyZVNpemU7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzY3JlZW5ZID0geSAqIHNxdWFyZVNpemU7XG4gICAgICAgICAgICAgICAgICAgIHNxdWFyZUNvbnRhaW5lci5wb3NpdGlvbi54ID0gc2NyZWVuWDtcbiAgICAgICAgICAgICAgICAgICAgc3F1YXJlQ29udGFpbmVyLnBvc2l0aW9uLnkgPSBzY3JlZW5ZO1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYWRkQ2hpbGQoc3F1YXJlQ29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIGEgZ2l2ZW4gc3F1YXJlIGFuZCByZXR1cm5zIGFuIFVwZGF0YWJsZVJlbmRlcmVyLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhYnN0cmFjdCByZW5kZXJTcXVhcmUoc3F1YXJlOiBULCBzcXVhcmVTaXplOiBudW1iZXIpOlxuICAgICAgICBVcGRhdGFibGVSZW5kZXJhYmxlPFQ+O1xufTtcbiIsImltcG9ydCB7IENvb3JkVXRpbHMgfSBmcm9tIFwiLi4vdXRpbC9jb29yZC11dGlsc1wiO1xuXG5leHBvcnQgdHlwZSBCb2FyZFNxdWFyZUluaXRpYWxpemVyPFQ+ID0gKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiBUO1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgcmVwcmVzZW50cyBhIGJvYXJkIG9mIGB3aWR0aGB4YGhlaWdodGAgZGltZW5zaW9ucy4gVGhlIHR5cGUgb2ZcbiAqIHRoaW5ncyBjb250YWluZWQgb24gdGhlIGJvYXJkIGlzIG9mIHRoZSBwYXJhbWV0ZXIgYFRgLlxuICovXG5leHBvcnQgY2xhc3MgQm9hcmQ8VD4ge1xuICAgIHByaXZhdGUgd2lkdGg6IG51bWJlcjtcbiAgICBwcml2YXRlIGhlaWdodDogbnVtYmVyO1xuICAgIHByaXZhdGUgYm9hcmQ6IFRbXTtcblxuICAgIGNvbnN0cnVjdG9yKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLFxuICAgICAgICAgICAgICAgIGluaXRpYWxpemVyOiBCb2FyZFNxdWFyZUluaXRpYWxpemVyPFQ+ID0gbnVsbCkge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmJvYXJkID0gdGhpcy5pbml0aWFsaXplQm9hcmRBcnJheSh3aWR0aCwgaGVpZ2h0LCBpbml0aWFsaXplcik7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgdGhlIHdpZHRoIG9mIHRoZSBib2FyZC4gKi9cbiAgICBwdWJsaWMgZ2V0V2lkdGgoKSAgeyByZXR1cm4gdGhpcy53aWR0aDsgfVxuICAgIC8qKiBSZXR1cm5zIHRoZSBoZWlnaHQgb2YgdGhlIGJvYXJkLiAqL1xuICAgIHB1YmxpYyBnZXRIZWlnaHQoKSB7IHJldHVybiB0aGlzLmhlaWdodDsgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgb3ZlciBhbGwgY29vcmRpbmF0ZXMsIGNhbGxzIHRoZSBnaXZlbiBmdW5jdGlvbiwgYW5kIHVwZGF0ZXMgdGhlXG4gICAgICogYm9hcmQgd2l0aCB0aGUgcmVzdWx0LlxuICAgICAqIFRPRE86IENvdWxkIGJlIGV4dGVuZGVkIHRvIG9wdGlvbmFsbHkgcmV0dXJuIGEgbmV3IGJvYXJkLlxuICAgICAqL1xuICAgIHB1YmxpYyBtYXAoZjogKHZhbHVlOiBULCB4OiBudW1iZXIsIHk6IG51bWJlcikgPT4gVCk6IEJvYXJkPFQ+IHtcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0aGlzLmhlaWdodDsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGxldCBvbGRWYWx1ZTogVCA9IHRoaXMuZ2V0KHgsIHkpO1xuICAgICAgICAgICAgICAgIGxldCBuZXdWYWx1ZTogVCA9IGYob2xkVmFsdWUsIHgsIHkpO1xuICAgICAgICAgICAgICAgIHRoaXMucHV0KG5ld1ZhbHVlLCB4LCB5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogUHV0cyBhIHZhbHVlIGludG8gdGhlIHNxdWFyZSBhdCB0aGUgZ2l2ZW4gY29vcmRpbmF0ZS4gKi9cbiAgICBwdWJsaWMgcHV0KHZhbHVlOiBULCB4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICBsZXQgaW5kZXggPSBDb29yZFV0aWxzLmNvb3JkVG9JbmRleCh4LCB5LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYm9hcmRbaW5kZXhdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIHNxdWFyZSBhdCB0aGUgZ2l2ZW4gY29vcmRpbmF0ZS4gKi9cbiAgICBwdWJsaWMgZ2V0KHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIGxldCBpbmRleCA9IENvb3JkVXRpbHMuY29vcmRUb0luZGV4KFxuICAgICAgICAgICAgeCwgeSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIGZhbHNlKTtcbiAgICAgICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmJvYXJkW2luZGV4XTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyBhbiBhcnJheSB0aGF0IGNhbiBpbnRlcm5hbGx5IGJlIHVzZWQgZm9yIGEgYm9hcmQuIE9wdGlvbmFsbHlcbiAgICAgKiB0YWtlcyBhbiBpbml0aWFsaXplci4gSWYgb25lIGlzIG5vdCBzcGVjaWZpZWQsIGFsbCBzcXVhcmVzIGFyZVxuICAgICAqIGluaXRpYWxpemVkIHRvIG51bGwuXG4gICAgICovXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplQm9hcmRBcnJheShcbiAgICAgICAgICAgIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLFxuICAgICAgICAgICAgaW5pdGlhbGl6ZXI6IEJvYXJkU3F1YXJlSW5pdGlhbGl6ZXI8VD4gPSBudWxsKSB7XG4gICAgICAgIGxldCBib2FyZEFycmF5OiBUW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgYm9hcmRBcnJheS5wdXNoKGluaXRpYWxpemVyICE9IG51bGwgPyBpbml0aWFsaXplcih4LCB5KSA6IG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBib2FyZEFycmF5O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEFycm93U3F1YXJlVHlwZSB9IGZyb20gXCIuLi9hcnJvd3MvYXJyb3dzXCI7XG5pbXBvcnQgeyBCb2FyZCB9IGZyb20gXCIuLi9ib2FyZC9ib2FyZFwiO1xuaW1wb3J0IHsgQ2hlY2tlciB9IGZyb20gXCIuL2NoZWNrZXJcIjtcblxuaW1wb3J0IHsgQXVkaW8sIFNvdW5kcyB9IGZyb20gXCIuLi91dGlsL2F1ZGlvXCI7XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IGNvbnRyb2xzIHRoZSBtb3ZlbWVudCBvZiB0aGUgYENoZWNrZXJgLiBFc3NlbnRpYWxseSwgdGhpcyBpcyB0aGVcbiAqIGNsYXNzIHRoYXQgaW1wbGVtZW50IHRoZSBsb2dpYyBvZiB0aGUgY3ljbGUtZGV0ZWN0aW5nIGFsZ29yaXRobS5cbiAqL1xuZXhwb3J0IGNsYXNzIENoZWNrZXJDb250cm9sbGVyIHtcbiAgICBwcml2YXRlIGJvYXJkOiBCb2FyZDxBcnJvd1NxdWFyZVR5cGU+O1xuICAgIHByaXZhdGUgY2hlY2tlcjogQ2hlY2tlcjtcblxuICAgIC8vIEFsZ29yaXRobSBwcm9wZXJ0aWVzXG4gICAgLy8gV2hldGhlciB3ZSBzaG91bGQgcnVuIHRoZSBjb25zdGFudCBtZW1vcnkgYWxnb3JpdGhtLlxuICAgIHByaXZhdGUgY29uc3RhbnRNZW1vcnk6IGJvb2xlYW47XG4gICAgLy8gV2hldGhlciB3ZSBoYXZlIGRldGVjdGVkIGEgY3ljbGUuXG4gICAgcHJpdmF0ZSBkZXRlY3RlZEN5Y2xlOiBib29sZWFuO1xuICAgIC8vIFdoZXRoZXIgd2UgaGF2ZSBkZXRlY3RlZCB0aGF0IHdlIHdlbnQgb2ZmIGVkZ2UuXG4gICAgcHJpdmF0ZSBkZXRlY3RlZE9mZkVkZ2U6IGJvb2xlYW47XG4gICAgLy8gRm9yIHRoZSBub24tY29uc3RhbnQgbWVtb3J5IGFsZ29yaXRobSwga2VlcHMgdHJhY2sgb2Ygc3F1YXJlcyB0aGF0IHRoaXNcbiAgICAvLyBjaGVja2VyIGhhcyBiZWVuIG9uLlxuICAgIHByaXZhdGUgdmlzaXRlZDoge1trZXk6IHN0cmluZ106IGJvb2xlYW59O1xuICAgIC8vIFRoZSBcImhhcmVcIiBvZiBGbG95ZCdzIGFsZ29yaXRobS4gQSBwb2ludCB0aGF0IG1vdmVzIHR3aWNlIGFzIGZhc3QgYWNyb3NzXG4gICAgLy8gdGhlIGJvYXJkIGFzIHRoZSBjaGVja2VyICh3aGljaCBtYWtlcyB0aGUgY2hlY2tlciB0aGUgdG9ydG9pc2UpLiBJZiB0aGVcbiAgICAvLyBoYXJlIGFuZCB0dXJ0bGUgZXZlciBlbmQgdXAgb24gdGhlIHNhbWUgc3BvdCwgdGhlcmUgaXMgYSBjeWNsZS5cbiAgICBwcml2YXRlIGhhcmU6IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG5cbiAgICBjb25zdHJ1Y3Rvcihib2FyZDogQm9hcmQ8QXJyb3dTcXVhcmVUeXBlPixcbiAgICAgICAgICAgICAgICBjaGVja2VyOiBDaGVja2VyLFxuICAgICAgICAgICAgICAgIGNvbnN0YW50TWVtb3J5OiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5ib2FyZCA9IGJvYXJkO1xuICAgICAgICB0aGlzLmNoZWNrZXIgPSBjaGVja2VyO1xuICAgICAgICB0aGlzLnJlc2V0KGNvbnN0YW50TWVtb3J5KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgaXQgaGFzIGJlZW4gaWRlbnRpZmllZCB0aGF0IHRoaXMgY2hlY2tlciBpcyBpbiBhIGN5Y2xlLlxuICAgICAqL1xuICAgIHB1YmxpYyBoYXNEZXRlY3RlZEN5Y2xlKCkgeyByZXR1cm4gdGhpcy5kZXRlY3RlZEN5Y2xlOyB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIG5leHQgbW92ZSB3b3VsZCBtb3ZlIHRoZSBjaGVja2VyIG9mZiB0aGUgZWRnZSBvZiB0aGVcbiAgICAgKiBib2FyZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgaGFzRGV0ZWN0ZWRFZGdlKCkgeyByZXR1cm4gdGhpcy5kZXRlY3RlZE9mZkVkZ2U7IH1cblxuICAgIC8qKlxuICAgICAqIFJlc2V0cyB0aGUgY3ljbGUvZWRnZSB0cmFja2luZywgYXMgd2VsbCBhcyB0aGUgYWxnb3JpdGhtIHRoYXQgc2hvdWxkIGJlXG4gICAgICogdXNlZFxuICAgICAqL1xuICAgIHB1YmxpYyByZXNldChjb25zdGFudE1lbW9yeTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuY29uc3RhbnRNZW1vcnkgPSBjb25zdGFudE1lbW9yeTtcbiAgICAgICAgdGhpcy5kZXRlY3RlZEN5Y2xlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGV0ZWN0ZWRPZmZFZGdlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmlzaXRlZCA9IHt9O1xuICAgICAgICB0aGlzLmhhcmUgPSB0aGlzLmNoZWNrZXIuZ2V0UG9zaXRpb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbmltYXRlcyB0aGUgY2hlY2tlciBhbmQgc2NoZWR1bGVzIHRoZSBuZXh0IG1vdmUuXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuYW5pbWF0ZVRvd2FyZHNQb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmNoZWNrZXIuZ2V0UG9zaXRpb24oKTtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGNoZWNrZXIgaGFzIHN0b3BwZWQsIG1vdmUgaXQgdG8gdGhlIG5leHQgc3F1YXJlLlxuICAgICAgICAgICAgbGV0IHNxdWFyZURpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uT2ZCb2FyZFNxdWFyZShcbiAgICAgICAgICAgICAgICBwb3NpdGlvbi54LCBwb3NpdGlvbi55KTtcbiAgICAgICAgICAgIGlmIChzcXVhcmVEaXJlY3Rpb24gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZShzcXVhcmVEaXJlY3Rpb24uZHgsIHNxdWFyZURpcmVjdGlvbi5keSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIHBvc2l0aW9uIG9mZnNldCwgc2V0cyB1cCB0aGUgY2hlY2tlciBzbyB0aGF0IGl0IHdpbGwgYW5pbWF0ZSB0b1xuICAgICAqIHRoZSBzcXVhcmUgaW4gdGhhdCBkaXJlY3Rpb24uXG4gICAgICovXG4gICAgcHJpdmF0ZSBtb3ZlKGR4OiBudW1iZXIsIGR5OiBudW1iZXIpIHtcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5jaGVja2VyLmdldFBvc2l0aW9uKCk7XG4gICAgICAgIGxldCBueCA9IHBvc2l0aW9uLnggKyBkeDtcbiAgICAgICAgbGV0IG55ID0gcG9zaXRpb24ueSArIGR5O1xuICAgICAgICBpZiAoIXRoaXMuY29uc3RhbnRNZW1vcnkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBub24tY29uc3RhbnQgbWVtb3J5IGFsZ29yaXRobS4gS2VlcHMgYSBoYXNobWFwIG9mIHZpc2l0ZWRcbiAgICAgICAgICAgIC8vIHBvc2l0aW9ucyBhbmQgY2hlY2tzIHdoZXRoZXIgdGhlIG5leHQgcG9zaXRpb24gd2FzIHZpc2l0ZWQuXG4gICAgICAgICAgICAvLyBUaGUgbWVtb3J5IGNvbXBsZXhpdHkgaXMgTyhNKSwgd2hlcmUgTSBpcyB0aGUgd2lkdGggKiBoZWlnaHQgb2ZcbiAgICAgICAgICAgIC8vIHRoZSBib2FyZC5cbiAgICAgICAgICAgIC8vIFRoZXJlIGV4aXN0cyBhbm90aGVyIGFsZ29yaXRobSwgd2hlcmUgb25lIHdvdWxkIGtlZXAgYSBsaXN0IG9mXG4gICAgICAgICAgICAvLyBhbGwgdmlzaXRlZCBsb2NhdGlvbnMgYW5kIGNvbXBhcmUgYWdhaW5zdCB0aGF0LiBUaGUgbWVtb3J5XG4gICAgICAgICAgICAvLyBjb21wbGV4aXR5IG9mIHRoYXQgYWxnb3JpdGhtIHdvdWxkIGJlIE8oTikgd2hlcmUgTiB3b3VsZCBiZSB0aGVcbiAgICAgICAgICAgIC8vIG51bWJlciBvZiBtb3ZlcyBtYWRlLlxuICAgICAgICAgICAgbGV0IHBvc2l0aW9uS2V5ID0gbnggKyBcIi9cIiArIG55O1xuICAgICAgICAgICAgaWYgKHRoaXMudmlzaXRlZFtwb3NpdGlvbktleV0gJiZcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLnZpc2l0ZWQpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRldGVjdGVkQ3ljbGUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy52aXNpdGVkW3Bvc2l0aW9uS2V5XSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBIFwiY29uc3RhbnQgbWVtb3J5XCIgYWxnb3JpdGhtLiBJZiB3ZSd2ZSBtYWRlIG1vcmUgbW92ZXMgdGhhblxuICAgICAgICAgICAgLy8gdGhlcmUgYXJlIHNxdWFyZXMgb24gdGhlIGJvYXJkIGFuZCBoYXZlIG5vdCBlbmNvdW50ZXJlZCBhbiBlZGdlLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGVyZSBpcyBhIGN5Y2xlLiBUaGUgb2J2aW91cyB0cmFkZS1vZmYgaGVyZSBpcyB0aGF0IHdlXG4gICAgICAgICAgICAvLyBkb24ndCBmaW5kIG91dCBhYm91dCB0aGUgY3ljbGUgdW50aWwgbXVjaCBsYXRlciB0aGFuIG90aGVyd2lzZS5cbiAgICAgICAgICAgIC8vIGxldCBib2FyZCA9IHRoaXMuY2hlY2tlci5nZXRCb2FyZCgpO1xuICAgICAgICAgICAgLy8gaWYgKCF0aGlzLmRldGVjdGVkT2ZmRWRnZSAmJlxuICAgICAgICAgICAgLy8gICAgICAgICB0aGlzLm1vdmVzTWFkZSA+IGJvYXJkLmdldFdpZHRoKCkgKiBib2FyZC5nZXRIZWlnaHQoKSkge1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZGV0ZWN0ZWRDeWNsZSA9IHRydWU7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8vIEZseW5uJ3MgdHVydGxlL2hhcmUgYWxnb3JpdGhtLlxuICAgICAgICAgICAgLy8gRm9yIGV2ZXJ5IG9uZSB0dXJ0bGUgbW92ZSwgd2UgbWFrZSB0d28gaGFyZSBtb3Zlcy5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGhhcmVTcXVhcmVEaXJlY3Rpb24gPSB0aGlzLmdldERpcmVjdGlvbk9mQm9hcmRTcXVhcmUoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFyZS54LCB0aGlzLmhhcmUueSk7XG4gICAgICAgICAgICAgICAgaWYgKGhhcmVTcXVhcmVEaXJlY3Rpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGVjdGVkT2ZmRWRnZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFyZS54ICs9IGhhcmVTcXVhcmVEaXJlY3Rpb24uZHg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFyZS55ICs9IGhhcmVTcXVhcmVEaXJlY3Rpb24uZHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhcmUueCA9PT0gcG9zaXRpb24ueCAmJiB0aGlzLmhhcmUueSA9PT0gcG9zaXRpb24ueSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGVjdGVkQ3ljbGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ib2FyZC5nZXQobngsIG55KSAhPSBudWxsKSB7XG4gICAgICAgICAgICBBdWRpby5wbGF5KFNvdW5kcy5QTE9QKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlci5zZXRQb3NpdGlvbihueCwgbnkpO1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyLnNldE9mZnNldCgtZHgsIC1keSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRldGVjdGVkT2ZmRWRnZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb2RpZmllcyB0aGUgb2Zmc2V0IHN1Y2ggdGhhdCBpdCBhcHByb2FjaGVzIDAsIHdoaWNoIG1ha2VzIGl0IGFwcGVhciBsaWtlXG4gICAgICogdGhlIGBDaGVja2VyYCBpcyBtb3ZpbmcgdG93YXJkcyBpdHMgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIHRydWUgd2hlbiB0aGUgY2hlY2tlciBoYXMgc3RvcHBlZCBtb3ZpbmcuXG4gICAgICovXG4gICAgcHJpdmF0ZSBhbmltYXRlVG93YXJkc1Bvc2l0aW9uKCk6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgZnJpY3Rpb24gPSAwLjk7XG4gICAgICAgIGxldCBzdG9wVGhyZXNob2xkID0gMC4wMztcbiAgICAgICAgbGV0IG9mZnNldCA9IHRoaXMuY2hlY2tlci5nZXRPZmZzZXQoKTtcbiAgICAgICAgaWYgKG9mZnNldC54ICE9PSAwKSB7XG4gICAgICAgICAgICBvZmZzZXQueCAqPSBmcmljdGlvbjtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhvZmZzZXQueCkgPCBzdG9wVGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0LnggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvZmZzZXQueSAhPT0gMCkge1xuICAgICAgICAgICAgb2Zmc2V0LnkgKj0gZnJpY3Rpb247XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMob2Zmc2V0LnkpIDwgc3RvcFRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIG9mZnNldC55ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrZXIuc2V0T2Zmc2V0KG9mZnNldC54LCBvZmZzZXQueSk7XG4gICAgICAgIHJldHVybiBvZmZzZXQueCA9PT0gMCAmJiBvZmZzZXQueSA9PT0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgZGlyZWN0aW9uIHRoYXQgdGhlIGFycm93IG9uIHRoZSBnaXZlblxuICAgICAqIHNxdWFyZSBpcyBwb2ludGluZy4gTWF5IHJldHVybiBudWxsIGlmIG5vIHNxdWFyZSBleGlzdHMgYW5kIHRoZSBnaXZlblxuICAgICAqIGNvb3JkaW5hdGUuXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXREaXJlY3Rpb25PZkJvYXJkU3F1YXJlKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIGxldCBzcXVhcmU6IEFycm93U3F1YXJlVHlwZSA9IHRoaXMuYm9hcmQuZ2V0KHgsIHkpO1xuICAgICAgICBpZiAoc3F1YXJlICE9IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBhbmdsZSA9IE1hdGgucm91bmQoc3F1YXJlLmFuZ2xlKSAlIDQ7XG4gICAgICAgICAgICBpZiAoYW5nbGUgPCAwKSB7XG4gICAgICAgICAgICAgICAgYW5nbGUgKz0gNDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBtb3ZlbWVudHMgPSBbe2R4OiAxLCBkeTogMH0sIHtkeDogMCwgZHk6IDF9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZHg6IC0xLCBkeTogMH0sIHtkeDogMCwgZHk6IC0xfV07XG4gICAgICAgICAgICByZXR1cm4gbW92ZW1lbnRzW2FuZ2xlXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDaGVja2VyIH0gZnJvbSBcIi4vY2hlY2tlclwiO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCBpcyBjYXBhYmxlIG9mIHJlbmRlcmluZyBhIGNoZWNrZXIgb24gaXRzIGJvYXJkLiBJdCBpcyBleHBlY3RlZFxuICogdGhhdCB0aGUgc3F1YXJlU2l6ZSBpcyBwYXNzZWQgdG8gdGhlIHJlbmRlciBmdW5jdGlvbi5cbiAqIFRvIGNoYW5nZSB0aGUgc3F1YXJlIHNpemUgYWZ0ZXIgdGhlIGZhY3QsIGBzZXRTcXVhcmVTaXplYCBtYXkgYmUgdXNlZCwgYW5kXG4gKiB0aGUgcG9zaXRpb24gYW5kIHNpemUgb2YgdGhlIGNoZWNrZXIgd2lsbCBiZSBpbW1lZGlhdGVseSB1cGRhdGVkLlxuICovXG5leHBvcnQgY2xhc3MgQ2hlY2tlclJlbmRlcmVyIHtcbiAgICBwcml2YXRlIGNoZWNrZXI6IENoZWNrZXI7XG5cbiAgICAvLyBSZW5kZXIgcHJvcGVydGllc1xuICAgIHByaXZhdGUgcmVuZGVyZWQ6IFBJWEkuQ29udGFpbmVyO1xuICAgIHByaXZhdGUgc3F1YXJlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoY2hlY2tlcjogQ2hlY2tlcikge1xuICAgICAgICB0aGlzLmNoZWNrZXIgPSBjaGVja2VyO1xuICAgICAgICB0aGlzLnJlbmRlcmVkID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKiogU2V0cyB0aGUgc3F1YXJlIHNpemUgb2YgdGhlIGJvYXJkIHRoaXMgY2hlY2tlciBpcyBvbi4gKi9cbiAgICBwdWJsaWMgc2V0U3F1YXJlU2l6ZShuZXdTcXVhcmVTaXplOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5zcXVhcmVTaXplID0gbmV3U3F1YXJlU2l6ZTtcbiAgICAgICAgdGhpcy5yZXJlbmRlcigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHRoaXMgcmVuZGVyZXIgaGFzIHJlbmRlcmVkIHRoZSBjaGVja2VyLCB0aGlzIHdpbGwgcmV0dXJuIHRoZSB0b3AtbGV2ZWxcbiAgICAgKiBQSVhJIGNvbnRhaW5lciB0aGF0IGhhcyBpdC4gT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiBudWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRSZW5kZXJlZCgpOiBQSVhJLkNvbnRhaW5lciB7IHJldHVybiB0aGlzLnJlbmRlcmVkOyB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZ3JhcGhpY3MgYmFzZWQgb24gdGhlIHVwZGF0ZWQgYENoZWNrZXJgXG4gICAgICogcG9zaXRpb24uXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVuZGVyZWQgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5jaGVja2VyLmdldE9mZnNldFBvc2l0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVkLnBvc2l0aW9uLnggPSB0aGlzLnNxdWFyZVNpemUgKiBwb3NpdGlvbi54O1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlZC5wb3NpdGlvbi55ID0gdGhpcy5zcXVhcmVTaXplICogcG9zaXRpb24ueTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgc3F1YXJlIHNpemUsIHJlbmRlcnMgdGhlIGNoZWNrZXIgYW5kIHJldHVybnMgYW4gZWxlbWVudCB0aGF0XG4gICAgICogY29udGFpbnMgaXQuXG4gICAgICovXG4gICAgcHVibGljIHJlbmRlcihzcXVhcmVTaXplOiBudW1iZXIpOiBQSVhJLkNvbnRhaW5lciB7XG4gICAgICAgIGlmICh0aGlzLnJlbmRlcmVkID09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuc3F1YXJlU2l6ZSA9IHNxdWFyZVNpemU7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVkID0gbmV3IFBJWEkuQ29udGFpbmVyKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVkLmFkZENoaWxkKHRoaXMuYnVpbGRHcmFwaGljcygpKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQnVpbGRzIHRoZSBwYXRoIHVzZWQgdG8gcmVwcmVzZW50IHRoZSBjaGVja2VyIGFuZCBwb3NpdGlvbnMgaXQgaW4gdGhlXG4gICAgICogbWlkZGxlIG9mIGl0cyBjb250YWluZXIsIHdoaWNoIHNob3VsZCBiZSBvZiBzaXplIGBzcXVhcmVTaXplYC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGJ1aWxkR3JhcGhpY3MoKSB7XG4gICAgICAgIGxldCBoYWxmU3F1YXJlU2l6ZSA9IHRoaXMuc3F1YXJlU2l6ZSAvIDI7XG4gICAgICAgIGxldCByYWRpdXMgPSBoYWxmU3F1YXJlU2l6ZSAqIDAuNjtcblxuICAgICAgICBsZXQgY29sb3JzID0gWzB4REExNDM0LCAweEZCNDQzNF07XG4gICAgICAgIGxldCBnID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcbiAgICAgICAgZy5iZWdpbkZpbGwoY29sb3JzWzBdKTtcbiAgICAgICAgZy5kcmF3Q2lyY2xlKGhhbGZTcXVhcmVTaXplLCBoYWxmU3F1YXJlU2l6ZSwgcmFkaXVzKTtcblxuICAgICAgICBsZXQgaW5uZXJSaW5nID0gMC4yO1xuICAgICAgICBsZXQgcmluZ3MgPSBNYXRoLmZsb29yKGhhbGZTcXVhcmVTaXplIC8gNSk7XG4gICAgICAgIGZvciAobGV0IHJpbmcgPSAxOyByaW5nIDwgcmluZ3M7IHJpbmcrKykge1xuICAgICAgICAgICAgZy5iZWdpbkZpbGwoY29sb3JzW3JpbmcgJSBjb2xvcnMubGVuZ3RoXSk7XG4gICAgICAgICAgICBnLmRyYXdDaXJjbGUoaGFsZlNxdWFyZVNpemUsIGhhbGZTcXVhcmVTaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgIChyYWRpdXMgLSBpbm5lclJpbmcpICogKHJpbmdzIC0gcmluZykgLyByaW5ncyArIGlubmVyUmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYXJzIGV2ZXJ5dGhpbmcgZnJvbSB0aGUgcmVuZGVyZWQgY29udGFpbmVyLCBhbmQgcmVyZW5kZXJzIHRoZVxuICAgICAqIGdyYXBoaWNzLlxuICAgICAqL1xuICAgIHByaXZhdGUgcmVyZW5kZXIoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZWQucmVtb3ZlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlZC5hZGRDaGlsZCh0aGlzLmJ1aWxkR3JhcGhpY3MoKSk7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBjaGVja2VyIGF0IHNvbWUgcG9zaXRpb24gb24gdGhlIGJvYXJkLiBgeGAgYW5kIGB5YCBzaG91bGQgYmVcbiAqIGludGVnZXJzIHRoYXQgdG9nZXRoZXIgZm9ybSB0aGUgY29vcmRpbmF0ZSBvZiB0aGUgc3F1YXJlIG9uIHRoZSBgQm9hcmRgLlxuICovXG5leHBvcnQgY2xhc3MgQ2hlY2tlciB7XG4gICAgLy8gVGhlIGB4YCBhbmQgYHlgIGNvbXBvbmVudHMgb2YgdGhlIGNvb3JkaW5hdGUgb2YgdGhlIGxvY2F0aW9uIG9mIHRoaXNcbiAgICAvLyBgQ2hlY2tlcmAgb24gYSBgQm9hcmRgLlxuICAgIHByaXZhdGUgeDogbnVtYmVyO1xuICAgIHByaXZhdGUgeTogbnVtYmVyO1xuICAgIC8vIEEgZmxvYXRpbmcgcG9pbnQgb2Zmc2V0IHRoYXQgaXMgdXNlZCB0byBhbmltYXRlIHRoZSBjaGVja2VyIHRvIGl0cyBuZXdcbiAgICAvLyBwb3NpdGlvbi4gQm90aCBgeGAgYW5kIGB5YCBzaG91bGQgYmUgYmV0d2VlbiAtMSBhbmQgMS5cbiAgICBwcml2YXRlIG9mZnNldDoge3g6IG51bWJlciwgeTogbnVtYmVyfTtcblxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMueCA9IHggfCAwO1xuICAgICAgICB0aGlzLnkgPSB5IHwgMDtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7eDogMCwgeTogMH07XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgdGhlIHBvc2l0aW9uIG9mIHRoaXMgY2hlY2tlci4gKi9cbiAgICBwdWJsaWMgZ2V0UG9zaXRpb24oKSB7IHJldHVybiB7eDogdGhpcy54LCB5OiB0aGlzLnl9OyB9XG5cbiAgICAvKiogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhpcyBgQ2hlY2tlcmAgb24gYSBgQm9hcmRgLiAqL1xuICAgIHB1YmxpYyBzZXRQb3NpdGlvbih4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICB0aGlzLnggPSB4IHwgMDtcbiAgICAgICAgdGhpcy55ID0geSB8IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIHRoZSBmbG9hdGluZyBwb2ludCBvZmZzZXQgb2YgdGhpcyBgQ2hlY2tlcmAuICovXG4gICAgcHVibGljIGdldE9mZnNldCgpOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9IHtcbiAgICAgICAgcmV0dXJuIHt4OiB0aGlzLm9mZnNldC54LCB5OiB0aGlzLm9mZnNldC55fTtcbiAgICB9XG5cbiAgICAvKiogU2V0cyB0aGUgZmxvYXRpbmcgcG9pbnQgb2Zmc2V0IG9mIHRoaXMgYENoZWNrZXJgLiAqL1xuICAgIHB1YmxpYyBzZXRPZmZzZXQoZHg6IG51bWJlciwgZHk6IG51bWJlcikge1xuICAgICAgICB0aGlzLm9mZnNldC54ID0gZHg7XG4gICAgICAgIHRoaXMub2Zmc2V0LnkgPSBkeTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgdGhlIHN1bSBvZiB0aGUgcG9zaXRpb24gYW5kIHRoZSBvZmZzZXQuICovXG4gICAgcHVibGljIGdldE9mZnNldFBvc2l0aW9uKCk6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0ge1xuICAgICAgICByZXR1cm4ge3g6IHRoaXMueCArIHRoaXMub2Zmc2V0LngsXG4gICAgICAgICAgICAgICAgeTogdGhpcy55ICsgdGhpcy5vZmZzZXQueX07XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiIC8+XG5cbmltcG9ydCB7IFdvcmxkIH0gZnJvbSBcIi4vd29ybGRcIjtcblxuLy8gQ3JlYXRlIHRoZSB3b3JsZFxubGV0IHdvcmxkID0gbmV3IFdvcmxkKCk7XG5cbmZ1bmN0aW9uIHN0YXJ0TG9vcChmKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHN0YXJ0TG9vcChmKSk7XG4gICAgZigpO1xufTtcblxuc3RhcnRMb29wKCgpID0+IHtcbiAgICB3b3JsZC51cGRhdGUoKTtcbiAgICB3b3JsZC5yZW5kZXIoKTtcbn0pO1xuIiwiLyoqXG4gKiBUaGUgcmVuZGVyaW5nIHBhcmFtZXRlcnMgb2YgYSBQSVhJUmVjdC5cbiAqL1xudHlwZSBQSVhJUmVjdFJlbmRlcmluZ1BhcmFtZXRlcnMgPSB7XG4gICAgLy8gVGhlIHdpZHRoIGFuZCBoZWlnaHQgb2YgdGhlIHJlY3RhbmdsZS5cbiAgICB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcixcbiAgICAvLyBUaGUgcmFkaXVzIG9mIHRoZSBjb3JuZXJzLCBvciAwLlxuICAgIGNvcm5lclJhZGl1czogbnVtYmVyLFxuICAgIC8vIFRoZSBmaWxsIGNvbG9yIGFzIGEgbnVtYmVyLiBpLmUuIDB4RkYwMDAwIGZvciByZWQuXG4gICAgZmlsbENvbG9yOiBudW1iZXIsXG4gICAgLy8gVGhlIHN0cm9rZSBjb2xvciBhcyBhIG51bWJlci5cbiAgICBzdHJva2VDb2xvcjogbnVtYmVyLFxuICAgIC8vIFRoZSBsaW5lIHdpZHRoIG9mIHRoZSBvdXRsaW5lLCBvciAwLlxuICAgIGxpbmVXaWR0aDogbnVtYmVyLFxufTtcblxuLyoqXG4gKiBBIGJhc2ljIHJlY3RhbmdsZSB0aGF0IGlzIHJlbmRlcmFibGUgdG8gUElYSSAoYXMgb3Bwb3NlZCB0byBhXG4gKiBQSVhJLlJlY3RhbmdsZSksIG9wdGlvbmFsbHkgd2l0aCByb3VuZGVkIGNvcm5lcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJUmVjdCBleHRlbmRzIFBJWEkuR3JhcGhpY3Mge1xuICAgIHByaXZhdGUgb3B0aW9uczogUElYSVJlY3RSZW5kZXJpbmdQYXJhbWV0ZXJzO1xuXG4gICAgY29uc3RydWN0b3Iod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge2Nvcm5lclJhZGl1cz86IG51bWJlciwgZmlsbENvbG9yPzogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg/OiBudW1iZXIsIHN0cm9rZUNvbG9yPzogbnVtYmVyfSA9IG51bGwpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgICAgICAgY29ybmVyUmFkaXVzOiBvcHRpb25zICYmIChcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNvcm5lclJhZGl1cyA9PSBudWxsID8gNSA6IG9wdGlvbnMuY29ybmVyUmFkaXVzKSxcbiAgICAgICAgICAgIGZpbGxDb2xvcjogb3B0aW9ucyAmJiBvcHRpb25zLmZpbGxDb2xvciB8fCAwLFxuICAgICAgICAgICAgbGluZVdpZHRoOiBvcHRpb25zICYmIG9wdGlvbnMubGluZVdpZHRoIHx8IDAsXG4gICAgICAgICAgICBzdHJva2VDb2xvcjogb3B0aW9ucyAmJiBvcHRpb25zLnN0cm9rZUNvbG9yLFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBkYXRlR2VvbWV0cnkoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgbmV3IHBhcmFtZXRlcnMgZm9yIHRoZSBmaWxsIGFuZCBzdHJva2UgY29sb3JzLlxuICAgICAqL1xuICAgIHB1YmxpYyBzZXRDb2xvcnMoY29sb3JzOiB7ZmlsbD86IG51bWJlciwgc3Ryb2tlPzogbnVtYmVyfSkge1xuICAgICAgICBpZiAoY29sb3JzLmZpbGwgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmZpbGxDb2xvciA9IGNvbG9ycy5maWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xvcnMuc3Ryb2tlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5zdHJva2VDb2xvciA9IGNvbG9ycy5zdHJva2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVHZW9tZXRyeSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHBhdGggYXNzb2NpYXRlZCB3aXRoIHRoaXMgUElYSS5HcmFwaGljcyBvYmplY3QgdG8gYWNjdXJhdGVseVxuICAgICAqIHJlcHJlc2VudCB0aGUgcmVjdGFuZ2xlIGRldGFpbGVkIGJ5IHRoZSBvcHRpb25zLlxuICAgICAqL1xuICAgIHByaXZhdGUgdXBkYXRlR2VvbWV0cnkoKSB7XG4gICAgICAgIGxldCBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICBsZXQgd2lkdGggPSBvcHRpb25zLndpZHRoO1xuICAgICAgICBsZXQgaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQ7XG4gICAgICAgIGxldCByYWRpdXMgPSBvcHRpb25zLmNvcm5lclJhZGl1cztcblxuICAgICAgICAvKipcbiAgICAgICAgICogQmVsb3cgaXMgYSBkaWFncmFtIG9mIHRoZSBvcmRlciBpbiB3aGljaCB0aGUgcmVjdGFuZ2xlIGlzIHJlbmRlcmVkLlxuICAgICAgICAgKiBUaGUgbnVtYmVycyBjb2luY2lkZSB3aXRoIGNvbW1lbnRzIG9uIHRoZSBsaW5lcyBiZWxvdyB0aGF0IGFyZSB1c2VkXG4gICAgICAgICAqIHRvIGNvbnN0cnVjdCB0aGUgZ2VvbWV0cnkgZm9yIHRoZSByZWN0YW5nbGUuXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICA4LzAgLS0tLS0tLS0tLS0tLS0tIDFcbiAgICAgICAgICogICAgIC8gICAgICAgICAgICAgICAgICAgICBcXFxuICAgICAgICAgKiAgIDcgICAgICAgICAgICAgICAgICAgICAgICAgMlxuICAgICAgICAgKiAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAgICAgKiAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAgICAgKiAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAgICAgKiAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAgICAgKiAgIDYgICAgICAgICAgICAgICAgICAgICAgICAgM1xuICAgICAgICAgKiAgICAgXFwgICAgICAgICAgICAgICAgICAgICAvXG4gICAgICAgICAqICAgICAgIDUgLS0tLS0tLS0tLS0tLS0tIDRcbiAgICAgICAgICovXG5cbiAgICAgICAgLy8gTk9URTogVGhlIGFyY3MgYXJlIHNvbWV0aW1lcyBpbXByZWNpc2Ugd2hlbiByZW5kZXJlZCwgYW5kIGhhdmluZyBhXG4gICAgICAgIC8vIGxpbmVUbyBjb21tYW5kIGFmdGVyIHRoZW0gaGVscHMgbWFrZSB0aGVtIGxvb2sgYmV0dGVyLiBUaGVzZSBsaW5lVG9cbiAgICAgICAgLy8gY29tbWFuZHMgd2lsbCBiZSBudW1iZXJlZCBhcyBOLjUsIHdoZXJlIE4gaXMgdGhlIG51bWJlciBvZiB0aGUgYXJjLlxuXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5iZWdpbkZpbGwob3B0aW9ucy5maWxsQ29sb3IpO1xuICAgICAgICB0aGlzLmxpbmVTdHlsZShvcHRpb25zLmxpbmVXaWR0aCwgb3B0aW9ucy5zdHJva2VDb2xvcik7XG4gICAgICAgIHRoaXMubW92ZVRvKHJhZGl1cywgMCk7ICAgICAgICAgIC8vIDBcbiAgICAgICAgdGhpcy5saW5lVG8od2lkdGggLSByYWRpdXMsIDApOyAgLy8gMVxuICAgICAgICBpZiAocmFkaXVzID4gMCkge1xuICAgICAgICAgICAgLy8gKDIpIFRvcC1yaWdodCBjb3JuZXIuXG4gICAgICAgICAgICB0aGlzLmFyYyh3aWR0aCAtIHJhZGl1cywgcmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgcmFkaXVzLCBNYXRoLlBJIC8gMiAqIDMsIE1hdGguUEkgKiAyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVUbyh3aWR0aCwgcmFkaXVzKTsgICAgICAgICAgIC8vIDIuNVxuICAgICAgICB0aGlzLmxpbmVUbyh3aWR0aCwgaGVpZ2h0IC0gcmFkaXVzKTsgIC8vIDNcbiAgICAgICAgaWYgKHJhZGl1cyA+IDApIHtcbiAgICAgICAgICAgIC8vICg0KSBCb3R0b20tcmlnaHQgY29ybmVyLlxuICAgICAgICAgICAgdGhpcy5hcmMod2lkdGggLSByYWRpdXMsIGhlaWdodCAtIHJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgIHJhZGl1cywgMCwgTWF0aC5QSSAvIDIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGluZVRvKHdpZHRoIC0gcmFkaXVzLCBoZWlnaHQpOyAgLy8gNC41XG4gICAgICAgIHRoaXMubGluZVRvKHJhZGl1cywgaGVpZ2h0KTsgICAgICAgICAgLy8gNVxuICAgICAgICBpZiAocmFkaXVzID4gMCkge1xuICAgICAgICAgICAgLy8gKDYpIEJvdHRvbS1sZWZ0IGNvcm5lci5cbiAgICAgICAgICAgIHRoaXMuYXJjKHJhZGl1cywgaGVpZ2h0IC0gcmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgcmFkaXVzLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lVG8oMCwgaGVpZ2h0IC0gcmFkaXVzKTsgIC8vIDYuNVxuICAgICAgICB0aGlzLmxpbmVUbygwLCByYWRpdXMpOyAgICAgICAgICAgLy8gN1xuICAgICAgICBpZiAocmFkaXVzID4gMCkge1xuICAgICAgICAgICAgLy8gKDgpIFRvcC1sZWZ0IGNvcm5lci5cbiAgICAgICAgICAgIHRoaXMuYXJjKHJhZGl1cywgcmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgcmFkaXVzLCBNYXRoLlBJLCBNYXRoLlBJIC8gMiAqIDMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwibGV0IEJ1dHRvblN0YXRlID0ge1xuICAgIERPV046IFwiZG93blwiLFxuICAgIEhPVkVSOiBcImhvdmVyXCIsXG4gICAgTk9STUFMOiBcIm5vcm1hbFwiLFxufTtcblxuLyoqXG4gKiBUaGlzIGNsYXNzIGVuY2Fwc3VsYXRlcyB0aGUgbG9naWMgZm9yIHN0YXRlIHRyYW5zaXRpb25zIG9uIGEgYnV0dG9uLiBJdCBlbWl0c1xuICogZXZlbnRzIHdoZW4gYSBidXR0b24gc2hvdWxkIGNoYW5nZSB0aGUgc3RhdGUsIHdpdGggZWFjaCBkaWZmZXJlbnQgZXZlbnRcbiAqIHNpZ25pZnlpbmcgYSBkaWZmZXJlbnQgc3RhdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBCdXR0b25TdGF0ZUhhbmRsZXIge1xuICAgIC8vIFRoZSB0YXJnZXQgUElYSSBvYmplY3QgdGhhdCB3aWxsIGJlIHJlY2VpdmluZyBldmVudHMuXG4gICAgcHJpdmF0ZSB0YXJnZXQ6IFBJWEkuQ29udGFpbmVyO1xuICAgIC8vIEhhbmRsZXJzIGZvciB0aGUgZXZlbnRzIHdlIHdpbGwgYmUgZmlyaW5nLCBzbyB0aGF0IHdlIGRvbid0IGxlYWsgZXZlbnRzXG4gICAgLy8gdG8gYW55b25lIG91dHNpZGUgdGhpcyBmaWxlLlxuICAgIHByaXZhdGUgaGFuZGxlcnM6IHtba2V5OiBzdHJpbmddOiBBcnJheTwoKSA9PiB2b2lkPn07XG4gICAgcHJpdmF0ZSBtb3VzZToge2Rvd246IGJvb2xlYW4sIGluc2lkZTogYm9vbGVhbn07XG5cbiAgICBjb25zdHJ1Y3Rvcih0YXJnZXQ6IFBJWEkuQ29udGFpbmVyKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gICAgICAgIHRoaXMubW91c2UgPSB7ZG93bjogZmFsc2UsIGluc2lkZTogZmFsc2V9O1xuXG4gICAgICAgIHRoaXMudGFyZ2V0LmludGVyYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50YXJnZXQuYnV0dG9uTW9kZSA9IHRydWU7XG4gICAgICAgIHRoaXMudGFyZ2V0Lm9uKFwicG9pbnRlcmRvd25cIiwgKCkgPT4gdGhpcy5oYW5kbGVNb3VzZURvd24oKSk7XG4gICAgICAgIHRoaXMudGFyZ2V0Lm9uKFwicG9pbnRlcnVwXCIsICgpID0+IHRoaXMuaGFuZGxlTW91c2VVcCgpKTtcbiAgICAgICAgdGhpcy50YXJnZXQub24oXCJwb2ludGVydXBvdXRzaWRlXCIsICgpID0+IHRoaXMuaGFuZGxlTW91c2VVcCgpKTtcbiAgICAgICAgdGhpcy50YXJnZXQub24oXCJwb2ludGVybW92ZVwiLCAoZXZlbnQpID0+IHRoaXMuaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSk7XG4gICAgfVxuXG4gICAgLyoqIFJlZ2lzdGVycyBhIGhvdmVyIGhhbmRsZXIuICovXG4gICAgcHVibGljIHdoZW5Ib3ZlcmVkKGhhbmRsZXI6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuKEJ1dHRvblN0YXRlLkhPVkVSLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKiogUmVnaXN0ZXJzIGEgYnV0dG9uIGRvd24gaGFuZGxlci4gKi9cbiAgICBwdWJsaWMgd2hlbkRvd24oaGFuZGxlcjogKCkgPT4gdm9pZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW4oQnV0dG9uU3RhdGUuRE9XTiwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqIFJlZ2lzdGVycyBhIGJ1dHRvbiBub3JtYWwgaGFuZGxlci4gKi9cbiAgICBwdWJsaWMgd2hlbk5vcm1hbChoYW5kbGVyOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbihCdXR0b25TdGF0ZS5OT1JNQUwsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZm9yIGEgUElYSSBwb2ludGVyZG93biBldmVudC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGhhbmRsZU1vdXNlRG93bigpIHtcbiAgICAgICAgLy8gV2hlbiB3ZSBnZXQgdGhpcyBldmVudCwgdGhlIG1vdXNlIGlzIGd1YXJhbnRlZWQgdG8gYmUgaW5zaWRlIHRoZVxuICAgICAgICAvLyBidXR0b24uXG4gICAgICAgIHRoaXMubW91c2UuaW5zaWRlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5tb3VzZS5kb3duID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5maXJlKEJ1dHRvblN0YXRlLkRPV04pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZm9yIGEgUElYSSBwb2ludGVydXAgZXZlbnQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBoYW5kbGVNb3VzZVVwKCkge1xuICAgICAgICB0aGlzLmZpcmUodGhpcy5tb3VzZS5pbnNpZGUgPyBCdXR0b25TdGF0ZS5IT1ZFUiA6IEJ1dHRvblN0YXRlLk5PUk1BTCk7XG4gICAgICAgIHRoaXMubW91c2UuZG93biA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZm9yIGEgUElYSSBwb2ludGVybW92ZSBldmVudC4gVGhpcyBtZXRob2QgY29udHJvbHMgdGhlIHN0YXRlIG9mXG4gICAgICogYG1vdXNlLmluc2lkZWAsIGFuZCBwb3NzaWJseSBmaXJlcyBCdXR0b25TdGF0ZS5IT1ZFUiBhbmRcbiAgICAgKiBCdXR0b25TdGF0ZS5OT1JNQUwgZXZlbnRzIHdoZW4gdGhlIHN0YXRlIGNoYW5nZXMuXG4gICAgICovXG4gICAgcHJpdmF0ZSBoYW5kbGVNb3VzZU1vdmUoZXZlbnQ6IFBJWEkuaW50ZXJhY3Rpb24uSW50ZXJhY3Rpb25FdmVudCkge1xuICAgICAgICAvLyBJZ25vcmUgdGhlIGV2ZW50IGVudGlyZSBpZiB0aGUgbW91c2UgYnV0dG9uIGlzIG5vdCBkb3duLlxuICAgICAgICBsZXQgcG9zaXRpb24gPSBldmVudC5kYXRhLmdsb2JhbDtcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdGhlIHBvaW50ZXIgaXMgaW5zaWRlIHRoZSBib3VuZHMgb2YgdGhlIGJ1dHRvbi5cbiAgICAgICAgbGV0IGlzUG9pbnRlckluc2lkZSA9ICEoXG4gICAgICAgICAgICBwb3NpdGlvbi54IDwgdGhpcy50YXJnZXQucG9zaXRpb24ueCB8fFxuICAgICAgICAgICAgcG9zaXRpb24ueSA8IHRoaXMudGFyZ2V0LnBvc2l0aW9uLnkgfHxcbiAgICAgICAgICAgIHBvc2l0aW9uLnggPiB0aGlzLnRhcmdldC5wb3NpdGlvbi54ICsgdGhpcy50YXJnZXQud2lkdGggfHxcbiAgICAgICAgICAgIHBvc2l0aW9uLnkgPiB0aGlzLnRhcmdldC5wb3NpdGlvbi55ICsgdGhpcy50YXJnZXQuaGVpZ2h0KTtcbiAgICAgICAgaWYgKGlzUG9pbnRlckluc2lkZSAhPT0gdGhpcy5tb3VzZS5pbnNpZGUpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBcImluc2lkZVwiIHN0YXRlIGhhcyBjaGFuZ2VkLCB3ZSBuZWVkIHRvIHJhaXNlIHRoZSBjb3JyZWN0XG4gICAgICAgICAgICAvLyBldmVudHMgc28gdGhhdCB0aGUgYnV0dG9uIGFwcGVhcmFuY2UgY2FuIGNoYW5nZS5cbiAgICAgICAgICAgIHRoaXMubW91c2UuaW5zaWRlID0gaXNQb2ludGVySW5zaWRlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLm1vdXNlLmRvd24pIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNQb2ludGVySW5zaWRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlyZShCdXR0b25TdGF0ZS5IT1ZFUik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKEJ1dHRvblN0YXRlLk5PUk1BTCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIEEgcHJpdmF0ZSBmdW5jdGlvbiB0byByZWdpc3RlciBhIGxpc3RlbmVyIGZvciBhbiBhcmJpdHJhcnkgZXZlbnQuICovXG4gICAgcHJpdmF0ZSBsaXN0ZW4oZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogKCkgPT4gdm9pZCk6IEJ1dHRvblN0YXRlSGFuZGxlciB7XG4gICAgICAgIGlmICh0aGlzLmhhbmRsZXJzW2V2ZW50XSA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZXJzW2V2ZW50XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFuZGxlcnNbZXZlbnRdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBBIHByaXZhdGUgZnVuY3Rpb24gdG8gZmlyZSB0aGUgZ2l2ZW4gZXZlbnQuICovXG4gICAgcHJpdmF0ZSBmaXJlKGV2ZW50OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IGhhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1tldmVudF07XG4gICAgICAgIGlmIChoYW5kbGVycyAhPSBudWxsKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBoYW5kbGVyIG9mIGhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8gVGhpcyBmaWxlIGNvbnRhaW5zIHNvbWUgYnV0dG9uIGNvbG9ycyBhbmQgb3RoZXIgc3R5bGUgcHJvcGVydGllcyB0aGF0IGxvb2tcbi8vIGZhaXJseSBkZWNlbnQuIFRoZXNlIGJ1dHRvbiBzdHlsZXMgd2VyZSBib3Jyb3dlZCBmcm9tIHRoZSBCb290c3RyYXAgZGVmYXVsdFxuLy8gY29uZmlndXJhdGlvbi5cblxuLy8gQ29sb3JzIG9mIHRoZSBidXR0b24gYmFja2dyb3VuZHMsIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgdGhlIGJ1dHRvbi5cbmV4cG9ydCBjb25zdCBCdXR0b25Db2xvcnMgPSB7XG4gICAgREFOR0VSOiB7bm9ybWFsOiAweGQ5NTM0ZiwgaG92ZXJlZDogMHhjOTMwMmMsIGRvd246IDB4YWMyOTI1fSxcbiAgICBTVUNDRVNTOiB7bm9ybWFsOiAweDVDQjg1QywgaG92ZXJlZDogMHg0NDlENDQsIGRvd246IDB4Mzk4NDM5fSxcbiAgICBXQVJOSU5HOiB7bm9ybWFsOiAweGYwYWQ0ZSwgaG92ZXJlZDogMHhlYzk3MWYsIGRvd246IDB4ZDU4NTEyfSxcbn07XG5cbi8vIENvbG9ycyBvZiB0aGUgYnV0dG9uIGJvcmRlcnMsIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgdGhlIGJ1dHRvbi5cbmV4cG9ydCBjb25zdCBCdXR0b25Cb3JkZXJDb2xvcnMgPSB7XG4gICAgREFOR0VSOiB7bm9ybWFsOiAweGQ0M2YzYSwgaG92ZXJlZDogMHhhYzI5MjUsIGRvd246IDB4NzYxYzE5fSxcbiAgICBTVUNDRVNTOiB7bm9ybWFsOiAweDRjYWU0YywgaG92ZXJlZDogMHgzOTg0MzksIGRvd246IDB4MjU1NjI1fSxcbiAgICBXQVJOSU5HOiB7bm9ybWFsOiAweGVlYTIzNiwgaG92ZXJlZDogMHhkNTg1MTIsIGRvd246IDB4OTg1ZjBkfSxcbn07XG5cbi8vIEEgdGV4dCBzdHlsZSB0aGF0IGlzIGNvbnZlbmllbnQgdG8gdXNlIGZvciB0aGUgYnV0dG9ucy5cbmV4cG9ydCBjb25zdCBCdXR0b25UZXh0U3R5bGUgPSB7XG4gICAgZmlsbDogMHhGRkZGRkYsXG4gICAgZm9udEZhbWlseTogXCJIZWx2ZXRpY2EgTmV1ZVwiLFxuICAgIGZvbnRTaXplOiAxNCxcbn07XG5cbi8vIENvbW1vbiBidXR0b24gc3R5bGUgY29uZmlndXJhdGlvbiB0aGF0IGNhbiBiZSBwYXNzZWQgZGlyZWN0bHkgdG8gYVxuLy8gUElYSUJ1dHRvbi5cbmV4cG9ydCBjb25zdCBCdXR0b25TdHlsZXMgPSB7XG4gICAgREFOR0VSOiB7Y29sb3JzOiBCdXR0b25Db2xvcnMuREFOR0VSLCB0ZXh0OiBCdXR0b25UZXh0U3R5bGUsXG4gICAgICAgICAgICAgYm9yZGVyOiB7d2lkdGg6IDEsIGNvbG9yczogQnV0dG9uQm9yZGVyQ29sb3JzLkRBTkdFUn19LFxuICAgIFNVQ0NFU1M6IHtjb2xvcnM6IEJ1dHRvbkNvbG9ycy5TVUNDRVNTLCB0ZXh0OiBCdXR0b25UZXh0U3R5bGUsXG4gICAgICAgICAgICAgIGJvcmRlcjoge3dpZHRoOiAxLCBjb2xvcnM6IEJ1dHRvbkJvcmRlckNvbG9ycy5TVUNDRVNTfX0sXG4gICAgV0FSTklORzoge2NvbG9yczogQnV0dG9uQ29sb3JzLldBUk5JTkcsIHRleHQ6IEJ1dHRvblRleHRTdHlsZSxcbiAgICAgICAgICAgICAgYm9yZGVyOiB7d2lkdGg6IDEsIGNvbG9yczogQnV0dG9uQm9yZGVyQ29sb3JzLldBUk5JTkd9fSxcbn07XG5cbi8vIG9wcGEgYnV0dG9uIHN0eWxlXG4iLCJpbXBvcnQgeyBQSVhJUmVjdCB9IGZyb20gXCIuLi9zaGFwZXMvcGl4aS1yZWN0XCI7XG5pbXBvcnQgeyBCdXR0b25TdGF0ZUhhbmRsZXIgfSBmcm9tIFwiLi9idXR0b24tc3RhdGUtaGFuZGxlclwiO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24gdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGEgUElYSUJ1dHRvbi5cbiAqL1xuZXhwb3J0IHR5cGUgUElYSUJ1dHRvblN0eWxlID0ge1xuICAgIHRleHQ/OiBQSVhJLlRleHRTdHlsZU9wdGlvbnMsXG4gICAgYm9yZGVyPzoge1xuICAgICAgICB3aWR0aD86IG51bWJlcixcbiAgICAgICAgY29sb3JzPzoge1xuICAgICAgICAgICAgZG93bj86IG51bWJlcixcbiAgICAgICAgICAgIGhvdmVyZWQ/OiBudW1iZXIsXG4gICAgICAgICAgICBub3JtYWw/OiBudW1iZXIsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBjb2xvcnM/OiB7XG4gICAgICAgIGRvd24/OiBudW1iZXIsXG4gICAgICAgIGhvdmVyZWQ/OiBudW1iZXIsXG4gICAgICAgIG5vcm1hbD86IG51bWJlcixcbiAgICB9LFxufTtcblxuZnVuY3Rpb24gYWNjZXNzT3JEZWZhdWx0KG9iajogT2JqZWN0LCBwYXRoOiBzdHJpbmdbXSwgZGVmYXVsdFZhbHVlPzogYW55KSB7XG4gICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHBhdGgpIHtcbiAgICAgICAgb2JqID0gb2JqW2NvbXBvbmVudF07XG4gICAgICAgIGlmIChvYmogPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xufTtcblxuLyoqXG4gKiBBIGJ1dHRvbiBjb21wb25lbnQgdGhhdCBjYW4gYmUgYWRkZWQgdG8gYSBzY2VuZSBhbmQgd2lsbCBmaXJlIGFuIGV2ZW50IHdoZW5cbiAqIGNsaWNrZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJQnV0dG9uIGV4dGVuZHMgUElYSS5Db250YWluZXIge1xuICAgIHByaXZhdGUgbGFiZWw6IHN0cmluZztcbiAgICBwcml2YXRlIGNsaWNrSGFuZGxlcnM6IEFycmF5PCgpID0+IHZvaWQ+O1xuICAgIHByaXZhdGUgcGFkZGluZzogbnVtYmVyO1xuXG4gICAgcHJpdmF0ZSB0ZXh0OiBQSVhJLlRleHQ7XG4gICAgcHJpdmF0ZSBvdXRsaW5lOiBQSVhJUmVjdDtcbiAgICBwcml2YXRlIHN0eWxlOiBQSVhJQnV0dG9uU3R5bGU7XG5cbiAgICBwcml2YXRlIGJ1dHRvbldpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBidXR0b25IZWlnaHQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKGxhYmVsOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLFxuICAgICAgICAgICAgICAgIHN0eWxlOiBQSVhJQnV0dG9uU3R5bGUgPSBudWxsKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYnV0dG9uV2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5idXR0b25IZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3R5bGUgPSBzdHlsZTtcblxuICAgICAgICBsZXQgY29ybmVyUmFkaXVzID0gNDtcbiAgICAgICAgdGhpcy5wYWRkaW5nID0gNTtcbiAgICAgICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xuICAgICAgICB0aGlzLmNsaWNrSGFuZGxlcnMgPSBbXTtcblxuICAgICAgICBsZXQgZG93bkZpbGxDb2xvciA9IGFjY2Vzc09yRGVmYXVsdChcbiAgICAgICAgICAgIHN0eWxlLCBbXCJjb2xvcnNcIiwgXCJkb3duXCJdLCAweDAwQUEwMCk7XG4gICAgICAgIGxldCBub3JtYWxGaWxsQ29sb3IgPSBhY2Nlc3NPckRlZmF1bHQoXG4gICAgICAgICAgICBzdHlsZSwgW1wiY29sb3JzXCIsIFwibm9ybWFsXCJdLCAweDAwRkYwMCk7XG4gICAgICAgIGxldCBob3ZlckZpbGxDb2xvciA9IGFjY2Vzc09yRGVmYXVsdChcbiAgICAgICAgICAgIHN0eWxlLCBbXCJjb2xvcnNcIiwgXCJob3ZlcmVkXCJdLCAweDY2RkY2Nik7XG5cbiAgICAgICAgbGV0IGRvd25Cb3JkZXJDb2xvciA9IGFjY2Vzc09yRGVmYXVsdChcbiAgICAgICAgICAgIHN0eWxlLCBbXCJib3JkZXJcIiwgXCJjb2xvcnNcIiwgXCJkb3duXCJdLCBkb3duRmlsbENvbG9yKTtcbiAgICAgICAgbGV0IG5vcm1hbEJvcmRlckNvbG9yID0gYWNjZXNzT3JEZWZhdWx0KFxuICAgICAgICAgICAgc3R5bGUsIFtcImJvcmRlclwiLCBcImNvbG9yc1wiLCBcIm5vcm1hbFwiXSwgbm9ybWFsRmlsbENvbG9yKTtcbiAgICAgICAgbGV0IGhvdmVyQm9yZGVyQ29sb3IgPSBhY2Nlc3NPckRlZmF1bHQoXG4gICAgICAgICAgICBzdHlsZSwgW1wiYm9yZGVyXCIsIFwiY29sb3JzXCIsIFwiaG92ZXJlZFwiXSwgaG92ZXJGaWxsQ29sb3IpO1xuXG4gICAgICAgIHRoaXMub3V0bGluZSA9IG5ldyBQSVhJUmVjdCh3aWR0aCwgaGVpZ2h0LCB7XG4gICAgICAgICAgICBjb3JuZXJSYWRpdXMsIGZpbGxDb2xvcjogbm9ybWFsRmlsbENvbG9yLFxuICAgICAgICAgICAgbGluZVdpZHRoOiBzdHlsZSAmJiBzdHlsZS5ib3JkZXIgJiYgc3R5bGUuYm9yZGVyLndpZHRoIHx8IDAsXG4gICAgICAgICAgICBzdHJva2VDb2xvcjogbm9ybWFsQm9yZGVyQ29sb3J9KTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLm91dGxpbmUpO1xuXG4gICAgICAgIHRoaXMudGV4dCA9IHRoaXMucmVuZGVyVGV4dCgpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMudGV4dCk7XG5cbiAgICAgICAgbmV3IEJ1dHRvblN0YXRlSGFuZGxlcih0aGlzKVxuICAgICAgICAgICAgLndoZW5Ob3JtYWwoKCgpID0+IHRoaXMub3V0bGluZS5zZXRDb2xvcnMoe1xuICAgICAgICAgICAgICAgIGZpbGw6IG5vcm1hbEZpbGxDb2xvciwgc3Ryb2tlOiBub3JtYWxCb3JkZXJDb2xvcn0pKS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgLndoZW5Ib3ZlcmVkKCgoKSA9PiB0aGlzLm91dGxpbmUuc2V0Q29sb3JzKHtcbiAgICAgICAgICAgICAgICBmaWxsOiBob3ZlckZpbGxDb2xvciwgc3Ryb2tlOiBob3ZlckJvcmRlckNvbG9yfSkpLmJpbmQodGhpcykpXG4gICAgICAgICAgICAud2hlbkRvd24oKCgpID0+IHRoaXMub3V0bGluZS5zZXRDb2xvcnMoe1xuICAgICAgICAgICAgICAgIGZpbGw6IGRvd25GaWxsQ29sb3IsIHN0cm9rZTogZG93bkJvcmRlckNvbG9yfSkpLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGxhYmVsIG9mIHRoZSBidXR0b24uIFRoaXMgYXV0b21hdGljYWxseSByZWZyZXNoZXMgdGhlIHZpZXcuIEtlZXBcbiAgICAgKiBpbiBtaW5kIHRoYXQgdGhlIHRleHQgd2lsbCBub3QgYmUgd3JhcHBlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgc2V0TGFiZWwobmV3VGV4dDogc3RyaW5nKTogUElYSUJ1dHRvbiB7XG4gICAgICAgIHRoaXMudGV4dCA9IHRoaXMucmVuZGVyVGV4dChuZXdUZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYSBoYW5kbGVyIGZvciBhIGNsaWNrIGV2ZW50LiBFcXVpdmFsZW50IHRvXG4gICAgICogYGJ1dHRvbi5vbignY2xpY2snLCAuLi4pYCwgYnV0IG1vcmUgY29udmVuaWVudCBiZWNhdXNlIGl0IHJldHVybnMgdGhlXG4gICAgICogYnV0dG9uLlxuICAgICAqL1xuICAgIHB1YmxpYyBvbkNsaWNrKGhhbmRsZXI6ICgpID0+IHZvaWQpOiBQSVhJQnV0dG9uIHtcbiAgICAgICAgdGhpcy5vbihcImNsaWNrXCIsIGhhbmRsZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogUmVuZGVycyBhbmQgcG9zaXRpb25zIHRoZSB0ZXh0IGxhYmVsIG9mIHRoZSBidXR0b24uICovXG4gICAgcHJpdmF0ZSByZW5kZXJUZXh0KGxhYmVsPzogc3RyaW5nKTogUElYSS5UZXh0IHtcbiAgICAgICAgbGFiZWwgPSBsYWJlbCAhPSBudWxsID8gbGFiZWwgOiB0aGlzLmxhYmVsO1xuICAgICAgICBpZiAodGhpcy50ZXh0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dC50ZXh0ID0gbGFiZWw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRleHQgPSB0aGlzLnRleHQgfHwgbmV3IFBJWEkuVGV4dChcbiAgICAgICAgICAgIGxhYmVsLCB0aGlzLnN0eWxlICYmIHRoaXMuc3R5bGUudGV4dCk7XG4gICAgICAgIHRleHQucG9zaXRpb24ueCA9IE1hdGguZmxvb3IodGhpcy5idXR0b25XaWR0aCAvIDIgLSB0ZXh0LndpZHRoIC8gMik7XG4gICAgICAgIHRleHQucG9zaXRpb24ueSA9IE1hdGguZmxvb3IodGhpcy5idXR0b25IZWlnaHQgLyAyIC0gdGV4dC5oZWlnaHQgLyAyKTtcbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfVxufVxuIiwidHlwZSBQSVhJU3RhY2tPcHRpb25zID0ge1xuICAgIHBhZGRpbmc/OiBudW1iZXIsXG4gICAgc2VwYXJhdGlvbj86IG51bWJlcixcbn07XG5cbi8qKlxuICogQSBzaW1wbGUgY2xhc3MgdGhhdCBrZWVwcyB0aGUgY29tbW9uIG9wdGlvbnMgYmV0d2VlbiB0aGUgdmVydGljYWwgYW5kXG4gKiBob3Jpem9udGFsIHN0YWNrcy4gQ3VycmVudGx5LCB0d28gb3B0aW9ucyBhcmUgc3VwcG9ydGVkOlxuICogcGFkZGluZzogdGhlIGFtb3VudCBvZiBzcGFjZSBhcm91bmQgdGhlIGVsZW1lbnRzIGluIHRoZSBzdGFjay5cbiAqIHNlcGFyYXRpb246IHRoZSBhbW91bnQgb2Ygc3BhY2UgYmV0d2VlbiB0aGUgZWxlbWVudHMgaW4gdGhlIHN0YWNrLlxuICovXG5jbGFzcyBQSVhJU3RhY2sgZXh0ZW5kcyBQSVhJLkNvbnRhaW5lciB7XG4gICAgcHJvdGVjdGVkIHBhZGRpbmc6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgc2VwYXJhdGlvbjogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFBJWElTdGFja09wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wYWRkaW5nID0gb3B0aW9ucyAmJiBvcHRpb25zLnBhZGRpbmcgfHwgMDtcbiAgICAgICAgdGhpcy5zZXBhcmF0aW9uID0gb3B0aW9ucyAmJiBvcHRpb25zLnNlcGFyYXRpb24gfHwgMDtcbiAgICB9XG59XG5cbi8qKlxuICogQSBob3Jpem9udGFsIHN0YWNrIHRoYXQgbGF5cyBvdXQgaXRzIGNoaWxkcmVuIHdoZW4gdGhleSBhcmUgYWRkZWQuIEl0IGlzXG4gKiBleHBlY3RlZCB0aGF0IHRoZSBzaXplIGNoYW5nZXMgb2YgdGhlIGNoaWxkcmVuIChpZiBhbnkpIGRvIG5vdCBhZmZlY3QgdGhlXG4gKiBwb3NpdGlvbmluZyBvZiB0aGUgb3RoZXIgY2hpbGRyZW4uIFN0YWNrcyBmcm9tIGxlZnQgdG8gcmlnaHQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJSFN0YWNrIGV4dGVuZHMgUElYSVN0YWNrIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUElYSVN0YWNrT3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkQ2hpbGQoY2hpbGQ6IFBJWEkuQ29udGFpbmVyKSB7XG4gICAgICAgIGxldCBsYXN0Q2hpbGQgPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCA+IDAgP1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5zbGljZSgtMSlbMF0gOiBudWxsO1xuICAgICAgICBsZXQgbGFzdENoaWxkUmVjdCA9IGxhc3RDaGlsZCA9PSBudWxsID8gbnVsbCA6IGxhc3RDaGlsZC5nZXRCb3VuZHMoKTtcbiAgICAgICAgc3VwZXIuYWRkQ2hpbGQoY2hpbGQpO1xuICAgICAgICBjaGlsZC5wb3NpdGlvbi54ID0gKGxhc3RDaGlsZFJlY3QgPT0gbnVsbCA/IHRoaXMucGFkZGluZyA6XG4gICAgICAgICAgICAobGFzdENoaWxkUmVjdC5yaWdodCAtIHRoaXMuZ2V0Qm91bmRzKCkubGVmdCArIHRoaXMuc2VwYXJhdGlvbikpO1xuICAgICAgICBjaGlsZC5wb3NpdGlvbi55ID0gdGhpcy5wYWRkaW5nO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBIHZlcnRpY2FsIHN0YWNrIHRoYXQgbGF5cyBvdXQgaXRzIGNoaWxkcmVuIHdoZW4gdGhleSBhcmUgYWRkZWQuIEl0IGlzXG4gKiBleHBlY3RlZCB0aGF0IHRoZSBzaXplIGNoYW5nZXMgb2YgdGhlIGNoaWxkcmVuIChpZiBhbnkpIGRvIG5vdCBhZmZlY3QgdGhlXG4gKiBwb3NpdGlvbmluZyBvZiB0aGUgb3RoZXIgY2hpbGRyZW4uIFN0YWNrcyBmcm9tIHRvcCB0byBib3R0b20uXG4gKi9cbmV4cG9ydCBjbGFzcyBQSVhJVlN0YWNrIGV4dGVuZHMgUElYSVN0YWNrIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUElYSVN0YWNrT3B0aW9ucykge1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkQ2hpbGQoY2hpbGQ6IFBJWEkuQ29udGFpbmVyKSB7XG4gICAgICAgIGxldCBsYXN0Q2hpbGQgPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCA+IDAgP1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5zbGljZSgtMSlbMF0gOiBudWxsO1xuICAgICAgICBsZXQgbGFzdENoaWxkUmVjdCA9IGxhc3RDaGlsZCA9PSBudWxsID8gbnVsbCA6IGxhc3RDaGlsZC5nZXRCb3VuZHMoKTtcbiAgICAgICAgc3VwZXIuYWRkQ2hpbGQoY2hpbGQpO1xuICAgICAgICBjaGlsZC5wb3NpdGlvbi54ID0gdGhpcy5wYWRkaW5nO1xuICAgICAgICBjaGlsZC5wb3NpdGlvbi55ID0gKGxhc3RDaGlsZFJlY3QgPT0gbnVsbCA/IHRoaXMucGFkZGluZyA6XG4gICAgICAgICAgICAobGFzdENoaWxkUmVjdC5ib3R0b20gLSB0aGlzLmdldEJvdW5kcygpLnRvcCArIHRoaXMuc2VwYXJhdGlvbikpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFBJWElSZWN0IH0gZnJvbSBcIi4uL3NoYXBlcy9waXhpLXJlY3RcIjtcblxuLyoqXG4gKiBUaGUgb3B0aW9ucyB0aGF0IGFyZSBhY2NlcHRlZCBieSBQSVhJVGV4dElucHV0IHRvIGRlc2NyaWJlIGl0cyBhcHBlYXJhbmNlLlxuICovXG50eXBlIFBJWElUZXh0SW5wdXRTdHlsZSA9IHtcbiAgICAvLyBUaGUgc3R5bGUgb2YgdGhlIHRleHQgaXRzZWxmLlxuICAgIHRleHQ/OiBQSVhJLlRleHRTdHlsZU9wdGlvbnMsXG4gICAgLy8gVGhlIGNvbG9yIG9mIHRoZSB0ZXh0IGZpbGwuXG4gICAgY29sb3I/OiBudW1iZXIsXG4gICAgLy8gVGhlIHN0eWxlIG9mIHRoZSB0ZXh0IG91dGxpbmUuXG4gICAgYm9yZGVyPzoge1xuICAgICAgICB3aWR0aD86IG51bWJlcixcbiAgICAgICAgY29sb3I/OiBudW1iZXIsXG4gICAgfSxcbn07XG5cbi8qKlxuICogQSAodmVyeSkgc2ltcGxlIHRleHQgaW5wdXQgZmllbGQgd2l0aCBydWRpbWVudGFyeSBmb2N1cyBzdXBwb3J0LlxuICogVGhlIGZvbGxvd2luZyBmZWF0dXJlcyBjb3VsZCBiZSBzdXBwb3J0ZWQsIGJ1dCBhcmUgbm90OlxuICogLSBNdWx0aWxpbmUgdGV4dFxuICogLSBIb3Jpem9udGFsIHNjcm9sbGluZ1xuICogLSBUZXh0IHNlbGVjdGlvblxuICogLSBDb3B5IHBhc3RlXG4gKiAtIE1vdmluZyB0aGUgY3Vyc29yIHZpYSB0aGUgbW91c2VcbiAqIC0gTW92aW5nIHRoZSBjdXJzb3IgdmlhIHRoZSB1cCBhbmQgZG93biBhcnJvd3NcbiAqXG4gKiBUaGlzIGNvbXBvbmVudCB3aWxsIGVtaXQgYSAnZm9jdXMnIGV2ZW50IHdoZW4gaXQgaXMgY2xpY2tlZFxuICovXG5leHBvcnQgY2xhc3MgUElYSVRleHRJbnB1dCBleHRlbmRzIFBJWEkuQ29udGFpbmVyIHtcbiAgICAvLyBBIGZ1bmN0aW9uIHRoYXQgY29udmVydHMgYSBrZXlDb2RlIHRvIGEgc3RyaW5nLlxuICAgIHByaXZhdGUga2V5Q29kZVRvQ2hhcjogKGtleTogbnVtYmVyKSA9PiBzdHJpbmc7XG4gICAgLy8gQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdHJ1ZSB3aGVuIGEga2V5IHNob3VsZCBiZSBhY2NlcHRlZCBhcyBhIHR5cGFibGVcbiAgICAvLyBjaGFyYWN0ZXIuXG4gICAgcHJpdmF0ZSBrZXlGaWx0ZXI6IChrZXk6IG51bWJlcikgPT4gYm9vbGVhbjtcblxuICAgIC8vIFRoZSBjdXJyZW50IHRleHQgb2YgdGhlIGlucHV0LlxuICAgIHByaXZhdGUgdGV4dDogc3RyaW5nO1xuICAgIC8vIFRoZSBhbW91bnQgb2YgcGFkZGluZyBhcm91bmQgdGhlIHRleHQuXG4gICAgcHJpdmF0ZSBwYWRkaW5nOiBudW1iZXI7XG4gICAgLy8gVGhlIG1heGltdW0gYWxsb3dlZCBsZW5ndGgsIG9yIG51bGwgaWYgbm9uZSBleGlzdHMgKG5vdCByZWNvbW1lbmRlZCkuXG4gICAgcHJpdmF0ZSBtYXhMZW5ndGg6IG51bWJlcjtcbiAgICAvLyBUaGUgaW5kZXggaW50byB0aGUgdGV4dCByZXByZXNlbnRpbmcgd2hlcmUgdGhlIGN1cnNvciBjdXJyZW50bHkgaXMuXG4gICAgcHJpdmF0ZSBjdXJzb3I6IG51bWJlcjtcbiAgICAvLyBXaGV0aGVyIHRoaXMgY29udHJvbCBpcyBmb2N1c2VkLiBXaGVuIGEgdGV4dCBpbnB1dCBpcyBmb2N1c2VkLCBhbGwga2V5XG4gICAgLy8gZXZlbnRzIHdpbGwgYmUgc2VudCB0byBpdC4gSXQgaXMgcmVjb21tZW5kZWQgdGhhdCB0aGluZ3MgYXJlIGFycmFuZ2VkIGluXG4gICAgLy8gYSB3YXkgd2hlcmUgb25seSBvbmUgZWxlbWVudCBpcyBmb2N1c2VkIGF0IGEgdGltZS5cbiAgICBwcml2YXRlIGZvY3VzZWQ6IGJvb2xlYW47XG5cbiAgICAvLyBUaGUgb2JqZWN0IHVzZWQgdG8gbWVhc3VyZSB0ZXh0IHRvIHBsYWNlIHRoZSBjdXJzb3IuXG4gICAgcHJpdmF0ZSBtZWFzdXJlVGV4dE9iamVjdDogUElYSS5UZXh0O1xuICAgIC8vIFRoZSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBhY3R1YWwgZGlzcGxheWVkIHRleHQuXG4gICAgcHJpdmF0ZSB0ZXh0T2JqZWN0OiBQSVhJLlRleHQ7XG4gICAgLy8gVGhlIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGN1cnNvci5cbiAgICBwcml2YXRlIGN1cnNvck9iamVjdDogUElYSS5HcmFwaGljcztcbiAgICAvLyBUaGUgcmVjdCBvdXRsaW5lIG9mIHRoZSB0ZXh0IGlucHV0XG4gICAgcHJpdmF0ZSBvdXRsaW5lOiBQSVhJUmVjdDtcblxuICAgIGNvbnN0cnVjdG9yKHRleHQ6IHN0cmluZywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgc3R5bGU6IFBJWElUZXh0SW5wdXRTdHlsZSA9IG51bGwpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBwcm9wZXJ0aWVzIGFuZCB2YXJpYWJsZXMgdGhhdCBhZmZlY3QgdmlzdWFsXG4gICAgICAgIC8vIGFwcGVhcmFuY2UuXG4gICAgICAgIGxldCBjb3JuZXJSYWRpdXMgPSA0O1xuICAgICAgICB0aGlzLnBhZGRpbmcgPSA1O1xuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuXG4gICAgICAgIHRoaXMuZm9jdXNlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmN1cnNvciA9IDA7XG5cbiAgICAgICAgbGV0IGJhY2tncm91bmRDb2xvciA9IHN0eWxlICYmIHN0eWxlLmNvbG9yO1xuICAgICAgICBpZiAoYmFja2dyb3VuZENvbG9yID09IG51bGwpIHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvciA9IDB4RkZGRkZGO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgZ3JhcGhpYyBvYmplY3RzLlxuICAgICAgICB0aGlzLm91dGxpbmUgPSBuZXcgUElYSVJlY3Qod2lkdGgsIGhlaWdodCwge1xuICAgICAgICAgICAgY29ybmVyUmFkaXVzLCBmaWxsQ29sb3I6IGJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICAgIGxpbmVXaWR0aDogc3R5bGUgJiYgc3R5bGUuYm9yZGVyICYmIHN0eWxlLmJvcmRlci53aWR0aCB8fCAwLFxuICAgICAgICAgICAgc3Ryb2tlQ29sb3I6IHN0eWxlICYmIHN0eWxlLmJvcmRlciAmJiBzdHlsZS5ib3JkZXIuY29sb3IgfHwgMH0pO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMub3V0bGluZSk7XG5cbiAgICAgICAgdGhpcy5tZWFzdXJlVGV4dE9iamVjdCA9IG5ldyBQSVhJLlRleHQoXCJcIiwgc3R5bGUudGV4dCk7XG4gICAgICAgIHRoaXMudGV4dE9iamVjdCA9IG5ldyBQSVhJLlRleHQodGhpcy50ZXh0LCBzdHlsZS50ZXh0KTtcbiAgICAgICAgdGhpcy50ZXh0T2JqZWN0LnBvc2l0aW9uLnggPSB0aGlzLnBhZGRpbmc7XG4gICAgICAgIHRoaXMudGV4dE9iamVjdC5wb3NpdGlvbi55ID0gdGhpcy5wYWRkaW5nO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMudGV4dE9iamVjdCk7XG5cbiAgICAgICAgdGhpcy5jdXJzb3JPYmplY3QgPSB0aGlzLmJ1aWxkVGV4dEN1cnNvcigpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuY3Vyc29yT2JqZWN0KTtcbiAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yKDApO1xuICAgICAgICB0aGlzLmN1cnNvck9iamVjdC5hbHBoYSA9IDA7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgaW50ZXJhY3Rpdml0eSBsb2dpYy5cbiAgICAgICAgdGhpcy5pbnRlcmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHRoaXMub24oXCJwb2ludGVyZG93blwiLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBGb2N1cyBvbiB0aGlzIHRleHQgaW5wdXQuXG4gICAgICAgICAgICB0aGlzLmZvY3VzZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jdXJzb3JPYmplY3QuYWxwaGEgPSAxO1xuICAgICAgICAgICAgdGhpcy5lbWl0KFwiZm9jdXNcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMub24oXCJ1bmZvY3VzXCIsICgpID0+IHtcbiAgICAgICAgICAgIC8vIElmIHNvbWV0aGluZyBlbWl0cyBhbiB1bmZvY3VzIGV2ZW50IG9uIHRoaXMgdGV4dCBpbnB1dCwgaXQgc2hvdWxkXG4gICAgICAgICAgICAvLyByZWFjdC5cbiAgICAgICAgICAgIHRoaXMuZm9jdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jdXJzb3JPYmplY3QuYWxwaGEgPSAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgICAgICAgLy8gSWdub3JlIGtleXMgd2hlbiBub3QgZm9jdXNlZC5cbiAgICAgICAgICAgIGlmICghdGhpcy5mb2N1c2VkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5oYW5kbGVLZXlEb3duKGUua2V5Q29kZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHRoZSB2YWx1ZSBvZiB0aGUgY3VycmVudGx5IGVudGVyZWQgdGV4dC4gKi9cbiAgICBwdWJsaWMgZ2V0VGV4dCgpIHsgcmV0dXJuIHRoaXMudGV4dDsgfVxuXG4gICAgLyoqIFNldHMgdGhlIGtleWNvZGUgY29udmVydGVyLiAqL1xuICAgIHB1YmxpYyBzZXRLZXlDb2RlQ29udmVydGVyKGNvbnZlcnRlcjogKGtleUNvZGU6IG51bWJlcikgPT4gc3RyaW5nKSB7XG4gICAgICAgIHRoaXMua2V5Q29kZVRvQ2hhciA9IGNvbnZlcnRlcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIFNldHMgdGhlIG1heCBsZW5ndGguICovXG4gICAgcHVibGljIHNldE1heExlbmd0aChtYXhMZW5ndGg6IG51bWJlcikge1xuICAgICAgICB0aGlzLm1heExlbmd0aCA9IG1heExlbmd0aDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIFNldHMgdGhlIGtleSBmaWx0ZXIuICovXG4gICAgcHVibGljIHNldEtleUZpbHRlcihmaWx0ZXI6IChrZXlDb2RlOiBudW1iZXIpID0+IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5rZXlGaWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYnVpbGRUZXh0Q3Vyc29yKCk6IFBJWEkuR3JhcGhpY3Mge1xuICAgICAgICBsZXQgY3Vyc29yT2JqZWN0ID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcbiAgICAgICAgY3Vyc29yT2JqZWN0LmJlZ2luRmlsbCgwKTtcbiAgICAgICAgY3Vyc29yT2JqZWN0Lm1vdmVUbygtMSwgdGhpcy5wYWRkaW5nKTtcbiAgICAgICAgY3Vyc29yT2JqZWN0LmxpbmVUbygtMSwgdGhpcy5vdXRsaW5lLmhlaWdodCAtIHRoaXMucGFkZGluZyk7XG4gICAgICAgIGN1cnNvck9iamVjdC5saW5lVG8oMCwgdGhpcy5vdXRsaW5lLmhlaWdodCAtIHRoaXMucGFkZGluZyk7XG4gICAgICAgIGN1cnNvck9iamVjdC5saW5lVG8oMCwgdGhpcy5wYWRkaW5nKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvck9iamVjdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZUtleURvd24oa2V5Q29kZTogbnVtYmVyKSB7XG4gICAgICAgIGlmIChrZXlDb2RlID09PSAzNykgeyAvLyBsZWZ0XG4gICAgICAgICAgICB0aGlzLm1vdmVDdXJzb3IoTWF0aC5tYXgoMCwgdGhpcy5jdXJzb3IgLSAxKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gMzkpIHsgLy8gcmlnaHRcbiAgICAgICAgICAgIHRoaXMubW92ZUN1cnNvcihNYXRoLm1pbih0aGlzLnRleHQubGVuZ3RoLCB0aGlzLmN1cnNvciArIDEpKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSA4KSB7IC8vIGJhY2tzcGFjZVxuICAgICAgICAgICAgbGV0IGZpcnN0SGFsZiA9IHRoaXMudGV4dC5zbGljZSgwLCBNYXRoLm1heCgwLCB0aGlzLmN1cnNvciAtIDEpKTtcbiAgICAgICAgICAgIGxldCBzZWNvbmRIYWxmID0gdGhpcy50ZXh0LnNsaWNlKHRoaXMuY3Vyc29yKTtcbiAgICAgICAgICAgIHRoaXMubW92ZUN1cnNvcih0aGlzLmN1cnNvciAtIDEpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVUZXh0KGZpcnN0SGFsZiArIHNlY29uZEhhbGYpO1xuICAgICAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09IDQ2KSB7IC8vIGRlbGV0ZVxuICAgICAgICAgICAgbGV0IGZpcnN0SGFsZiA9IHRoaXMudGV4dC5zbGljZSgwLCB0aGlzLmN1cnNvcik7XG4gICAgICAgICAgICBsZXQgc2Vjb25kSGFsZiA9IHRoaXMudGV4dC5zbGljZShcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLnRleHQubGVuZ3RoLCB0aGlzLmN1cnNvciArIDEpKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVGV4dChmaXJzdEhhbGYgKyBzZWNvbmRIYWxmKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmtleUZpbHRlciA9PSBudWxsIHx8IHRoaXMua2V5RmlsdGVyKGtleUNvZGUpKSB7XG4gICAgICAgICAgICBsZXQgc3RyID0gdGhpcy5rZXlDb2RlVG9DaGFyKGtleUNvZGUpO1xuICAgICAgICAgICAgaWYgKHRoaXMudXBkYXRlVGV4dCh0aGlzLnRleHQuc2xpY2UoMCwgdGhpcy5jdXJzb3IpICsgc3RyICtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXh0LnNsaWNlKHRoaXMuY3Vyc29yKSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVDdXJzb3IodGhpcy5jdXJzb3IgKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGRpc3BsYXllZCB0ZXh0LCB1bmxlc3MgdGhlIHRleHQgaXMgdG9vIGxvbmcuXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSB0ZXh0IHdhcyB1cGRhdGVkLlxuICAgICAqL1xuICAgIHByaXZhdGUgdXBkYXRlVGV4dChuZXdUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMubWF4TGVuZ3RoICE9IG51bGwgJiYgbmV3VGV4dC5sZW5ndGggPiB0aGlzLm1heExlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGV4dCA9IG5ld1RleHQ7XG4gICAgICAgIHRoaXMudGV4dE9iamVjdC50ZXh0ID0gbmV3VGV4dDtcbiAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yKHRoaXMuY3Vyc29yKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWVhc3VyZXMgdGhlIGdpdmVuIHRleHQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBtZWFzdXJlVGV4dCh0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5tZWFzdXJlVGV4dE9iamVjdC50ZXh0ID0gdGV4dDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLm1lYXN1cmVUZXh0T2JqZWN0LndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLm1lYXN1cmVUZXh0T2JqZWN0LmhlaWdodCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3ZlcyB0aGUgY3Vyc29yIHRvIGBuZXdQb3NpdGlvbmAsIHdoaWNoIHNob3VsZCBiZSBiZXR3ZWVuIDAgYW5kXG4gICAgICogdGhpcy50ZXh0Lmxlbmd0aCAoaW5jbHVzaXZlKS5cbiAgICAgKi9cbiAgICBwcml2YXRlIG1vdmVDdXJzb3IobmV3UG9zaXRpb246IG51bWJlcikge1xuICAgICAgICBpZiAobmV3UG9zaXRpb24gPCAwKSB7XG4gICAgICAgICAgICBuZXdQb3NpdGlvbiA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5ld1Bvc2l0aW9uID4gdGhpcy50ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgbmV3UG9zaXRpb24gPSB0aGlzLnRleHQubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRleHRQYXJ0ID0gdGhpcy50ZXh0LnNsaWNlKDAsIG5ld1Bvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5jdXJzb3IgPSBuZXdQb3NpdGlvbjtcbiAgICAgICAgbGV0IG1lYXN1cmVkV2lkdGggPSB0ZXh0UGFydC5sZW5ndGggPiAwID9cbiAgICAgICAgICAgIHRoaXMubWVhc3VyZVRleHQodGV4dFBhcnQpLndpZHRoIDogMDtcbiAgICAgICAgdGhpcy5jdXJzb3JPYmplY3QucG9zaXRpb24ueCA9IG1lYXN1cmVkV2lkdGggKyB0aGlzLnBhZGRpbmc7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSG93bCwgSG93bGVyIH0gZnJvbSBcImhvd2xlclwiO1xuXG4vKipcbiAqIEFuIGVudW1lcmF0aW9uIG9mIGlkZW50aWZpZXJzIGZvciBzb3VuZHMgdXNlZCBieSB0aGlzIGFwcC5cbiAqL1xuZXhwb3J0IGVudW0gU291bmRzIHtcbiAgICBQTE9QLFxufVxuXG4vKipcbiAqIEEgY2xhc3MgY29udGFpbmluZyBtZXRob2RzIHVzZWQgdG8gcGxheSBzb3VuZHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBBdWRpbyB7XG4gICAgLyoqIEluaXRpYWxpemVzIHRoZSBzb3VuZHMgcmVwb3NpdG9yeS4gKi9cbiAgICBwdWJsaWMgc3RhdGljIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmIChBdWRpby5zb3VuZHMgPT0gbnVsbCkge1xuICAgICAgICAgICAgQXVkaW8uc291bmRzID0ge307XG4gICAgICAgICAgICBBdWRpby5zb3VuZHNbU291bmRzLlBMT1BdID0gbmV3IEhvd2woe1xuICAgICAgICAgICAgICAgIC8vIG1wMyBpcyBwdWJsaWMgZG9tYWluLCBkb3dubG9hZGVkIGZyb21cbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vc291bmRiaWJsZS5jb20vMjA2Ny1CbG9wLmh0bWxcbiAgICAgICAgICAgICAgICBzcmM6IFtcInNvdW5kcy9CbG9wLU1hcmtfRGlBbmdlbG8tNzkwNTQzMzQubXAzXCJdLFxuICAgICAgICAgICAgICAgIHZvbHVtZTogMC4xLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogUGxheXMgdGhlIHNvdW5kIHdpdGggdGhlIGdpdmVuIGlkZW50aWZpZXIuICovXG4gICAgcHVibGljIHN0YXRpYyBwbGF5KHNvdW5kOiBTb3VuZHMpIHtcbiAgICAgICAgQXVkaW8uaW5pdGlhbGl6ZSgpO1xuICAgICAgICBsZXQgaG93bCA9IEF1ZGlvLnNvdW5kc1tzb3VuZF07XG4gICAgICAgIGlmIChob3dsICE9IG51bGwpIHtcbiAgICAgICAgICAgIGhvd2wucGxheSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIENvbnRhaW5zIHRoZSBzb3VuZHMgYXMgSG93bHMuXG4gICAgcHJpdmF0ZSBzdGF0aWMgc291bmRzOiB7W2tleTogc3RyaW5nXTogSG93bH07XG59XG5cbi8vIEluaXRpYWxpemUgdGhlIGF1ZGlvIHNvIHRoYXQgdGhlIHJlc291cmNlcyBhcmUgcHJlbG9hZGVkIGJlZm9yZSB3ZSBhdHRlbXB0IHRvXG4vLyBwbGF5IGFueXRoaW5nLlxuQXVkaW8uaW5pdGlhbGl6ZSgpO1xuIiwibGV0IGNsYW1wID0gKG51bTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpID0+XG4gICAgTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIG51bSkpO1xuXG5leHBvcnQgY2xhc3MgQ29vcmRVdGlscyB7XG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBjb29yZGluYXRlIGFuZCBzaXplIChhbGwgaW4gaW50ZWdlcnMpLCB0aGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuXG4gICAgICogdGhlIGluZGV4IG9mIHRoYXQgY29vcmRpbmF0ZSBpbiBhIGZsYXQgYXJyYXkuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBjb29yZFRvSW5kZXgoeDogbnVtYmVyLCB5OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkQ2xhbXA6IGJvb2xlYW4gPSB0cnVlKTogbnVtYmVyIHtcbiAgICAgICAgeCA9IHggfCAwO1xuICAgICAgICB5ID0geSB8IDA7XG4gICAgICAgIGlmIChzaG91bGRDbGFtcCkge1xuICAgICAgICAgICAgeCA9IGNsYW1wKHgsIDAsIHdpZHRoIC0gMSk7XG4gICAgICAgICAgICB5ID0gY2xhbXAoeSwgMCwgaGVpZ2h0IC0gMSk7XG4gICAgICAgIH0gZWxzZSBpZiAoeCA8IDAgfHwgeSA8IDAgfHwgeCA+PSB3aWR0aCB8fCB5ID49IGhlaWdodCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHkgKiB3aWR0aCArIHg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYW4gaW5kZXggYW5kIHNpemUsIHRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm4gdGhlIGNvb3JkaW5hdGUuIFRoaXNcbiAgICAgKiBmdW5jdGlvbiBpcyB0aGUgaW52ZXJzZSBvZiBjb29yZFRvSW5kZXguXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBpbmRleFRvQ29vcmQoXG4gICAgICAgICAgICBpbmRleDogbnVtYmVyLCB3aWR0aDogbnVtYmVyKToge3g6IG51bWJlciwgeTogbnVtYmVyfSB7XG4gICAgICAgIGluZGV4ID0gaW5kZXggfCAwO1xuICAgICAgICB3aWR0aCA9IHdpZHRoIHwgMDtcbiAgICAgICAgbGV0IHggPSBpbmRleCAlIHdpZHRoO1xuICAgICAgICBsZXQgeSA9IChpbmRleCAtIHgpIC8gd2lkdGg7XG4gICAgICAgIHJldHVybiB7eCwgeX07XG4gICAgfVxufVxuIiwiaW1wb3J0IFBJWEkgPSByZXF1aXJlKFwicGl4aS5qc1wiKTtcblxuaW1wb3J0IHsgQXJyb3dCb2FyZENvbnRyb2xsZXIgfSBmcm9tIFwiLi9hcnJvd3MvYXJyb3ctYm9hcmQtY29udHJvbGxlclwiO1xuaW1wb3J0IHsgQXJyb3dCb2FyZFJlbmRlcmVyIH0gZnJvbSBcIi4vYXJyb3dzL2Fycm93LWJvYXJkLXJlbmRlcmVyXCI7XG5pbXBvcnQgeyBBcnJvd1NxdWFyZVR5cGUgfSBmcm9tIFwiLi9hcnJvd3MvYXJyb3dzXCI7XG5pbXBvcnQgeyBCb2FyZCwgQm9hcmRTcXVhcmVJbml0aWFsaXplciB9IGZyb20gXCIuL2JvYXJkL2JvYXJkXCI7XG5pbXBvcnQgeyBDaGVja2VyIH0gZnJvbSBcIi4vY2hlY2tlci9jaGVja2VyXCI7XG5pbXBvcnQgeyBDaGVja2VyQ29udHJvbGxlciB9IGZyb20gXCIuL2NoZWNrZXIvY2hlY2tlci1jb250cm9sbGVyXCI7XG5pbXBvcnQgeyBDaGVja2VyUmVuZGVyZXIgfSBmcm9tIFwiLi9jaGVja2VyL2NoZWNrZXItcmVuZGVyZXJcIjtcblxuLy8gQ3VzdG9tIFBJWEkgY29udHJvbHMvc3R5bGluZ1xuaW1wb3J0IHsgQnV0dG9uU3R5bGVzIH0gZnJvbSBcIi4vcmVuZGVyYWJsZS93aWRnZXRzL2J1dHRvbi1zdHlsZVwiO1xuaW1wb3J0IHsgUElYSUJ1dHRvbiB9IGZyb20gXCIuL3JlbmRlcmFibGUvd2lkZ2V0cy9waXhpLWJ1dHRvblwiO1xuaW1wb3J0IHsgUElYSUhTdGFjaywgUElYSVZTdGFjayB9IGZyb20gXCIuL3JlbmRlcmFibGUvd2lkZ2V0cy9waXhpLXN0YWNrXCI7XG5pbXBvcnQgeyBQSVhJVGV4dElucHV0IH0gZnJvbSBcIi4vcmVuZGVyYWJsZS93aWRnZXRzL3BpeGktdGV4dC1pbnB1dFwiO1xuXG5pbXBvcnQgeyBBdWRpbywgU291bmRzIH0gZnJvbSBcIi4vdXRpbC9hdWRpb1wiO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIHdvcmxkLCBvciB0aGUgYXBwLiBUaGlzIGNsYXNzIGhhcyB0b3AtbGV2ZWwgY29udHJvbCBvdmVyIGFsbFxuICogZnVuY3Rpb25hbGl0eSBvZiB0aGUgYXBwLiBJdCBidWlsZHMgdGhlIFVJIGFuZCB0aWVzIGl0IHRvIGFjdHVhbFxuICogZnVuY3Rpb25hbGl0eS5cbiAqL1xuZXhwb3J0IGNsYXNzIFdvcmxkIHtcbiAgICBwcml2YXRlIHJlbmRlcmVyOiBQSVhJLldlYkdMUmVuZGVyZXI7XG4gICAgcHJpdmF0ZSBzdGFnZTogUElYSS5Db250YWluZXI7XG5cbiAgICBwcml2YXRlIG1haW5TdGFjazogUElYSS5Db250YWluZXI7XG4gICAgcHJpdmF0ZSBsZWZ0TWVudTogUElYSS5Db250YWluZXI7XG4gICAgcHJpdmF0ZSByaWdodFNpZGU6IFBJWEkuQ29udGFpbmVyO1xuICAgIHByaXZhdGUgdG9wQmFyOiBQSVhJLkNvbnRhaW5lcjtcbiAgICBwcml2YXRlIGJvYXJkQ29udGFpbmVyOiBQSVhJLkNvbnRhaW5lcjtcbiAgICBwcml2YXRlIHN0YXR1c0xhYmVsOiBQSVhJLlRleHQ7XG5cbiAgICBwcml2YXRlIHVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtOiBib29sZWFuO1xuXG4gICAgLy8gR2FtZSBzdGF0ZVxuICAgIHByaXZhdGUgcGF1c2VkOiBib29sZWFuO1xuICAgIHByaXZhdGUgYm9hcmRXaWR0aDogbnVtYmVyO1xuICAgIHByaXZhdGUgYm9hcmRIZWlnaHQ6IG51bWJlcjtcblxuICAgIHByaXZhdGUgYm9hcmQ6IEJvYXJkPEFycm93U3F1YXJlVHlwZT47XG4gICAgcHJpdmF0ZSBib2FyZENvbnRyb2xsZXI6IEFycm93Qm9hcmRDb250cm9sbGVyO1xuICAgIHByaXZhdGUgYm9hcmRSZW5kZXJlcjogQXJyb3dCb2FyZFJlbmRlcmVyO1xuXG4gICAgcHJpdmF0ZSBjaGVja2VyOiBDaGVja2VyO1xuICAgIHByaXZhdGUgY2hlY2tlclJlbmRlcmVyOiBDaGVja2VyUmVuZGVyZXI7XG4gICAgcHJpdmF0ZSBjaGVja2VyQ29udHJvbGxlcjogQ2hlY2tlckNvbnRyb2xsZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ib2FyZFdpZHRoID0gMTA7XG4gICAgICAgIHRoaXMuYm9hcmRIZWlnaHQgPSAxMDtcblxuICAgICAgICB0aGlzLnVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IHRoaXMuaW5pdGlhbGl6ZVJlbmRlcmVyKCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5yZW5kZXJlci52aWV3KTtcbiAgICAgICAgdGhpcy5zdGFnZSA9IG5ldyBQSVhJLkNvbnRhaW5lcigpO1xuXG4gICAgICAgIHRoaXMubGVmdE1lbnUgPSB0aGlzLmJ1aWxkTGVmdE1lbnUoKTtcbiAgICAgICAgdGhpcy5yaWdodFNpZGUgPSB0aGlzLmJ1aWxkUmlnaHRTaWRlKCk7XG5cbiAgICAgICAgdGhpcy5tYWluU3RhY2sgPSBuZXcgUElYSUhTdGFjayh7cGFkZGluZzogMTAsIHNlcGFyYXRpb246IDEwfSk7XG4gICAgICAgIHRoaXMuc3RhZ2UuYWRkQ2hpbGQodGhpcy5tYWluU3RhY2spO1xuICAgICAgICB0aGlzLm1haW5TdGFjay5hZGRDaGlsZCh0aGlzLmxlZnRNZW51KTtcbiAgICAgICAgdGhpcy5tYWluU3RhY2suYWRkQ2hpbGQodGhpcy5yaWdodFNpZGUpO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlTmV3Qm9hcmQoKTtcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCAoKSA9PiB0aGlzLmhhbmRsZVdpbmRvd1Jlc2l6ZShcbiAgICAgICAgICAgIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5oYW5kbGVXaW5kb3dSZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgY2hlY2tlciwgaWYgdGhlcmUgaXMgb25lLCBhbmQgcmVpbnN0YW50aWF0ZXMgYWxsIHRoZSBjbGFzc2VzXG4gICAgICogYXNzb2NpYXRlZCB3aXRoIHRoZSBib2FyZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlTmV3Qm9hcmQoKSB7XG4gICAgICAgIC8vIElmIGEgY2hlY2tlciBleGlzdHMsIHJlbW92ZSBpdHMgcmVuZGVyZWQgZWxlbWVudCBhbmQgcmVzZXQgYWxsXG4gICAgICAgIC8vIGNoZWNrZXItcmVsYXRlZCBwcm9wZXJ0aWVzLlxuICAgICAgICBpZiAodGhpcy5jaGVja2VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGxldCByZW5kZXJlZENoZWNrZXIgPSB0aGlzLmNoZWNrZXJSZW5kZXJlci5nZXRSZW5kZXJlZCgpO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVkQ2hlY2tlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ib2FyZENvbnRhaW5lci5yZW1vdmVDaGlsZChyZW5kZXJlZENoZWNrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jaGVja2VyID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlckNvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyUmVuZGVyZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIGJvYXJkLlxuICAgICAgICB0aGlzLmJvYXJkID0gbmV3IEJvYXJkPEFycm93U3F1YXJlVHlwZT4oXG4gICAgICAgICAgICB0aGlzLmJvYXJkV2lkdGgsIHRoaXMuYm9hcmRIZWlnaHQsIHRoaXMuYXJyb3dTcXVhcmVJbml0aWFsaXplcik7XG4gICAgICAgIHRoaXMuYm9hcmRDb250cm9sbGVyID0gbmV3IEFycm93Qm9hcmRDb250cm9sbGVyKHRoaXMuYm9hcmQpO1xuICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIgPSBuZXcgQXJyb3dCb2FyZFJlbmRlcmVyKHRoaXMuYm9hcmQpO1xuICAgICAgICAvLyBBdHRhY2ggdGhlIG5ldyBjbGljayBoYW5kbGVyLCBzaW5jZSB3ZSBoYXZlIGEgbmV3IHJlbmRlcmVyIGluc3RhbmNlLlxuICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIub25DbGljaygoeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGxldCBzcXVhcmUgPSB0aGlzLmJvYXJkLmdldCh4LCB5KTtcbiAgICAgICAgICAgIGlmIChzcXVhcmUuYW5nbGUgPT09IE1hdGgucm91bmQoc3F1YXJlLmFuZ2xlKSkge1xuICAgICAgICAgICAgICAgIHNxdWFyZS5hbmdsZSA9IChzcXVhcmUuYW5nbGUgKyAxKSAlIDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmJvYXJkLnB1dChzcXVhcmUsIHgsIHkpO1xuICAgICAgICAgICAgdGhpcy5ib2FyZFJlbmRlcmVyLnVwZGF0ZSh4LCB5KTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrZXJDb250cm9sbGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXJDb250cm9sbGVyLnJlc2V0KHRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gVGhpcyB3aWxsIGNsZWFyIHRoZSBib2FyZCBjb250YWluZXIgYW5kIHJlbmRlciB0aGUgYm9hcmQgaW50byB0aGVcbiAgICAgICAgLy8gcmVuZGVyZXIgdmlld3BvcnQuXG4gICAgICAgIHRoaXMucmVyZW5kZXJCb2FyZCgpO1xuICAgICAgICAvLyBTcGluIHRoZSBhcnJvd3MgZm9yIGVmZmVjdC5cbiAgICAgICAgdGhpcy5ib2FyZENvbnRyb2xsZXIuaW5pdGlhdGVSb3RhdGlvbigpO1xuICAgIH1cblxuICAgIC8qKiBVcGRhdGVzIHRoZSB3b3JsZC4gKi9cbiAgICBwdWJsaWMgdXBkYXRlKCkge1xuICAgICAgICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuYm9hcmRDb250cm9sbGVyLnVwZGF0ZSgpKSB7XG4gICAgICAgICAgICAvLyBJZiBhcmUgaW4gdGhpcyBibG9jaywgdGhhdCBtZWFucyBhbGwgYXJyb3dzIGFyZSBkb25lIHNwaW5uaW5nLlxuICAgICAgICAgICAgLy8gSW4gdGhpcyBjYXNlLCB3ZSBtaWdodCBlaXRoZXIgaGF2ZSB0byBjcmVhdGUgYSByYW5kb20gY2hlY2tlciBvclxuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBleGlzdGluZyBvbmUuXG4gICAgICAgICAgICBpZiAodGhpcy5jaGVja2VyID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIudXBkYXRlQWxsKCk7XG4gICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgYSByYW5kb20gcG9zaXRpb24uXG4gICAgICAgICAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5ib2FyZC5nZXRXaWR0aCgpO1xuICAgICAgICAgICAgICAgIGxldCBpID0gTWF0aC5mbG9vcihcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5yYW5kb20oKSAqIHdpZHRoICogdGhpcy5ib2FyZC5nZXRIZWlnaHQoKSk7XG4gICAgICAgICAgICAgICAgbGV0IHggPSBpICUgd2lkdGg7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSAoaSAtIHgpIC8gd2lkdGg7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIG91ciBjaGVja2VyIGFuZCBhc3NvY2lhdGVkIG9iamVjdHMuXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja2VyID0gbmV3IENoZWNrZXIoeCwgeSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja2VyQ29udHJvbGxlciA9IG5ldyBDaGVja2VyQ29udHJvbGxlcihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ib2FyZCwgdGhpcy5jaGVja2VyLCB0aGlzLnVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZXJSZW5kZXJlciA9IG5ldyBDaGVja2VyUmVuZGVyZXIodGhpcy5jaGVja2VyKTtcbiAgICAgICAgICAgICAgICAvLyBSZW5kZXIgdGhlIGNoZWNrZXIgb24gdGhlIGJvYXJkLiBUaGlzIGlzIGNvbnZlbmllbnQgYmVjYXVzZVxuICAgICAgICAgICAgICAgIC8vIHRoaXMgd2F5IHRoZSBjaGVja2VyIHdpbGwgaGF2ZSB0aGUgc2FtZSBvZmZzZXQgYXMgdGhlIGJvYXJkLlxuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRDb250YWluZXIuYWRkQ2hpbGQodGhpcy5jaGVja2VyUmVuZGVyZXIucmVuZGVyKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIuZ2V0U3F1YXJlU2l6ZSgpKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tlckNvbnRyb2xsZXIudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja2VyUmVuZGVyZXIudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hlY2tlckNvbnRyb2xsZXIuaGFzRGV0ZWN0ZWRDeWNsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdHVzKFwiRGV0ZWN0ZWQgY3ljbGVcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNoZWNrZXJDb250cm9sbGVyLmhhc0RldGVjdGVkRWRnZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdHVzKFwiRGV0ZWN0ZWQgZWRnZVwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXR1cyhcIlNlYXJjaGluZy4uLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBGdXR1cmUgd29yaywgd2UgY291bGQgZG8gYmV0dGVyIGhlcmUgYnkgaGF2aW5nXG4gICAgICAgICAgICAvLyBBcnJvd0JvYXJkQ29udHJvbGxlci51cGRhdGUgcmV0dXJuIHRoZSB1cGRhdGVkIHNxdWFyZVxuICAgICAgICAgICAgLy8gY29vcmRpbmF0ZXMsIHNvIHdlIGNvdWxkIG9ubHkgdXBkYXRlIHRob3NlLlxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoXCJJbml0aWFsaXppbmcuLi5cIik7XG4gICAgICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIudXBkYXRlQWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnN0YWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIHNtYWxsIGhlbHBlciBmdW5jdGlvbiB0aGF0IGFsbG93cyB1cyB0byBlYXNpbHkgaW5pdGlhbGl6ZSBhbiBhcnJvd1xuICAgICAqIGJvYXJkIHdoZXJlIGFsbCB0aGUgYXJyb3dzIGFyZSBwb2ludGluZyBpbiBhIHJhbmRvbSBkaXJlY3Rpb24uXG4gICAgICovXG4gICAgcHJpdmF0ZSBhcnJvd1NxdWFyZUluaXRpYWxpemVyKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIGxldCB2ZWxvY2l0eUJhc2UgPSAoTWF0aC5yYW5kb20oKSAtIC41KSAvIDI7XG4gICAgICAgIGxldCB2ZWxvY2l0eVNpZ24gPSB2ZWxvY2l0eUJhc2UgPj0gMCA/IDEgOiAtMTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFuZ2xlOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA0KSxcbiAgICAgICAgICAgIHZlbG9jaXR5OiB2ZWxvY2l0eUJhc2UgKyB2ZWxvY2l0eVNpZ24gKiAwLjIsXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIGEgUElYSSByZW5kZXJlciBhbmQgcmV0dXJucyBpdC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGluaXRpYWxpemVSZW5kZXJlcigpIHtcbiAgICAgICAgY29uc3QgcmVuZGVyZXI6IFBJWEkuV2ViR0xSZW5kZXJlciA9IG5ldyBQSVhJLldlYkdMUmVuZGVyZXIoMTI4MCwgNzIwKTtcbiAgICAgICAgLy8gRm9yIHRoZSBNYWNCb29rcyB3aXRoIHJldGluYSBkaXNwbGF5cywgNCBpcyBhIGdvb2QgbnVtYmVyIGhlcmUuXG4gICAgICAgIC8vIEknZCBndWVzcyB0aGF0IDIgd291bGQgYmUgYSBnb29kIG51bWJlciBmb3Igbm9uLXJldGluYSBkaXNwbGF5cy5cbiAgICAgICAgcmVuZGVyZXIucmVzb2x1dGlvbiA9IDQ7XG4gICAgICAgIHJldHVybiByZW5kZXJlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCYXNlZCBvbiB0aGUgdmFsdWUgb2YgYHVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtYCwgcmV0dXJucyB0aGUgbGFiZWwgb2YgYVxuICAgICAqIGJ1dHRvbiB0aGF0IHdvdWxkIHN3aXRjaCB0byB0aGUgb3Bwb3NpdGUvbmV4dCBtb2RlLlxuICAgICAqL1xuICAgIHByaXZhdGUgZ2V0QWxnb3JpdGhtQnV0dG9uTGFiZWwoKSB7XG4gICAgICAgIGxldCB0b0NvbnN0YW50VGltZUxhYmVsID0gXCJTd2l0Y2ggdG8gQ29uc3RhbnQgTWVtb3J5XCI7XG4gICAgICAgIGxldCB0b0hhc2hNYXBMYWJlbCA9IFwiU3dpdGNoIHRvIEhhc2hNYXBcIjtcbiAgICAgICAgcmV0dXJuICh0aGlzLnVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtID9cbiAgICAgICAgICAgICAgICB0b0hhc2hNYXBMYWJlbCA6IHRvQ29uc3RhbnRUaW1lTGFiZWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyB0aGUgbGVmdCBtZW51LiBSZXR1cm5zIGEgYFBJWEkuQ29udGFpbmVyYCwgd2hpY2ggY29udGFpbnMgYWxsIHRoZVxuICAgICAqIGJ1dHRvbnMgbGFpZCBvdXQgdmVydGljYWxseS4gQ29udGFpbnMgdGhlIGZvbGxvd2luZyBidXR0b25zOlxuICAgICAqIGBTdGFydGA6IFVucGF1c2VzIHRoZSBnYW1lIGlmIGl0IGlzIHBhdXNlZC5cbiAgICAgKiBgU3RvcGA6IFBhdXNlcyB0aGUgZ2FtZSBpZiBpdCB1bnBhdXNlZC5cbiAgICAgKiBgUmVzZXRgOiBSZXNldHMgdGhlIGJvYXJkIGFuZCBtb3ZlcyB0aGUgY2hlY2tlciB0byBhIG5ldyByYW5kb20gcG9zaXRpb24uXG4gICAgICogYFNodWZmbGUgQXJyb3dzYDogUmVzZXRzIHRoZSBib2FyZCwgYnV0IGRvZXMgbm90IG1vdmUgdGhlIGNoZWNrZXIuXG4gICAgICogYGNvbnN0YW50TWVtb3J5QnV0dG9uYDogU3dpdGNoZXMgYmV0d2VlbiB0aGUgdHdvIGltcGxlbWVudGVkIGFsZ29yaXRobXM6XG4gICAgICogICAgIEEgaGFzaG1hcCB2ZXJzaW9uIHRoYXQgaXMgTyhNKSBpbiBtZW1vcnkgZ3Jvd3RoICh3aGVyZSBNIGlzIHRoZSB0b3RhbFxuICAgICAqICAgICAgICAgbnVtYmVyIG9mIHNxdWFyZXMpLlxuICAgICAqICAgICBBbiBpbXBsZW1lbnRhdGlvbiBvZiBGbG95ZCdzIFRvcnRvaXNlIGFuZCBIYXJlIGFsZ29yaXRobSwgd2hpY2ggaXNcbiAgICAgKiAgICAgICAgIGNvbnN0YW50IG1lbW9yeSBjb21wbGV4aXR5LlxuICAgICAqL1xuICAgIHByaXZhdGUgYnVpbGRMZWZ0TWVudSgpOiBQSVhJLkNvbnRhaW5lciB7XG4gICAgICAgIGxldCBidXR0b25XaWR0aCA9IDE5MDtcbiAgICAgICAgbGV0IHN0YWNrID0gbmV3IFBJWElWU3RhY2soe3NlcGFyYXRpb246IDEwfSk7XG4gICAgICAgIHN0YWNrLmFkZENoaWxkKFxuICAgICAgICAgICAgbmV3IFBJWElCdXR0b24oXCJTdGFydFwiLCBidXR0b25XaWR0aCwgMzQsIEJ1dHRvblN0eWxlcy5TVUNDRVNTKVxuICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdGhpcy5oYW5kbGVTdGFydEdhbWUoKSkpO1xuICAgICAgICBzdGFjay5hZGRDaGlsZChcbiAgICAgICAgICAgIG5ldyBQSVhJQnV0dG9uKFwiU3RvcFwiLCBidXR0b25XaWR0aCwgMzQsIEJ1dHRvblN0eWxlcy5XQVJOSU5HKVxuICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdGhpcy5oYW5kbGVTdG9wR2FtZSgpKSk7XG4gICAgICAgIHN0YWNrLmFkZENoaWxkKFxuICAgICAgICAgICAgbmV3IFBJWElCdXR0b24oXCJSZXNldFwiLCBidXR0b25XaWR0aCwgMzQsIEJ1dHRvblN0eWxlcy5EQU5HRVIpXG4gICAgICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLmhhbmRsZVJlc2V0R2FtZSgpKSk7XG4gICAgICAgIHN0YWNrLmFkZENoaWxkKFxuICAgICAgICAgICAgbmV3IFBJWElCdXR0b24oXG4gICAgICAgICAgICAgICAgXCJTaHVmZmxlIEFycm93c1wiLCBidXR0b25XaWR0aCwgMzQsIEJ1dHRvblN0eWxlcy5TVUNDRVNTKVxuICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdGhpcy5oYW5kbGVTaHVmZmxlQXJyb3dzKCkpKTtcblxuICAgICAgICBsZXQgY29uc3RhbnRNZW1vcnlCdXR0b24gPSBuZXcgUElYSUJ1dHRvbihcbiAgICAgICAgICAgICAgICB0aGlzLmdldEFsZ29yaXRobUJ1dHRvbkxhYmVsKCksIGJ1dHRvbldpZHRoLCAzNCxcbiAgICAgICAgICAgICAgICBCdXR0b25TdHlsZXMuV0FSTklORylcbiAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+XG4gICAgICAgICAgICAgICAgY29uc3RhbnRNZW1vcnlCdXR0b24uc2V0TGFiZWwodGhpcy5oYW5kbGVUb2dnbGVBbGdvcml0aG0oKSkpO1xuICAgICAgICBzdGFjay5hZGRDaGlsZChjb25zdGFudE1lbW9yeUJ1dHRvbik7XG4gICAgICAgIHJldHVybiBzdGFjaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIFVJIHdoaWNoIGNvbnRhaW5zIHRoZSB0b3AgYmFyIGFuZCB0aGUgYm9hcmQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFJpZ2h0U2lkZSgpOiBQSVhJLkNvbnRhaW5lciB7XG4gICAgICAgIGxldCBjb250YWluZXIgPSBuZXcgUElYSVZTdGFjayh7c2VwYXJhdGlvbjogMTB9KTtcbiAgICAgICAgY29udGFpbmVyLmFkZENoaWxkKHRoaXMudG9wQmFyID0gdGhpcy5idWlsZFRvcEJhcigpKTtcbiAgICAgICAgY29udGFpbmVyLmFkZENoaWxkKHRoaXMuYm9hcmRDb250YWluZXIgPSBuZXcgUElYSS5Db250YWluZXIoKSk7XG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBoZWxwZXIgbWV0aG9kIHRoYXQgc2V0cyB1cCBhIHRleHQgaW5wdXQgZm9yIG51bWJlciBlbnRyeS5cbiAgICAgKi9cbiAgICBwcml2YXRlIHNldHVwU2l6ZUlucHV0KGluaXRpYWxWYWx1ZTogc3RyaW5nKTogUElYSVRleHRJbnB1dCB7XG4gICAgICAgIGxldCBpbnB1dCA9IG5ldyBQSVhJVGV4dElucHV0KGluaXRpYWxWYWx1ZSwgNjUsIDMwLCB7XG4gICAgICAgICAgICAgICAgYm9yZGVyOiB7Y29sb3I6IDB4ODg4ODg4LCB3aWR0aDogMX0sIGNvbG9yOiAweEZGRkZGRixcbiAgICAgICAgICAgICAgICB0ZXh0OiB7Zm9udFNpemU6IDE1fX0pXG4gICAgICAgICAgICAuc2V0S2V5RmlsdGVyKChrZXlDb2RlOiBudW1iZXIpID0+IChrZXlDb2RlID49IDQ4ICYmIGtleUNvZGUgPCA1OCkpXG4gICAgICAgICAgICAuc2V0S2V5Q29kZUNvbnZlcnRlcigoa2V5Q29kZTogbnVtYmVyKSA9PiBTdHJpbmcoa2V5Q29kZSAtIDQ4KSlcbiAgICAgICAgICAgIC5zZXRNYXhMZW5ndGgoNCk7XG4gICAgICAgIGlucHV0Lm9uKFwiZm9jdXNcIiwgdGhpcy51bmZvY3VzQWxsRXhjZXB0KGlucHV0KSk7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgdGhlIHRvcCBiYXIsIHdoaWNoIGNvbnRhaW5zIHRoZSB0d28gdGV4dCBpbnB1dHMgbmVjZXNzYXJ5IHRvXG4gICAgICogY2hhbmdlIHRoZSBib2FyZCBzaXplLCBhbmQgYSBidXR0b24gdG8gYXBwbHkgdGhlIGNoYW5nZTsgYXMgd2VsbCBhcyBhXG4gICAgICogbGFiZWwgdGhhdCBzaG93cyB0aGUgY3VycmVudCBzdGF0dXMuXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFRvcEJhcigpOiBQSVhJLkNvbnRhaW5lciB7XG4gICAgICAgIGxldCB3aWR0aElucHV0ID0gdGhpcy5zZXR1cFNpemVJbnB1dChTdHJpbmcodGhpcy5ib2FyZFdpZHRoKSk7XG4gICAgICAgIGxldCBoZWlnaHRJbnB1dCA9IHRoaXMuc2V0dXBTaXplSW5wdXQoU3RyaW5nKHRoaXMuYm9hcmRIZWlnaHQpKTtcblxuICAgICAgICBsZXQgaHN0YWNrID0gbmV3IFBJWElIU3RhY2soe3NlcGFyYXRpb246IDEwfSk7XG4gICAgICAgIGhzdGFjay5hZGRDaGlsZCh3aWR0aElucHV0KTtcbiAgICAgICAgaHN0YWNrLmFkZENoaWxkKG5ldyBQSVhJLlRleHQoXG4gICAgICAgICAgICBcInhcIiwge2ZvbnRGYW1pbHk6IFwiQXJpYWxcIiwgZm9udFNpemU6IDE4LCBmaWxsOiAweGZmZmZmZn0pKTtcbiAgICAgICAgaHN0YWNrLmFkZENoaWxkKGhlaWdodElucHV0KTtcbiAgICAgICAgaHN0YWNrLmFkZENoaWxkKG5ldyBQSVhJQnV0dG9uKFxuICAgICAgICAgICAgXCJDaGFuZ2UgQm9hcmQgU2l6ZVwiLCAxNDAsIDMwLCBCdXR0b25TdHlsZXMuU1VDQ0VTUykub25DbGljayhcbiAgICAgICAgICAgICgpID0+IHRoaXMuaGFuZGxlQm9hcmRSZXNpemUoXG4gICAgICAgICAgICAgICAgd2lkdGhJbnB1dC5nZXRUZXh0KCksIGhlaWdodElucHV0LmdldFRleHQoKSkpKTtcbiAgICAgICAgaHN0YWNrLmFkZENoaWxkKHRoaXMuc3RhdHVzTGFiZWwgPSBuZXcgUElYSS5UZXh0KFxuICAgICAgICAgICAgXCJTZWFyY2hpbmcuLi5cIiwge2ZpbGw6IEJ1dHRvblN0eWxlcy5XQVJOSU5HLmNvbG9ycy5ub3JtYWx9KSk7XG4gICAgICAgIHJldHVybiBoc3RhY2s7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgdGV4dCBkaXNwbGF5ZWQgb24gdGhlIHN0YXR1cyBsYWJlbC5cbiAgICAgKi9cbiAgICBwcml2YXRlIHNldFN0YXR1cyhuZXdTdGF0dXM6IHN0cmluZykge1xuICAgICAgICB0aGlzLnN0YXR1c0xhYmVsLnRleHQgPSBuZXdTdGF0dXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYXJzIHRoZSBib2FyZCBjb250YWluZXIgYW5kIGF0dGFjaGVzIGEgbmV3bHkgcmVuZGVyZWQgYm9hcmQuXG4gICAgICovXG4gICAgcHJpdmF0ZSByZXJlbmRlckJvYXJkKCkge1xuICAgICAgICBsZXQgYm9hcmRDb250YWluZXJCb3VuZHMgPSB0aGlzLmJvYXJkQ29udGFpbmVyLmdldEJvdW5kcygpO1xuICAgICAgICB0aGlzLmJvYXJkQ29udGFpbmVyLnJlbW92ZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuYm9hcmRSZW5kZXJlci5jbGVhclJlbmRlcmVkKCk7XG4gICAgICAgIHRoaXMuYm9hcmRDb250YWluZXIuYWRkQ2hpbGQodGhpcy5ib2FyZFJlbmRlcmVyLnJlbmRlcihcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIud2lkdGggLSBib2FyZENvbnRhaW5lckJvdW5kcy5sZWZ0LFxuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5oZWlnaHQgLSBib2FyZENvbnRhaW5lckJvdW5kcy50b3ApKTtcbiAgICAgICAgaWYgKHRoaXMuY2hlY2tlciAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmJvYXJkQ29udGFpbmVyLmFkZENoaWxkKHRoaXMuY2hlY2tlclJlbmRlcmVyLnJlbmRlcihcbiAgICAgICAgICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIuZ2V0U3F1YXJlU2l6ZSgpKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIHNtYWxsIGhlbHBlciBmdW5jdGlvbiwgd2hpY2ggd2lsbCByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgZW1pdCB0aGVcbiAgICAgKiAndW5mb2N1cycgZXZlbnQgdG8gYWxsIG9iamVjdHMgaW4gdGhlIHNjZW5lIGdyYXBoIGV4Y2VwdCB0aGUgb2JqZWN0XG4gICAgICogcGFzc2VkIHRvIHRoaXMgZnVuY3Rpb24uXG4gICAgICogVGhpcyBpcyB1c2VmdWwgZm9yIGNvbnRyb2xsaW5nIHdoaWNoIHRleHQgaW5wdXQgaXMgZm9jdXNlZC5cbiAgICAgKi9cbiAgICBwcml2YXRlIHVuZm9jdXNBbGxFeGNlcHQoY29udHJvbDogUElYSS5EaXNwbGF5T2JqZWN0KSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7ICAvLyBBcnJvdyBmdW5jdGlvbiB0byBjYXB0dXJlIHRoaXMuXG4gICAgICAgICAgICBsZXQgc3RhY2s6IFBJWEkuRGlzcGxheU9iamVjdFtdID0gW3RoaXMuc3RhZ2VdO1xuICAgICAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgY29udGFpbmVyID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lciAhPT0gY29udHJvbCkge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuZW1pdChcInVuZm9jdXNcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIgaW5zdGFuY2VvZiBQSVhJLkNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgY2hpbGQgb2YgY29udGFpbmVyLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkLiBUaGlzIG1ldGhvZCByZXNpemVzIHRoZSByZW5kZXJlcixcbiAgICAgKiByZXJlbmRlcnMgdGhlIGJvYXJkIGFuZCB1cGRhdGVzIHRoZSBjaGVja2VyLlxuICAgICAqL1xuICAgIHByaXZhdGUgaGFuZGxlV2luZG93UmVzaXplKG5ld1dpZHRoOiBudW1iZXIsIG5ld0hlaWdodDogbnVtYmVyKSB7XG4gICAgICAgIGxldCBvbGRWaWV3ID0gdGhpcy5yZW5kZXJlci52aWV3O1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlc2l6ZShuZXdXaWR0aCwgbmV3SGVpZ2h0KTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci52aWV3LndpZHRoID0gbmV3V2lkdGg7XG4gICAgICAgIHRoaXMucmVuZGVyZXIudmlldy5oZWlnaHQgPSBuZXdIZWlnaHQ7XG4gICAgICAgIHRoaXMucmVyZW5kZXJCb2FyZCgpO1xuICAgICAgICBpZiAodGhpcy5jaGVja2VyUmVuZGVyZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyUmVuZGVyZXIuc2V0U3F1YXJlU2l6ZShcbiAgICAgICAgICAgICAgICB0aGlzLmJvYXJkUmVuZGVyZXIuZ2V0U3F1YXJlU2l6ZSgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSB1c2VyIHdhbnRzIHRvIGNoYW5nZSB0aGUgYm9hcmQgc2l6ZS4gRGlyZWN0bHkgdGFrZXNcbiAgICAgKiBzdHJpbmdzIHRoYXQgd2lsbCByZXByZXNlbnQgdGhlIG5ldyBib2FyZCB3aWR0aCBhbmQgaGVpZ2h0LlxuICAgICAqIElmIGVpdGhlciB2YWx1ZSBpcyBlbXB0eSBvciBudWxsLCB0aGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcuXG4gICAgICovXG4gICAgcHJpdmF0ZSBoYW5kbGVCb2FyZFJlc2l6ZSh3aWR0aFN0cjogc3RyaW5nLCBoZWlnaHRTdHI6IHN0cmluZykge1xuICAgICAgICBpZiAod2lkdGhTdHIgIT0gbnVsbCAmJiB3aWR0aFN0ci5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICBoZWlnaHRTdHIgIT0gbnVsbCAmJiBoZWlnaHRTdHIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IHdpZHRoID0gcGFyc2VJbnQod2lkdGhTdHIsIDEwKTtcbiAgICAgICAgICAgIGxldCBoZWlnaHQgPSBwYXJzZUludChoZWlnaHRTdHIsIDEwKTtcbiAgICAgICAgICAgIGlmICh3aWR0aCA+IDAgJiYgaGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRXaWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmRIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVOZXdCb2FyZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFVucGF1c2VzIHRoZSBnYW1lLiAqL1xuICAgIHByaXZhdGUgaGFuZGxlU3RhcnRHYW1lKCkge1xuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKiBQYXVzZXMgdGhlIGdhbWUuICovXG4gICAgcHJpdmF0ZSBoYW5kbGVTdG9wR2FtZSgpIHtcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNldFN0YXR1cyhcIlBhdXNlZFwiKTtcbiAgICB9XG5cbiAgICAvKiogUmVzZXRzIHRoZSBnYW1lIGJ5IHNwaW5uaW5nIHRoZSBhcnJvd3MgYW5kIHJlc2V0dGluZyB0aGUgY2hlY2tlci4gKi9cbiAgICBwcml2YXRlIGhhbmRsZVJlc2V0R2FtZSgpIHtcbiAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jcmVhdGVOZXdCb2FyZCgpO1xuICAgIH1cblxuICAgIC8qKiBTaHVmZmxlcyB0aGUgYXJyb3dzIHdpdGhvdXQgbW92aW5nIHRoZSBjaGVja2VyLiAqL1xuICAgIHByaXZhdGUgaGFuZGxlU2h1ZmZsZUFycm93cygpIHtcbiAgICAgICAgaWYgKHRoaXMuY2hlY2tlckNvbnRyb2xsZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jaGVja2VyQ29udHJvbGxlci5yZXNldCh0aGlzLnVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJvYXJkQ29udHJvbGxlci5pbml0aWF0ZVJvdGF0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqIFRvZ2dsZXMgd2hldGhlciB0aGUgY29uc3RhbnQgbWVtb3J5IGFsZ29yaXRobSBzaG91bGQgYmUgdXNlZC4gKi9cbiAgICBwcml2YXRlIGhhbmRsZVRvZ2dsZUFsZ29yaXRobSgpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLnVzZUNvbnN0TWVtb3J5QWxnb3JpdGhtID0gIXRoaXMudXNlQ29uc3RNZW1vcnlBbGdvcml0aG07XG4gICAgICAgIGlmICh0aGlzLmNoZWNrZXJDb250cm9sbGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlckNvbnRyb2xsZXIucmVzZXQodGhpcy51c2VDb25zdE1lbW9yeUFsZ29yaXRobSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxnb3JpdGhtQnV0dG9uTGFiZWwoKTtcbiAgICB9XG59XG4iXX0=
