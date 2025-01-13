import { $ } from 'bun'
import fs from 'fs/promises'
import { qrcodegen } from './lib/qrcodegen'
import { deflateSync } from 'fflate'

await $`rm -r dist/`
await $`bunx google-closure-compiler js/* -O ADVANCED --js_output_file dist/bundle.js`
await $`bunx terser dist/bundle.js -o dist/bundle.js --compress`

const file = await fs.readFile('dist/bundle.js')
console.log(`Original size: ${file.length} bytes`)

const compressed = deflateSync(new Uint8Array(file), {
  level: 9,
  mem: 12,
})
console.log(`Compressed size: ${compressed.length} bytes`)

const digits = bitsToDigits(uint8arrayToBits(compressed))
await fs.writeFile('dist/bundle.js.digits', digits)

const qr = qrcodegen.QrCode.encodeSegments(
  [qrcodegen.QrSegment.makeNumeric(digits)],
  qrcodegen.QrCode.Ecc.LOW
)
// logQR(qr)
await fs.writeFile('dist/bundle.js.qr.svg', qrSVG(qr))

// functions

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

function uint8arrayToBits(compressed: Uint8Array): (0 | 1)[] {
  const bits: (0 | 1)[] = []
  for (const byte of compressed) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1 ? 1 : 0)
    }
  }
  return bits
}

function bitsToDigits(bits: (0 | 1)[], bitChunkSize = 33) {
  let digits = ''
  const digitChunkSize = Math.ceil(Math.log10(Math.pow(2, bitChunkSize)))

  const chunks = chunkArray(bits, bitChunkSize)
  for (const chunk of chunks) {
    let value = parseInt(chunk.join(''), 2)
    const string = value.toFixed(0).padStart(digitChunkSize, '0')
    digits += string
  }
  return digits
}

function logQR(qr: qrcodegen.QrCode) {
  for (let y = 0; y < qr.size; y++) {
    let line = ''
    for (let x = 0; x < qr.size; x++) {
      line += !qr.getModule(x, y) ? '██' : '  '
    }
    console.log(line)
  }
}
function qrSVG(qr: qrcodegen.QrCode) {
  const size = 10
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${
    qr.size * size
  } ${qr.size * size}">`
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) {
        svg += `<rect x="${x * size}" y="${
          y * size
        }" width="${size}" height="${size}" fill="black"/>`
      }
    }
  }
  return svg + '</svg>'
}
