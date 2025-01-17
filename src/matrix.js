// Initialize matrix with zeros
let init = (version) => {
  let N = version * 4 + 17
  return [...Array(N)].map(() => Array(N).fill(0))
}

// Put finders into matrix
let fillFinders = (matrix) => {
  let N = matrix.length
  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      let max = Math.max(i, j)
      let min = Math.min(i, j)
      let pixel =
        (max == 2 && min >= -2) || (min == -2 && max <= 2) ? 0x80 : 0x81
      matrix[3 + i][3 + j] = pixel
      matrix[3 + i][N - 4 + j] = pixel
      matrix[N - 4 + i][3 + j] = pixel
    }
  }
  for (let i = 0; i < 8; i++) {
    matrix[7][i] =
      matrix[i][7] =
      matrix[7][N - i - 1] =
      matrix[i][N - 8] =
      matrix[N - 8][i] =
      matrix[N - 1 - i][7] =
        0x80
  }
}

// Put align and timing
let fillAlignAndTiming = (matrix) => {
  let N = matrix.length
  if (N > 21) {
    let len = N - 13
    let delta = Math.round(len / Math.ceil(len / 28))
    if (delta % 2) delta++
    let res = []
    for (let p = len + 6; p > 10; p -= delta) {
      res.unshift(p)
    }
    res.unshift(6)
    for (let x of res) {
      for (let y of res) {
        if (matrix[x][y]) continue
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            let max = Math.max(r, c)
            let min = Math.min(r, c)
            let pixel =
              (max == 1 && min >= -1) || (min == -1 && max <= 1) ? 0x80 : 0x81
            matrix[x + r][y + c] = pixel
          }
        }
      }
    }
  }
  for (let i = 8; i < N - 8; i++) {
    matrix[6][i] = matrix[i][6] = i % 2 ? 0x80 : 0x81
  }
}

// Fill reserved areas with zeroes
let fillStub = (matrix) => {
  let N = matrix.length
  for (let i = 0; i < 8; i++) {
    if (i != 6) {
      matrix[8][i] = matrix[i][8] = 0x80
    }
    matrix[8][N - 1 - i] = 0x80
    matrix[N - 1 - i][8] = 0x80
  }
  matrix[8][8] = 0x80
  matrix[N - 8][8] = 0x81

  if (N >= 45) {
    for (let i = N - 11; i < N - 8; i++) {
      for (let j = 0; j < 6; j++) {
        matrix[i][j] = matrix[j][i] = 0x80
      }
    }
  }
}

// Fill reserved areas
let fillReserved = (() => {
  let FORMATS = []
  let VERSIONS = []

  let gf15 = 0x0537
  let gf18 = 0x1f25
  let formats_mask = 0x5412

  for (let format = 0; format < 32; format++) {
    let res = format << 10
    for (let i = 5; i > 0; i--) {
      if (res >>> (9 + i)) {
        res ^= gf15 << (i - 1)
      }
    }
    FORMATS[format] = (res | (format << 10)) ^ formats_mask
  }

  for (let version = 7; version <= 40; version++) {
    let res = version << 12
    for (let i = 6; i > 0; i--) {
      if (res >>> (11 + i)) {
        res ^= gf18 << (i - 1)
      }
    }
    VERSIONS[version] = res | (version << 12)
  }

  return (matrix, mask) => {
    let N = matrix.length
    let format = FORMATS[(1 << 3) | mask]
    let F = (k) => ((format >> k) & 1 ? 0x81 : 0x80)
    for (let i = 0; i < 8; i++) {
      matrix[8][N - 1 - i] = F(i)
      if (i < 6) matrix[i][8] = F(i)
    }
    for (let i = 8; i < 15; i++) {
      matrix[N - 15 + i][8] = F(i)
      if (i > 8) matrix[8][14 - i] = F(i)
    }
    matrix[7][8] = F(6)
    matrix[8][8] = F(7)
    matrix[8][7] = F(8)

    let version = VERSIONS[(N - 17) / 4]
    let V = (k) => ((version >> k) & 1 ? 0x81 : 0x80)
    if (!version) return
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        matrix[N - 11 + j][i] = matrix[i][N - 11 + j] = V(i * 3 + j)
      }
    }
  }
})()

// Fill data
let fillData = (() => {
  let MASK_FUNCTIONS = [
    (i, j) => (i + j) % 2,
    (i) => i % 2,
    (i, j) => j % 3,
    (i, j) => (i + j) % 3,
    (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2,
    (i, j) => ((i * j) % 2) + ((i * j) % 3),
    (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2,
    (i, j) => (((i * j) % 3) + ((i + j) % 2)) % 2,
  ]

  return (matrix, data, mask) => {
    let N = matrix.length
    let row = N - 1,
      col = N - 1,
      dir = -1

    let mask_fn = MASK_FUNCTIONS[mask]
    let len = data.b[data.b.length - 1].length

    let put = (byte) => {
      for (let mask = 0x80; mask; mask >>= 1) {
        let pixel = !!(mask & byte)
        if (!mask_fn(row, col)) pixel = !pixel
        matrix[row][col] = pixel ? 1 : 0
        next()
      }
    }

    let next = () => {
      do {
        if (col % 2 ^ (col < 6)) {
          if ((dir < 0 && row == 0) || (dir > 0 && row == N - 1)) {
            col--
            dir = -dir
          } else {
            col++
            row += dir
          }
        } else {
          col--
        }
        if (col == 6) col--
        if (col < 0) return false
      } while (matrix[row][col] & 0xf0)
      return true
    }

    for (let i = 0; i < len; i++) {
      for (let b = 0; b < data.b.length; b++) {
        if (data.b[b].length <= i) continue
        put(data.b[b][i])
      }
    }

    len = data.el
    for (let i = 0; i < len; i++) {
      for (let b = 0; b < data.e.length; b++) {
        put(data.e[b][i])
      }
    }

    if (col > -1) {
      do {
        matrix[row][col] = mask_fn(row, col) ? 0 : 1
      } while (next())
    }
  }
})()

// Calculate penalty
let calculatePenalty = (matrix) => {
  // COPILOT BASE OFF OF THIS
  let N = matrix.length
  let penalty = 0

  // Rule 1: Check rows and columns for consecutive bits
  let checkRun = (line) => {
    let len = 1
    for (let i = 1; i < N; i++) {
      len = (line[i] & 1) === (line[i - 1] & 1) ? len + 1 : 1
      if (len >= 5) penalty += len - 2
    }
  }
  for (let i = 0; i < N; i++) {
    checkRun(matrix[i])
    checkRun(matrix.map((row) => row[i]))
  }

  // Rule 2: Check 2x2 blocks
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < N - 1; j++) {
      let s =
        (matrix[i][j] +
          matrix[i][j + 1] +
          matrix[i + 1][j] +
          matrix[i + 1][j + 1]) &
        7
      if (s === 0 || s === 4) penalty += 3
    }
  }

  // Rule 3: Balance dark bits
  let numDark = matrix.flat().filter((bit) => bit & 1).length
  penalty += 10 * Math.floor(Math.abs(10 - (20 * numDark) / (N * N)))

  return penalty
}

// All-in-one function
let getMatrix = (data) => {
  let matrix = init(data.v)
  fillFinders(matrix)
  fillAlignAndTiming(matrix)
  fillStub(matrix)

  let penalty = Infinity
  let bestMask = 0
  for (let mask = 0; mask < 8; mask++) {
    fillData(matrix, data, mask)
    fillReserved(matrix, mask)
    let p = calculatePenalty(matrix)
    if (p < penalty) {
      penalty = p
      bestMask = mask
    }
  }

  fillData(matrix, data, bestMask)
  fillReserved(matrix, bestMask)

  return matrix.map((row) => row.map((cell) => cell & 1))
}
