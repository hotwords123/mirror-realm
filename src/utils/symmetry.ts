export type SymmetryMode =
  | 'left-to-right'
  | 'right-to-left'
  | 'top-to-bottom'
  | 'bottom-to-top'
  | 'tl-to-all'
  | 'tr-to-all'
  | 'bl-to-all'
  | 'br-to-all'

export interface MirrorOp {
  x: number // Destination X (normalized 0-1)
  y: number // Destination Y (normalized 0-1)
  scaleX: number
  scaleY: number
}

export interface SymmetryDefinition {
  center: { x: number; y: number } // Center of source area for hit testing
  source: { x: number; y: number; w: number; h: number } // Source area rect
  mirrors: MirrorOp[] // List of reflection operations
}

type MirrorAxis = 'x' | 'y' | 'xy'

function defineSymmetry(
  source: { x: number; y: number; w: number; h: number },
  axes: MirrorAxis[],
): SymmetryDefinition {
  return {
    center: {
      x: source.x + source.w / 2,
      y: source.y + source.h / 2,
    },
    source,
    mirrors: axes.map((axis) => {
      const flipX = axis.includes('x')
      const flipY = axis.includes('y')
      return {
        x: flipX ? 1 - (source.x + source.w) : source.x,
        y: flipY ? 1 - (source.y + source.h) : source.y,
        scaleX: flipX ? -1 : 1,
        scaleY: flipY ? -1 : 1,
      }
    }),
  }
}

export const SYMMETRY_CONFIG: Record<SymmetryMode, SymmetryDefinition> = {
  'left-to-right': defineSymmetry({ x: 0, y: 0, w: 0.5, h: 1 }, ['x']),
  'right-to-left': defineSymmetry({ x: 0.5, y: 0, w: 0.5, h: 1 }, ['x']),
  'top-to-bottom': defineSymmetry({ x: 0, y: 0, w: 1, h: 0.5 }, ['y']),
  'bottom-to-top': defineSymmetry({ x: 0, y: 0.5, w: 1, h: 0.5 }, ['y']),
  'tl-to-all': defineSymmetry({ x: 0, y: 0, w: 0.5, h: 0.5 }, ['x', 'y', 'xy']),
  'tr-to-all': defineSymmetry({ x: 0.5, y: 0, w: 0.5, h: 0.5 }, ['x', 'y', 'xy']),
  'bl-to-all': defineSymmetry({ x: 0, y: 0.5, w: 0.5, h: 0.5 }, ['x', 'y', 'xy']),
  'br-to-all': defineSymmetry({ x: 0.5, y: 0.5, w: 0.5, h: 0.5 }, ['x', 'y', 'xy']),
}
