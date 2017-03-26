import { CoordUtils } from "../util/coord-utils";

export type BoardSquareInitializer<T> = (x: number, y: number) => T;

/**
 * This class represents a board of `width`x`height` dimensions. The type of
 * things contained on the board is of the parameter `T`.
 */
export class Board<T> {
    private width: number;
    private height: number;
    private board: T[];

    constructor(width: number, height: number,
                initializer: BoardSquareInitializer<T> = null) {
        this.width = width;
        this.height = height;
        this.board = this.initializeBoardArray(width, height, initializer);
    }

    /**
     * Initializes an array that can internally be used for a board. Optionally
     * takes an initializer. If one is not specified, all squares are
     * initialized to null.
     */
    private initializeBoardArray(
            width: number, height: number,
            initializer: BoardSquareInitializer<T> = null) {
        let boardArray: T[] = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                boardArray.push(initializer != null ? initializer(x, y) : null);
            }
        }
        return boardArray;
    }

    /** Returns the width of the board. */
    getWidth()  { return this.width; }
    /** Returns the height of the board. */
    getHeight() { return this.height; }

    /**
     * Iterates over all coordinates, calls the given function, and updates the
     * board with the result.
     * TODO: Could be extended to optionally return a new board.
     */
    map(f: (value: T, x: number, y: number) => T): Board<T> {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let oldValue: T = this.get(x, y);
                let newValue: T = f(oldValue, x, y);
                this.put(newValue, x, y);
            }
        }
        return this;
    }

    /** Puts a value into the square at the given coordinate. */
    put(value: T, x: number, y: number) {
        let index = CoordUtils.coordToIndex(x, y, this.width, this.height);
        this.board[index] = value;
    }

    /** Gets the square at the given coordinate. */
    get(x: number, y: number) {
        let index = CoordUtils.coordToIndex(
            x, y, this.width, this.height, false);
        if (index == null) return null;
        return this.board[index];
    }
}
