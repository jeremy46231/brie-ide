// Galois Field Math
/** @const {number} */
const GF256_BASE = 285

/** @const {!Array<number>} */
const EXP_TABLE = [1]

/** @const {!Array<number>} */
const LOG_TABLE: number[] = []

for (let i = 1; i < 256; i++) {
  let n = EXP_TABLE[i - 1] << 1
  if (n > 255) n = n ^ GF256_BASE
  EXP_TABLE[i] = n
}

for (let i = 0; i < 255; i++) {
  LOG_TABLE[EXP_TABLE[i]] = i
}

/**
 * @param {number} k
 * @return {number}
 */
function exp(k: number): number {
  while (k < 0) k += 255
  while (k > 255) k -= 255
  return EXP_TABLE[k]
}

/**
 * @param {number} k
 * @return {number}
 */
function log(k: number): number {
  if (k < 1 || k > 255) {
    throw Error('Bad log(' + k + ')')
  }
  return LOG_TABLE[k]
}

// Generator Polynomials
/** @const {!Array<!Array<number>>} */
let POLYNOMIALS = [[0]]

/**
 * @param {number} num
 * @return {!Array<number>}
 */
function generatorPolynomial(num: number): number[] {
  if (POLYNOMIALS[num]) {
    return POLYNOMIALS[num]
  }
  let prev = generatorPolynomial(num - 1)
  let res: number[] = []

  res[0] = prev[0]
  for (let i = 1; i <= num; i++) {
    res[i] = log(exp(prev[i]) ^ exp(prev[i - 1] + num - 1))
  }
  POLYNOMIALS[num] = res
  return res
}

// export functions
/**
 * @param {!Array<number>} msg
 * @param {number} ec_len
 * @return {!Array<number>}
 */
export function calculateEC(
  msg: number[],
  ec_len: number
): number[] {
  // `msg` could be array or buffer
  // convert `msg` to array
  msg = [].slice.call(msg)

  // Generator Polynomial
  let poly = generatorPolynomial(ec_len)

  for (let i = 0; i < ec_len; i++) msg.push(0)
  while (msg.length > ec_len) {
    if (!msg[0]) {
      msg.shift()
      continue
    }
    let log_k = log(msg[0])
    for (let i = 0; i <= ec_len; i++) {
      msg[i] = msg[i] ^ exp(poly[i] + log_k)
    }
    msg.shift()
  }
  return msg;
}
