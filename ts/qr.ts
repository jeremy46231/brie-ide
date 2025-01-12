import { encode, message } from './encode'
import { calculateEC } from './errorcode'
import { getMatrix } from './matrix'

// Template for version metadata
export interface VersionTemplate {
  /** version */
  v: number
  /** data length */
  dl: number
  /** length of each block */
  bl: number[]
  /** error correction length */
  el: number
}

export interface FilledTemplate extends VersionTemplate {
  /** data blocks */
  b: number[][]
  /** error correction blocks */
  e: number[][]
}
/**
 * @typedef {{
 *   v: number,
 *   dl: number,
 *   bl: !Array<number>,
 *   el: number
 * }}
 */
export let /** @const */ VersionTemplate

/**
 * @typedef {{
 *   v: number,
 *   dl: number,
 *   bl: !Array<number>,
 *   el: number,
 *   b: !Array<!Array<number>>,
 *   e: !Array<!Array<number>>
 * }}
 */
export let /** @const */ FilledTemplate

/** @const {!Array<!Array<number>>} */
const versions = [
  // total number of codewords, (number of ec codewords, number of blocks) * ( L )
  [26, 7, 1],
  [44, 10, 1],
  [70, 15, 1],
  [100, 20, 1],
  [134, 26, 1], // 5
  [172, 36, 2],
  [196, 40, 2],
  [242, 48, 2],
  [292, 60, 2],
  [346, 72, 4], // 10
  [404, 80, 4],
  [466, 96, 4],
  [532, 104, 4],
  [581, 120, 4],
  [655, 132, 6], // 15
  [733, 144, 6],
  [815, 168, 6],
  [901, 180, 6],
  [991, 196, 7],
  [1085, 224, 8], // 20
  [1156, 224, 8],
  [1258, 252, 9],
  [1364, 270, 9],
  [1474, 300, 10],
  [1588, 312, 12], // 25
  [1706, 336, 12],
  [1828, 360, 12],
  [1921, 390, 13],
  [2051, 420, 14],
  [2185, 450, 15], // 30
  [2323, 480, 16],
  [2465, 510, 17],
  [2611, 540, 18],
  [2761, 570, 19],
  [2876, 570, 19], // 35
  [3034, 600, 20],
  [3196, 630, 21],
  [3362, 660, 22],
  [3532, 720, 24],
  [3706, 750, 25], // 40
]

const templates = versions.map<VersionTemplate>(function (
  [totalCodewords, errorCodewords, blocksCount],
  i
) {
  const dataLen = totalCodewords - errorCodewords
  let remainingDataLen = dataLen
  return {
    v: i + 1,
    dl: dataLen,
    el: errorCodewords / blocksCount,
    bl: Array.from({ length: blocksCount }, (_, i) => {
      const blockSize = (remainingDataLen / (blocksCount - i)) | 0
      remainingDataLen -= blockSize
      return blockSize
    }),
  }
})

// Get version template
/**
 * @param {!message} data
 * @return {!VersionTemplate}
 */
function getTemplate([data10, data1]: message): VersionTemplate {
  for (const version of templates) {
    if ((version.v < 10 ? data1! : data10!).length >= version.dl) {
      return structuredClone(version)
    }
  }
  throw new Error('Too long')
}

// Fill template
/**
 * @param {!message} data
 * @param {!VersionTemplate} versionTemplate
 * @return {!FilledTemplate}
 */
function fillTemplate(
  [data10, data1]: message,
  versionTemplate: VersionTemplate
): FilledTemplate {
  const dataBlocks = new Array(versionTemplate.dl).fill(0) as number[]
  const data = data1 || data10

  for (let i = 0; i < data.length; i += 8) {
    dataBlocks[i / 8] = parseInt(
      data
        .slice(i, i + 8)
        .map((bit) => (bit ? '1' : '0'))
        .join(''),
      2
    )
  }

  let pad = 236
  for (let i = Math.ceil((data.length + 4) / 8); i < dataBlocks.length; i++) {
    dataBlocks[i] = pad
    pad = pad == 236 ? 17 : 236
  }

  let offset = 0
  const e: number[][] = []
  return {
    ...versionTemplate,
    e,
    b: versionTemplate.bl.map(function (n) {
      const b = dataBlocks.slice(offset, offset + n)
      offset += n
      e.push(calculateEC(b, versionTemplate.el))
      return b
    }),
  }
}

// All-in-one
/**
 * @param {string} text
 * @return {!Array<!Array<number>>}
 */
export function QR(text: string) {
  const message = encode(text)
  // console.log(message.map(row => row?.map(cell => !cell ? '██' : '  ').join('')).join('\n'))
  const template = getTemplate(message)
  // console.log(template)
  const data = fillTemplate(message, template)
  return getMatrix(data)
}
