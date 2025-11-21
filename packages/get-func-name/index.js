function getFuncName(fn) {
  if (!fn) {
    return '';
  }

  if (typeof fn.displayName === 'string' && fn.displayName.length > 0) {
    return fn.displayName;
  }

  if (typeof fn.name === 'string' && fn.name.length > 0) {
    return fn.name;
  }

  return '';
}

module.exports = getFuncName;
module.exports.default = getFuncName;
