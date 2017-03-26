import { PIXIRect } from '../shapes/pixi-rect';
import { ButtonStateHandler } from './button-state-handler';


/**
 * Represents the styling information that can be passed to a PIXIButton.
 */
export type PIXIButtonStyle = {
    text?: PIXI.TextStyleOptions,
    border?: {
        width?: number,
        colors?: {
            down?: number,
            hovered?: number,
            normal?: number
        }
    },
    colors?: {
        down?: number,
        hovered?: number,
        normal?: number
    }
};


let accessOrDefault = function(
        obj: Object, path: string[], defaultValue?: any) {
    for (let i = 0; i < path.length; i++) {
        obj = obj[path[i]];
        if (obj == null) return defaultValue;
    }
    return obj;
};


/**
 * A button component that can be added to a scene and will fire an event when
 * clicked.
 */
export class PIXIButton extends PIXI.Container {
    private label: string;
    private clickHandlers: (() => void)[];
    private padding: number;

    private text: PIXI.Text;
    private outline: PIXIRect;
    private style: PIXIButtonStyle;

    private buttonWidth: number;
    private buttonHeight: number;

    constructor(label: string, width: number, height: number,
                style: PIXIButtonStyle = null) {
        super();
        this.buttonWidth = width;
        this.buttonHeight = height;
        this.style = style;

        let cornerRadius = 4;
        this.padding = 5;
        this.label = label;
        this.clickHandlers = [];

        let downFillColor = accessOrDefault(
            style, ['colors', 'down'], 0x00AA00);
        let normalFillColor = accessOrDefault(
            style, ['colors', 'normal'], 0x00FF00);
        let hoverFillColor = accessOrDefault(
            style, ['colors', 'hovered'], 0x66FF66);

        let downBorderColor = accessOrDefault(
            style, ['border', 'colors', 'down'], downFillColor);
        let normalBorderColor = accessOrDefault(
            style, ['border', 'colors', 'normal'], normalFillColor);
        let hoverBorderColor = accessOrDefault(
            style, ['border', 'colors', 'hovered'], hoverFillColor);

        this.outline = new PIXIRect(width, height, {
            cornerRadius: cornerRadius, fillColor: normalFillColor,
            strokeColor: normalBorderColor,
            lineWidth: style && style.border && style.border.width || 0});
        this.addChild(this.outline);

        this.text = this.renderText();
        this.addChild(this.text);

        new ButtonStateHandler(this)
            .whenNormal((() => this.outline.setColors({
                fill: normalFillColor, stroke: normalBorderColor})).bind(this))
            .whenHovered((() => this.outline.setColors({
                fill: hoverFillColor, stroke: hoverBorderColor})).bind(this))
            .whenDown((() => this.outline.setColors({
                fill: downFillColor, stroke: downBorderColor})).bind(this));
    }

    /** Renders and positions the text label of the button. */
    private renderText(label?: string): PIXI.Text {
        label = label != null ? label : this.label;
        if (this.text != null) {
            this.text.text = label;
        }
        let text = this.text || new PIXI.Text(
            label, this.style && this.style.text);
        text.position.x = Math.floor(this.buttonWidth / 2 - text.width / 2);
        text.position.y = Math.floor(this.buttonHeight / 2 - text.height / 2);
        return text;
    }

    /**
     * Sets the label of the button. This automatically refreshes the view. Keep
     * in mind that the text will not be wrapped.
     */
    setLabel(newText: string): PIXIButton {
        this.text = this.renderText(newText);
        return this;
    }

    /**
     * Register a handler for a click event. Equivalent to
     * `button.on('click', ...)`, but more convenient because it returns the
     * button.
     */
    onClick(handler: () => void): PIXIButton {
        this.on('click', handler);
        return this;
    }
}
