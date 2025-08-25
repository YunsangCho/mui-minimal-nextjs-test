// ----------------------------------------------------------------------

export function varAlpha(color, opacity) {
  return color ? `rgba(${color}, ${opacity})` : '';
}

export function createPaletteChannel(palette) {
  const result = { ...palette };

  Object.keys(palette).forEach((key) => {
    const colorValue = palette[key];
    if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
      const hexToRgb = hexToRgbColor(colorValue);
      if (hexToRgb) {
        result[`${key}Channel`] = hexToRgb;
      }
    }
  });

  return result;
}

// ----------------------------------------------------------------------

function hexToRgbColor(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) {
    return '';
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
} 