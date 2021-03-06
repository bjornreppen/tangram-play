import tinycolor from 'tinycolor2';

const COLOR_VALUE_RANGES = {
  rgb: { r: [0, 255], g: [0, 255], b: [0, 255] },
};

export default class Color {
  constructor(color) {
    // Invalid colors (junk input or user is typing) are created as black by default
    // We need a way to distinguish what inputs were junk, so invalid colors
    // will be this.valid = false
    this.valid = true;

    const firstPass = this.processColor(color); // Catch a color written in vec format
    const secondPass = this.processTinyColor(firstPass); // Creates a tinycolor color object

    this.color = secondPass;
  }

  /**
   * Process a color that could be taken from a valid YAML scene file.
   * As such, we need to check for array notation and for hex written as a string
   *
   * @private
   * @param {string|Array} color - color to parse
   */
  processColor(color) {
    if (typeof color === 'string' || color instanceof String) {
      // If a hex color
      if (color.charAt(0) === '\'' && (color.charAt(color.length - 1) === '\'')) {
        return color.replace(/'/g, '');
      } else if ((color.charAt(0) === '[') && (color.charAt(color.length - 1) === ']')) {
        const vec = this.vecStringToVecObject(color);

        if (vec) {
          const rgb = this.vec2rgb(vec);
          return rgb;
        }

        // If it looks like a vec string but can't be parsed as one, it's not valid
        this.valid = false;
        return 'black';
      }
    } else if (Array.isArray(color)) {
      if (color.length >= 3) {
        const vec = {
          v: color[0],
          e: color[1],
          c: color[2],
          a: color[3] || 1.0,
        };
        const rgb = this.vec2rgb(vec);
        return rgb;
      }
    }

    // If a normal css color
    return color;
  }

  /**
   * Creates a tinycolor color object
   *
   * @private
   * @param {string} color - color to parse
   */
  processTinyColor(color) {
    // Tangram.js's color parsing library (css-color-parser-js) allows
    // spaces in color strings, with the following rationale:
    //     "Remove all whitespace, not compliant, but should just be
    //      more accepting."
    // (https://github.com/deanm/css-color-parser-js/blob/master/csscolorparser.js#L132)
    //
    // This means someone can author a working scene file with colors
    // like "light goldenrod yellow", and Tangram Play's color picker
    // must also support this now. See discussion:
    // https://github.com/tangrams/tangram-play/issues/519
    if (typeof color === 'string') {
      color = color.replace(/ /g, '');
    }

    let newColor = tinycolor(color);

    if (!newColor.isValid()) {
      this.valid = false;
      newColor = tinycolor('black');
    }

    return newColor;
  }

  /**
   * Converts a `vec` color object to an `rgb` object. Alpha values will be
   * passed through if provided, but they are optional.
   *
   * @private
   * @param {Object} vec - an object of shape {v, e, c, a}
   * @returns {Object} rgb - an object of shape {r, g, b, a}
   */
  vec2rgb(vec) {
    const rgb = {
      r: Number.parseFloat(vec.v) * COLOR_VALUE_RANGES.rgb.r[1],
      g: Number.parseFloat(vec.e) * COLOR_VALUE_RANGES.rgb.g[1],
      b: Number.parseFloat(vec.c) * COLOR_VALUE_RANGES.rgb.b[1],
    };

    // Alpha values are optional. Add it if present.
    if (vec.a) {
      rgb.a = Number.parseFloat(vec.a);
    }

    return rgb;
  }

  /**
   * Converts a string that looks like this: `[0.25, 0.25, 0.25, 1]` to a
   * `vec` object of shape {v, e, c, a}. Alpha values do not need to be provided
   * but if it is not, a default value of 1.0 is provided.
   *
   * @private
   * @param {string} vecString - a string that looks like `[0.25, 0.25, 0.25, 1]`
   * @returns {Object} vecObj - an object of shape {v, e, c, a}
   */
  vecStringToVecObject(vecString) {
    if ((vecString.charAt(0) === '[') && (vecString.charAt(vecString.length - 1) === ']')) {
      let str = vecString;
      str = str.replace('[', '');
      str = str.replace(']', '');
      str = str.split(',');

      if (str.length >= 3) {
        // Parse all values as floats. Unparseable values default to 0.
        // If an alpha is not provided, use 1.0 as default value.
        const vec = {
          v: Number.parseFloat(str[0]) || 0,
          e: Number.parseFloat(str[1]) || 0,
          c: Number.parseFloat(str[2]) || 0,
          a: str[3] ? Number.parseFloat(str[3]) || 0 : 1.0,
        };

        return vec;
      }
    }

    // The default response is `null` if vecString cannot be converted.
    return null;
  }

  /**
   * Converts an internally stored color object to an `vec` object
   *
   * @private
   * @returns {Object} vec - an object of shape {v, e, c}
   */
  rgb2vec() {
    return {
      v: this.color.toRgb().r / COLOR_VALUE_RANGES.rgb.r[1],
      e: this.color.toRgb().g / COLOR_VALUE_RANGES.rgb.g[1],
      c: this.color.toRgb().b / COLOR_VALUE_RANGES.rgb.b[1],
    };
  }

  // Returns rgba object { r , g , b , a }
  getRgba() {
    return this.color.toRgb();
  }

  // Returns rgba string "rgba(255, 0, 0, 0.5)"
  getRgbaString() {
    return this.color.toRgbString();
  }

  // Returns vec string "[0.x, 0.x , 0.x, 0.x]"
  getVecString() {
    const vecColor = this.rgb2vec();
    const v = vecColor.v.toFixed(3);
    const e = vecColor.e.toFixed(3);
    const c = vecColor.c.toFixed(3);
    const a = this.color.getAlpha().toFixed(2);
    return `[${v}, ${e}, ${c}, ${a}]`;
  }

  /**
   * Returns a color value as an array of strings, as in [v, e, c, a]
   * Reserved for future use: batch updating of arbitrary sequence formats
   */
  getVecArray() {
    const vecColor = this.rgb2vec();
    const v = vecColor.v.toFixed(3);
    const e = vecColor.e.toFixed(3);
    const c = vecColor.c.toFixed(3);
    const a = this.color.getAlpha().toFixed(2);
    return [v, e, c, a];
  }

  // For use within GLSL pickers and shader blocks
  // Returns vec string "[0.x, 0.x , 0.x]" No alpha.
  getVec3String() {
    const vecColor = this.rgb2vec();
    const v = vecColor.v.toFixed(3);
    const e = vecColor.e.toFixed(3);
    const c = vecColor.c.toFixed(3);
    return `vec3(${v}, ${e}, ${c})`;
  }

  // For use within GLSL pickers and shader blocks
  // Returns vec string "[0.x, 0.x , 0.x]" No alpha.
  getVec4String() {
    const vecColor = this.rgb2vec();
    const v = vecColor.v.toFixed(3);
    const e = vecColor.e.toFixed(3);
    const c = vecColor.c.toFixed(3);
    const a = this.color.getAlpha().toFixed(2);
    return `vec4(${v}, ${e}, ${c}, ${a})`;
  }

  // Returns hex string without '#'
  getHexString() {
    return this.color.toHexString().replace('#', '');
  }

  // { h: 0, s: 1, l: 0.5, a: 1 }
  getHsl() {
    return this.color.toHsl();
  }

  // { h: 0, s: 1, v: 1, a: 1 }
  getHsv() {
    return this.color.toHsv();
  }

  // Returns original input string
  getOriginalInput() {
    return this.color.getOriginalInput();
  }

  // Sets an alpha for the color
  setAlpha(alpha) {
    this.color.setAlpha(alpha);
  }
}
