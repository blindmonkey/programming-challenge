import { PIXIRect } from "../renderable/shapes/pixi-rect";
import { Board } from "./board";

import { CoordUtils } from "../util/coord-utils";

/**
 * A renderable that can be updated from a model of type T.
 */
export type UpdatableRenderable<T> = {
    container: PIXI.Container,
    update: (T) => void,
};

/**
 * An abstract class that mostly knows how to render `Board`s. It's expected
 * that a subclass will override `renderSquare` to complete the implementation.
 */
export abstract class BoardRenderer<T> {
    private board: Board<T>;
    private squareSize: number;
    private clickHandlers: Array<(x: number, y: number) => void>;
    // If a board has been rendered, this property contains the top-level
    // container of that rendering.
    private rendered: PIXI.Container;
    // An array of rendered children, which can be updated on demand.
    private renderedChildren: Array<UpdatableRenderable<T>>;

    constructor(board: Board<T>) {
        this.board = board;
        this.renderedChildren = [];
        this.clickHandlers = [];
    }

    /** Returns the size of a single square. */
    public getSquareSize() { return this.squareSize; }

    /** Registers a click event. */
    public onClick(handler: (x: number, y: number) => void) {
        this.clickHandlers.push(handler);
    }

    /**
     * Updates the rendered graphic of a single square and returns the top-level
     * container.
     */
    public update(x: number, y: number): PIXI.Container {
        let squareSize = this.squareSize;
        let index = CoordUtils.coordToIndex(
            x, y, this.board.getWidth(), this.board.getHeight());

        let cached = this.renderedChildren[index];
        if (cached == null || cached.container == null) {
            // Nothing exists in the cache, so we have to render it now.
            let squareContainer = new PIXI.Container();
            // Render a black or white square.
            let squareRect = new PIXIRect(squareSize, squareSize, {
                cornerRadius: 0,
                fillColor: x % 2 === y % 2 ? 0x000000 : 0xffffff});
            squareContainer.addChild(squareRect);

            // Render the actual square graphic.
            let update = null;
            let renderedSquare = this.renderSquare(
                this.board.get(x, y), squareSize);
            if (renderedSquare != null) {
                // If something was rendered, map the update method and add the
                // container to our square's container.
                squareContainer.addChild(renderedSquare.container);
                update = renderedSquare.update;
            } else {
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
        } else {
            // If rendered square already exists, update it.
            cached.update(this.board.get(x, y));
        }
        this.renderedChildren[index] = cached;
        return cached.container;
    }

    /** Updates all the squares on the board. */
    public updateAll() {
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
    public clearRendered() {
        this.rendered = null;
        this.renderedChildren = [];
        this.squareSize = null;
    }

    /**
     * Renders the board into a view of the given size.
     */
    public render(viewWidth: number, viewHeight: number): PIXI.Container {
        if (this.rendered == null) {
            let board = this.board;
            let container = new PIXI.Container();
            this.rendered = container;
            let boardWidth = board.getWidth();
            let boardHeight = board.getHeight();
            let squareSize = Math.floor(Math.min(viewWidth / boardWidth,
                                                 viewHeight / boardHeight));
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

    /**
     * Render a given square and returns an UpdatableRenderer.
     */
    protected abstract renderSquare(square: T, squareSize: number):
        UpdatableRenderable<T>;
};
