let EXP_TABLE = [1]

let LOG_TABLE = []

for (let i = 1; i < 256; i++) {
  let n = EXP_TABLE[i - 1] << 1
  if (n > 255) n ^= 285
  EXP_TABLE[i] = n
  LOG_TABLE[n] = i
}

let generatorPolynomial = (num) => {
  if (!num) return [0]
  let prev = generatorPolynomial(num - 1)
  let res = [prev[0]]

  for (let i = 1; i <= num; i++) {
    res[i] =
      LOG_TABLE[
        EXP_TABLE[prev[i % 255]] ^ EXP_TABLE[(prev[i - 1] + num - 1) % 255]
      ]
  }
  return res
}

// export functions
let calculateEC = (msg, ec_len) => {
  // Generator Polynomial
  let poly = generatorPolynomial(ec_len)

  msg = msg.concat(Array(ec_len).fill(0))

  while (msg.length > ec_len) {
    if (!msg[0]) {
      msg.shift()
      continue
    }
    let log_k = LOG_TABLE[msg[0]]
    for (let i = 0; i <= ec_len; i++) {
      msg[i] ^= EXP_TABLE[(poly[i] + log_k) % 255]
    }
    msg.shift()
  }
  return msg
}
