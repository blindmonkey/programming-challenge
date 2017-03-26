import { ArrowSquareType } from "../arrows/arrows";
import { Board } from "../board/board";
import { Checker } from "./checker";

import { Audio, Sounds } from "../util/audio";

/**
 * A class that controls the movement of the `Checker`. Essentially, this is the
 * class that implement the logic of the cycle-detecting algorithm.
 */
export class CheckerController {
    private board: Board<ArrowSquareType>;
    private checker: Checker;

    // Algorithm properties
    // Whether we should run the constant memory algorithm.
    private constantMemory: boolean;
    // Whether we have detected a cycle.
    private detectedCycle: boolean;
    // Whether we have detected that we went off edge.
    private detectedOffEdge: boolean;
    // For the non-constant memory algorithm, keeps track of squares that this
    // checker has been on.
    private visited: {[key: string]: boolean};
    // The "hare" of Floyd's algorithm. A point that moves twice as fast across
    // the board as the checker (which makes the checker the tortoise). If the
    // hare and turtle ever end up on the same spot, there is a cycle.
    private hare: {x: number, y: number};

    constructor(board: Board<ArrowSquareType>,
                checker: Checker,
                constantMemory: boolean = false) {
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
    reset(constantMemory: boolean = false) {
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
    private move(dx: number, dy: number) {
        let position = this.checker.getPosition();
        let nx = position.x + dx,
            ny = position.y + dy;
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
        } else {
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
                let hareSquareDirection = this.getDirectionOfBoardSquare(
                    this.hare.x, this.hare.y);
                if (hareSquareDirection == null) {
                    this.detectedOffEdge = true;
                    break;
                } else {
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
            Audio.play(Sounds.PLOP);
            this.checker.setPosition(nx, ny);
            this.checker.setOffset(-dx, -dy);
        } else {
            this.detectedOffEdge = true;
        }
    }

    /**
     * Modifies the offset such that it approaches 0, which makes it appear like
     * the `Checker` is moving towards its position.
     *
     * Returns true when the checker has stopped moving.
     */
    private animateTowardsPosition(): boolean {
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
    private getDirectionOfBoardSquare(x: number, y: number) {
        let square: ArrowSquareType = this.board.get(x, y);
        if (square != null) {
            let angle = Math.round(square.angle) % 4;
            if (angle < 0) angle += 4;
            let movements = [{x: 1}, {y: 1}, {x: -1}, {y: -1}];
            let movement = movements[angle];
            return {dx: movement["x"] || 0,
                    dy: movement["y"] || 0};
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
            let squareDirection = this.getDirectionOfBoardSquare(
                position.x, position.y);
            if (squareDirection != null) {
                this.move(squareDirection.dx, squareDirection.dy);
            }
        }
    }
}
