// adjusted from https://github.com/behnammodi/polyfill/blob/master/window.polyfill.js

/**
 * window.requestIdleCallback()
 * Browser Compatibility:
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback#browser_compatibility
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options: IdleRequestOptions = {}
) {
  if (window.requestIdleCallback) {
    return window.requestIdleCallback(callback, options);
  }

  var relaxation = 1;
  var timeout = options.timeout || relaxation;
  var start = performance.now();
  return setTimeout(function () {
    callback({
      get didTimeout() {
        return options.timeout
          ? false
          : performance.now() - start - relaxation > timeout;
      },
      timeRemaining: function () {
        return Math.max(0, relaxation + (performance.now() - start));
      },
    });
  }, relaxation);
}

/**
 * window.cancelIdleCallback()
 * Browser Compatibility:
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelIdleCallback#browser_compatibility
 */
export function cancelIdleCallback(id: number) {
  if (window.cancelIdleCallback) {
    return window.cancelIdleCallback(id);
  }

  return clearTimeout(id);
}

/**
 * window.requestAnimationFrame()
 * Browser Compatibility:
 * https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#browser_compatibility
 */
export function requestAnimationFrame(callback: FrameRequestCallback) {
  if (window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }

  return window.setTimeout(function () {
    callback(Date.now());
  }, 1000 / 60);
}

/**
 * window.cancelAnimationFrame()
 * Browser Compatibility:
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame#browser_compatibility
 */
export function cancelAnimationFrame(handle: number) {
  if (window.cancelAnimationFrame) {
    return window.cancelAnimationFrame(handle);
  }

  return clearTimeout(handle);
}
