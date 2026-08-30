import { createCanvas, Canvas } from '@napi-rs/canvas';

/**
 * A custom Canvas factory compatible with pdfjs-dist.
 * It uses @napi-rs/canvas to provide a robust Canvas 2D implementation
 * in the Node.js environment, avoiding the strict fillRule crashes
 * present in other libraries like skia-canvas.
 */
export class NodeCanvasFactory {
  create(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid canvas size: ${width}x${height}`);
    }
    const canvas = createCanvas(width, height);
    const rawContext = canvas.getContext('2d');
    
    // PDF.js often passes `undefined` as the fillRule to `fill` or `clip`.
    // We proxy the context to coerce `undefined` to 'nonzero' to satisfy strict implementations.
    const context = new Proxy(rawContext, {
      get(target: any, prop: string) {
        const val = target[prop];
        if (typeof val === 'function') {
          if (prop === 'fill' || prop === 'clip') {
            return function (...args: any[]) {
              // Ensure we don't mess up Path2D args (which are supported)
              // If the last argument is undefined, we force it to 'nonzero'
              if (args.length === 1 && args[0] === undefined) {
                args[0] = 'nonzero';
              } else if (args.length === 2 && args[1] === undefined) {
                args[1] = 'nonzero';
              } else if (args.length === 0) {
                args.push('nonzero');
              }
              return val.apply(target, args);
            };
          }
          return val.bind(target);
        }
        return val;
      },
      set(target: any, prop: string, value: any) {
        target[prop] = value;
        return true;
      }
    });

    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    if (!canvasAndContext.canvas) {
      throw new Error('Canvas is not specified');
    }
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid canvas size: ${width}x${height}`);
    }
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: any) {
    if (!canvasAndContext.canvas) {
      throw new Error('Canvas is not specified');
    }
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}
