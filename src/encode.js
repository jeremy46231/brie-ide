/**
 * @param {number} v
 * @param {number=} n
 * @return {!Array<number>}
 */
let toBits = (v, n = 8) => [...Array(n)].map((_, i) => (v >> (n - i - 1)) & 1)

let numberToBits = (num, bits) =>
  num.toString(2).padStart(bits, 0).split``.map((n) => +n)

/**
 * @param {string} data
 * @return {!message}
 */
function encode(data) {
  let parts = data.match('(.*#)(\\d+)')
  if (parts)
    return [
      [
        ...encode(parts[1])[0],
        0,
        0,
        0,
        1,
        ...numberToBits(parts[2].length, 14),
        ...parts[2].matchAll`.{1,3}`
          .flatMap(([c]) =>
            numberToBits(+c, c.length > 2 ? 10 : c.length > 1 ? 7 : 4)
          )
          .map((n) => +n),
      ],
    ]

  let bits = data.split``.flatMap((ch) => toBits(ch.charCodeAt(0)))
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
let /** @let */ message
