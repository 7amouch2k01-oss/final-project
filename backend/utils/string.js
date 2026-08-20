/**
 * Escapes characters that have special meaning in regular expressions
 * to prevent Regular Expression Injection and ReDoS attacks.
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 */
const escapeRegExp = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

module.exports = { escapeRegExp };
