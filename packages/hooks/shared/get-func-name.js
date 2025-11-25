// Minimal stub for chai dependency resolution in CI without external install.
function getFuncName(fn) {
  if (typeof fn !== 'function') return '';
  return fn.displayName || fn.name || '';
}

module.exports = getFuncName;
module.exports.default = getFuncName;
