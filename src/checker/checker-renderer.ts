import { Checker } from "./checker";

/**
 * A class that is capable of rendering a checker on its board. It is expected
 * that the squareSize is passed to the render function.
 * To change the square size after the fact, `setSquareSize` may be used, and
 * the position and size of the checker will be immediately updated.
 */
export class CheckerRenderer {
    private checker: Checker;

    // Render properties
    private rendered: PIXI.Container;
    private squareSize: number;

    constructor(checker: Checker) {
        this.checker = checker;
        this.rendered = null;
    }

    /** Sets the square size of the board this checker is on. */
    setSquareSize(newSquareSize: number) {
        this.squareSize = newSquareSize;
        this.rerender();
    }

    /**
     * If this renderer has rendered the checker, this will return the top-level
     * PIXI container that has it. Otherwise, it will return null.
     */
    getRendered(): PIXI.Container { return this.rendered; }

    /**
     * Builds the path used to represent the checker and positions it in the
     * middle of its container, which should be of size `squareSize`.
     */
    private buildGraphics() {
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
            g.drawCircle(halfSquareSize, halfSquareSize,
                         (radius - innerRing) * (rings - ring) / rings + innerRing);
        }
        return g;
    }

    /**
     * Clears everything from the rendered container, and rerenders the
     * graphics.
     */
    private rerender() {
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
    render(squareSize: number): PIXI.Container {
        if (this.rendered == null) {
            this.squareSize = squareSize;
            this.rendered = new PIXI.Container();
            this.rendered.addChild(this.buildGraphics());
            this.update();
        }
        return this.rendered;
    }
}
