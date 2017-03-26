import PIXI = require('pixi.js');

import { ArrowSquareType } from './arrows/arrows';
import { ArrowBoardRenderer } from './arrows/arrow-board-renderer';
import { ArrowBoardController } from './arrows/arrow-board-controller';
import { Board, BoardSquareInitializer } from './board/board';
import { Checker } from './checker/checker';
import { CheckerController } from './checker/checker-controller';
import { CheckerRenderer } from './checker/checker-renderer';

// Custom PIXI controls/styling
import { ButtonStyles } from './renderable/widgets/button-style';
import { PIXIButton } from './renderable/widgets/pixi-button';
import { PIXITextInput } from './renderable/widgets/pixi-text-input';
import { PIXIHStack, PIXIVStack } from './renderable/widgets/pixi-stack';

import { Audio, Sounds } from './util/audio';


/**
 * Represents the world, or the app. This class has top-level control over all
 * functionality of the app. It builds the UI and ties it to actual
 * functionality.
 */
export class World {
    private renderer: PIXI.WebGLRenderer;
    private stage: PIXI.Container;

    private mainStack: PIXI.Container;
    private leftMenu: PIXI.Container;
    private rightSide: PIXI.Container;
    private topBar: PIXI.Container;
    private boardContainer: PIXI.Container;
    private statusLabel: PIXI.Text;

    private useConstMemoryAlgorithm: boolean;

    // Game state
    private paused: boolean;
    private boardWidth: number;
    private boardHeight: number;

    private board: Board<ArrowSquareType>;
    private boardController: ArrowBoardController;
    private boardRenderer: ArrowBoardRenderer;

    private checker: Checker;
    private checkerRenderer: CheckerRenderer;
    private checkerController: CheckerController;

    constructor() {
        this.boardWidth = 10;
        this.boardHeight = 10;

        this.useConstMemoryAlgorithm = false;

        this.renderer = this.initializeRenderer();
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();

        this.leftMenu = this.buildLeftMenu();
        this.rightSide = this.buildRightSide();

        this.mainStack = new PIXIHStack({padding: 10, separation: 10});
        this.stage.addChild(this.mainStack);
        this.mainStack.addChild(this.leftMenu);
        this.mainStack.addChild(this.rightSide);

        this.createNewBoard();

        window.addEventListener('resize', () => this.handleWindowResize(
            window.innerWidth, window.innerHeight));
        this.handleWindowResize(window.innerWidth, window.innerHeight);
    }

    /**
     * A small helper function that allows us to easily initialize an arrow
     * board where all the arrows are pointing in a random direction.
     */
    private arrowSquareInitializer(x: number, y: number) {
        let velocityBase = (Math.random() - .5) / 2;
        let velocitySign = velocityBase >= 0 ? 1 : -1;
        return {
            angle: Math.floor(Math.random() * 4),
            velocity: velocityBase + velocitySign * 0.2
        };
    };

    /**
     * Initializes a PIXI renderer and returns it.
     */
    private initializeRenderer() {
        const renderer: PIXI.WebGLRenderer = new PIXI.WebGLRenderer(1280, 720);
        // For the MacBooks with retina displays, 4 is a good number here.
        // I'd guess that 2 would be a good number for non-retina displays.
        renderer.resolution = 4;
        return renderer;
    }

    /**
     * Based on the value of `useConstMemoryAlgorithm`, returns the label of a
     * button that would switch to the opposite/next mode.
     */
    private getAlgorithmButtonLabel() {
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
    private buildLeftMenu(): PIXI.Container {
        let buttonWidth = 190;
        let stack = new PIXIVStack({separation: 10});
        stack.addChild(
            new PIXIButton('Start', buttonWidth, 34, ButtonStyles.SUCCESS)
            .onClick(() => this.handleStartGame()));
        stack.addChild(
            new PIXIButton('Stop', buttonWidth, 34, ButtonStyles.WARNING)
            .onClick(() => {console.log('stop'); this.handleStopGame()}));
        stack.addChild(
            new PIXIButton('Reset', buttonWidth, 34, ButtonStyles.DANGER)
            .onClick(() => this.handleResetGame()));
        stack.addChild(
            new PIXIButton(
                'Shuffle Arrows', buttonWidth, 34, ButtonStyles.SUCCESS)
            .onClick(() => this.handleShuffleArrows()));

        let constantMemoryButton = new PIXIButton(
                this.getAlgorithmButtonLabel(), buttonWidth, 34,
                ButtonStyles.WARNING)
            .onClick(() => {
                console.log('click!');
                constantMemoryButton.setLabel(this.handleToggleAlgorithm());
            })
        stack.addChild(constantMemoryButton)
        return stack;
    }

    /**
     * Builds the right side of the UI which contains the top bar and the board.
     */
    private buildRightSide(): PIXI.Container {
        let container = new PIXIVStack({separation: 10});
        container.addChild(this.topBar = this.buildTopBar());
        container.addChild(this.boardContainer = new PIXI.Container());
        return container
    }

    /**
     * A helper method that sets up a text input for number entry.
     */
    private setupSizeInput(initialValue: string) : PIXITextInput {
        let input = new PIXITextInput(initialValue, 65, 30, {
                text: {fontSize: 15}, color: 0xFFFFFF,
                border: {width: 1, color: 0x888888}})
            .setKeyFilter((keyCode: number) => (keyCode >= 48 && keyCode < 58))
            .setKeyCodeConverter((keyCode: number) => String(keyCode - 48))
            .setMaxLength(4);
        input.on('focus', this.unfocusAllExcept(input));
        return input;
    }

    /**
     * Builds the top bar, which contains the two text inputs necessary to
     * change the board size, and a button to apply the change; as well as a
     * label that shows the current status.
     */
    private buildTopBar(): PIXI.Container {
        let widthInput = this.setupSizeInput(String(this.boardWidth));
        let heightInput = this.setupSizeInput(String(this.boardHeight));

        let hstack = new PIXIHStack({separation: 10});
        hstack.addChild(widthInput);
        hstack.addChild(new PIXI.Text(
            'x', {fontFamily: 'Arial', fontSize: 18, fill: 0xffffff}));
        hstack.addChild(heightInput);
        hstack.addChild(new PIXIButton(
            'Change Board Size', 140, 30, ButtonStyles.SUCCESS).onClick(
            () => this.handleBoardResize(
                widthInput.getText(), heightInput.getText())));
        hstack.addChild(this.statusLabel = new PIXI.Text(
            'Searching...', {fill: ButtonStyles.WARNING.colors.normal}))
        return hstack;
    }

    /**
     * Sets the text displayed on the status label.
     */
    private setStatus(newStatus: string) {
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
        this.board = new Board<ArrowSquareType>(
            this.boardWidth, this.boardHeight, this.arrowSquareInitializer);
        this.boardController = new ArrowBoardController(this.board);
        this.boardRenderer = new ArrowBoardRenderer(this.board);
        // Attach the new click handler, since we have a new renderer instance.
        this.boardRenderer.onClick((x: number, y: number) => {
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
    private rerenderBoard() {
        let boardContainerBounds = this.boardContainer.getBounds();
        this.boardContainer.removeChildren();
        this.boardRenderer.clearRendered();
        this.boardContainer.addChild(this.boardRenderer.render(
            this.renderer.width - boardContainerBounds.left,
            this.renderer.height - boardContainerBounds.top));
        if (this.checker != null) {
            this.boardContainer.addChild(this.checkerRenderer.render(
                this.boardRenderer.getSquareSize()));
        }
    }

    /**
     * A small helper function, which will return a function that will emit the
     * 'unfocus' event to all objects in the scene graph except the object
     * passed to this function.
     * This is useful for controlling which text input is focused.
     */
    private unfocusAllExcept(control: PIXI.DisplayObject) {
        return () => {  // Arrow function to capture this.
            let stack: PIXI.DisplayObject[] = [this.stage];
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
    private handleWindowResize(newWidth: number, newHeight: number) {
        let oldView = this.renderer.view;
        this.renderer.resize(newWidth, newHeight);
        this.renderer.view.width = newWidth;
        this.renderer.view.height = newHeight;
        this.rerenderBoard();
        if (this.checkerRenderer != null) {
            this.checkerRenderer.setSquareSize(
                this.boardRenderer.getSquareSize());
        }
    }

    /**
     * Called when the user wants to change the board size. Directly takes
     * strings that will represent the new board width and height.
     * If either value is empty or null, this method does nothing.
     */
    private handleBoardResize(widthStr: string, heightStr: string) {
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
    private handleStartGame() {
        this.paused = false;
    }

    /** Pauses the game. */
    private handleStopGame() {
        this.paused = true;
        this.setStatus('Paused');
    }

    /** Resets the game by spinning the arrows and resetting the checker. */
    private handleResetGame() {
        this.paused = false;
        this.createNewBoard();
    }

    /** Shuffles the arrows without moving the checker. */
    private handleShuffleArrows() {
        if (this.checkerController != null) {
            this.checkerController.reset(this.useConstMemoryAlgorithm);
        }
        this.boardController.initiateRotation();
    }

    /** Toggles whether the constant memory algorithm should be used. */
    private handleToggleAlgorithm(): string {
        console.log('handling...');
        this.useConstMemoryAlgorithm = !this.useConstMemoryAlgorithm;
        if (this.checkerController != null) {
            this.checkerController.reset(this.useConstMemoryAlgorithm);
        }
        return this.getAlgorithmButtonLabel();
    }

    /** Updates the world. */
    update() {
        if (this.paused) return;
        if (!this.boardController.update()) {
            // If are in this block, that means all arrows are done spinning.
            // In this case, we might either have to create a random checker or
            // update the existing one.
            if (this.checker == null) {
                this.boardRenderer.updateAll();
                // Generate a random position.
                let width = this.board.getWidth()
                let i = Math.floor(
                    Math.random() * width * this.board.getHeight());
                let x = i % width;
                let y = (i - x) / width;
                // Create our checker and associated objects.
                this.checker = new Checker(x, y);
                this.checkerController = new CheckerController(
                    this.board, this.checker, this.useConstMemoryAlgorithm);
                this.checkerRenderer = new CheckerRenderer(this.checker)
                // Render the checker on the board. This is convenient because
                // this way the checker will have the same offset as the board.
                this.boardContainer.addChild(this.checkerRenderer.render(
                    this.boardRenderer.getSquareSize()));
            } else {
                this.checkerController.update();
                this.checkerRenderer.update();
                if (this.checkerController.hasDetectedCycle()) {
                    this.setStatus('Detected cycle');
                } else if (this.checkerController.hasDetectedEdge()) {
                    this.setStatus('Detected edge');
                } else {
                    this.setStatus('Searching...');
                }
            }
        } else {
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
