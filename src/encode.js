/**
 * @param {number} v
 * @param {number=} n
 * @return {!Array<number>}
 */
const toBits = (v, n = 8) => [...Array(n)].map((_, i) => (v >> (n - i - 1)) & 1)

/**
 * @param {string} data
 * @return {!message}
 */
function encode(data) {
  let bits = data.split('').flatMap((ch) => toBits(ch.charCodeAt(0)))
  let len = bits.length / 8

  return (len < 256 ? [16, 8] : [16]).map((n) => [
    0,
    1,
    0,
    0,
    ...toBits(len, n),
    ...bits,
  ])
}

/**
 * @typedef {!Array<!Array<number>>}
 */
let /** @const */ message
