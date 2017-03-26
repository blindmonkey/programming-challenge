// This file contains some button colors and other style properties that look
// fairly decent. These button styles were borrowed from the Bootstrap default
// configuration.

// Colors of the button backgrounds, depending on the state of the button.
export const ButtonColors = {
    SUCCESS: {normal: 0x5CB85C, hovered: 0x449D44, down: 0x398439},
    DANGER: {normal: 0xd9534f, hovered: 0xc9302c, down: 0xac2925},
    WARNING: {normal: 0xf0ad4e, hovered: 0xec971f, down: 0xd58512}
};

// Colors of the button borders, depending on the state of the button.
export const ButtonBorderColors = {
    SUCCESS: {normal: 0x4cae4c, hovered: 0x398439, down: 0x255625},
    DANGER: {normal: 0xd43f3a, hovered: 0xac2925, down: 0x761c19},
    WARNING: {normal: 0xeea236, hovered: 0xd58512, down: 0x985f0d}
};

// A text style that is convenient to use for the buttons.
export const ButtonTextStyle = {
    fontFamily: 'Helvetica Neue',
    fontSize: 14,
    fill: 0xFFFFFF
};

// Common button style configuration that can be passed directly to a
// PIXIButton.
export const ButtonStyles = {
    SUCCESS: {text: ButtonTextStyle, colors: ButtonColors.SUCCESS,
              border: {width: 1, colors: ButtonBorderColors.SUCCESS}},
    DANGER: {text: ButtonTextStyle, colors: ButtonColors.DANGER,
             border: {width: 1, colors: ButtonBorderColors.DANGER}},
    WARNING: {text: ButtonTextStyle, colors: ButtonColors.WARNING,
              border: {width: 1, colors: ButtonBorderColors.WARNING}}
};

// oppa button style
