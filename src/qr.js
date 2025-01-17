let versions = [
  // total number of codewords, number of ec codewords, number of blocks, version
  [26, 7, 1, 1],
  [44, 10, 1, 2],
  [70, 15, 1, 3],
  [100, 20, 1, 4],
  [134, 26, 1, 5], // 5
  [172, 36, 2, 6],
  [196, 40, 2, 7],
  [242, 48, 2, 8],
  [292, 60, 2, 9],
  [346, 72, 4, 10], // 10
  [404, 80, 4, 11],
  [466, 96, 4, 12],
  // [532, 104, 4, 13],
  [581, 120, 4, 14],
  // [655, 132, 6, 15], // 15
  [733, 144, 6, 16],
  // [815, 168, 6, 17],
  [901, 180, 6, 18],
  // [991, 196, 7, 19],
  [1085, 224, 8, 20], // 20
  // [1156, 224, 8, 21],
  [1258, 252, 9, 22],
  // [1364, 270, 9, 23],
  [1474, 300, 10, 24],
  // [1588, 312, 12, 25], // 25
  [1706, 336, 12, 26],
  // [1828, 360, 12, 27],
  [1921, 390, 13, 28],
  // [2051, 420, 14, 29],
  [2185, 450, 15, 30], // 30
  // [2323, 480, 16, 31],
  [2465, 510, 17, 32],
  // [2611, 540, 18, 33],
  [2761, 570, 19, 34],
  // [2876, 570, 19, 35], // 35
  [3034, 600, 20, 36],
  // [3196, 630, 21, 37],
  [3362, 660, 22, 38],
  // [3532, 720, 24, 39],
  [3706, 750, 25, 40], // 40
]

let templates = versions.map(
  ([totalCodewords, errorCodewords, blocksCount, version]) => {
    let dataLen = totalCodewords - errorCodewords
    let remainingDataLen = dataLen
    return {
      v: version,
      dl: dataLen,
      el: errorCodewords / blocksCount,
      bl: Array.from({ length: blocksCount }, (_, i) => {
        let blockSize = (remainingDataLen / (blocksCount - i)) | 0
        remainingDataLen -= blockSize
        return blockSize
      }),
    }
  }
)

// Get version template
let getTemplate = ([data10, data1]) => {
  for (let version of templates) {
    if ((version.v < 10 && data1 ? data1 : data10).length / 8 <= version.dl) {
      return structuredClone(version)
    }
  }
  throw new Error('Too long')
}

// Fill template
let fillTemplate = ([data10, data1], versionTemplate) => {
  let dataBlocks = new Array(versionTemplate.dl).fill(0)
  let data = data1 || data10

  for (let i = 0; i < data.length; i += 8) {
    dataBlocks[i / 8] = parseInt(
      // .map((bit) => (bit ? '1' : '0'))
      data.slice(i, i + 8).join``.padEnd(8, 0),
      2
    )
  }

  let pad = 236
  for (let i = Math.ceil((data.length + 4) / 8); i < dataBlocks.length; i++) {
    dataBlocks[i] = pad
    pad = pad == 236 ? 17 : 236
  }

  let offset = 0
  let e = []
  return {
    ...versionTemplate,
    e,
    b: versionTemplate.bl.map((n) => {
      let b = dataBlocks.slice(offset, offset + n)
      offset += n
      e.push(calculateEC(b, versionTemplate.el))
      return b
    }),
  }
}

// All-in-one
/**
 * @param {string} text
 */
let QR = (text) => {
  let message = encode(text)
  // console.log('message:')
  // console.log(Object.entries(message).map(([key, row]) => row.map(cell => !cell ? '█' : ' ').join``).join('\n'));
  let template = getTemplate(message)
  // console.log('template:', template)
  let data = fillTemplate(message, template)
  // console.log('data:', data)
  return getMatrix(data)
}
