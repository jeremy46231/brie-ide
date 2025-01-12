// Galois Field Math
const GF256_BASE = 285

const EXP_TABLE = [1]

const LOG_TABLE = []

for (let i = 1; i < 256; i++) {
  let n = EXP_TABLE[i - 1] << 1
  if (n > 255) n = n ^ GF256_BASE
  EXP_TABLE[i] = n
}

for (let i = 0; i < 255; i++) {
  LOG_TABLE[EXP_TABLE[i]] = i
}

function exp(k) {
  while (k < 0) k += 255
  while (k > 255) k -= 255
  return EXP_TABLE[k]
}

function log(k) {
  if (k < 1 || k > 255) {
    throw Error('Bad log(' + k + ')')
  }
  return LOG_TABLE[k]
}

// Generator Polynomials
let POLYNOMIALS = [[0]]

function generatorPolynomial(num) {
  if (POLYNOMIALS[num]) {
    return POLYNOMIALS[num]
  }
  let prev = generatorPolynomial(num - 1)
  let res = []

  res[0] = prev[0]
  for (let i = 1; i <= num; i++) {
    res[i] = log(exp(prev[i]) ^ exp(prev[i - 1] + num - 1))
  }
  POLYNOMIALS[num] = res
  return res
}

// export functions
function calculateEC(
  msg,
  ec_len
) {
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
