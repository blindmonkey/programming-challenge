import { ArrowSquareType } from '../arrows/arrows';
import { BoardRenderer, UpdatableRenderable } from '../board/board-renderer';
import { Board } from '../board/board';


/**
 * Represents a renderer for an `ArrowBoard`. The only real benefit here is that
 * it allows us to isolate the arrow rendering function, and not couple it to
 * the board. Otherwise, we'd either have to code the `BoardRenderer` to support
 * arrows, or pass it renderSquare as a function.
 */
export class ArrowBoardRenderer extends BoardRenderer<ArrowSquareType> {
    constructor(board: Board<ArrowSquareType>) {
        super(board);
    }

    /**
     * This method contains the logic for rendering an arrow within a square.
     */
    renderSquare(square: ArrowSquareType, size: number):
            UpdatableRenderable<ArrowSquareType> {
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
            graphics.moveTo(-arrowSize/2, -arrowWidth/2);
            graphics.lineTo(arrowStemLengthFromMid, -arrowWidth/2);
            graphics.lineTo(arrowStemLengthFromMid, -arrowTipWidth/2);
            graphics.lineTo(arrowSize/2, 0);
            graphics.lineTo(arrowStemLengthFromMid, arrowTipWidth/2);
            graphics.lineTo(arrowStemLengthFromMid, arrowWidth/2);
            graphics.lineTo(-arrowSize/2, arrowWidth/2)
            graphics.position.x = size / 2;
            graphics.position.y = size / 2;
            // The only control anyone has over the arrows from the model is
            // their rotation amount, so we allow updating that part.
            update = (square: ArrowSquareType) => (
                graphics.rotation = Math.PI / 2 * square.angle)
            // Do the initial rotation assignment to match current square data.
            update(square);
        }
        return {
            container: container,
            update: update || (() => null)
        };
    }
}
