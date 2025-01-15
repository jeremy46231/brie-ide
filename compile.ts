import { $ } from 'bun'
import fs from 'fs/promises'
import { qrcodegen } from './lib/qrcodegen'
const { QrCode, QrSegment } = qrcodegen
import { deflateSync } from 'fflate'

await fs.rmdir('dist', { recursive: true })
await $`bunx google-closure-compiler src/*.js -O ADVANCED --js_output_file dist/bundle.js -W QUIET`
await $`bunx terser dist/bundle.js -o dist/bundle.js --compress`

const file = await fs.readFile('dist/bundle.js')
console.log(`Original size: ${file.length} bytes`)

const compressed = deflateSync(new Uint8Array(file), {
  level: 9,
  mem: 12,
})

console.log(`Compressed size: ${compressed.length} bytes`)

// good chunk sizes: 3, 13, 23, 33, 43, 53, 63, 73, 83, 93
// don't ask me why they follow such a regular pattern, they're just the most optimal sizes
// if you're just barely out of room, you can try different sizes
const bitChunkSize = 33
const digitChunkSize = digitsToStoreBits(bitChunkSize)

const digits = bitsToDigits(uint8arrayToBits(compressed), bitChunkSize)
// await fs.writeFile('dist/bundle.js.digits.txt', digits)

const prefixFile = await fs.readFile('src/prefix.html')
const prefix = prefixFile
  .toString()
  .replaceAll('BIT_CHUNK_SIZE', bitChunkSize.toString())
  .replaceAll('DIGIT_CHUNK_SIZE', digitChunkSize.toString())
  .replaceAll('TOTAL_BYTES', compressed.length.toString())
const dataURL = `${prefix}${digits}`
await fs.writeFile('dist/url.txt', dataURL)

const prefixSegment = QrSegment.makeSegments(prefix)
const digitsSegment = QrSegment.makeNumeric(digits)
const segments = [...prefixSegment, digitsSegment]

const qrBits = QrSegment.getTotalBits(segments, 40)
const maxBits = 23648
console.log(
  `QR bits: ${qrBits} / ${maxBits} (${
    Math.round((qrBits / maxBits) * 1000) / 10
  }%, ${Math.floor((maxBits - qrBits) / 8)} bytes left)`
)

const qr = QrCode.encodeSegments(segments, QrCode.Ecc.LOW)

// logQR(qr)
await fs.writeFile('dist/qr.svg', qrSVG(qr))

await fs.rm('dist/bundle.js')

/*
<!-- start-url -->
```

```
<!-- end-url -->

put the data url in this codeblock in README.md
*/

const readmeContent = (await fs.readFile('README.md')).toString()
const replacedReadme = readmeContent.replace(
  /<!-- start-url -->[^]*<!-- end-url -->/,
  `<!-- start-url -->
\`\`\`
${dataURL}
\`\`\`
<!-- end-url -->`
)
await fs.writeFile('README.md', replacedReadme)



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

function digitsToStoreBits(bitChunkSize: number) {
  return Math.ceil(Math.log10(Math.pow(2, bitChunkSize)))
}

function bitsToDigits(bits: (0 | 1)[], bitChunkSize = 33) {
  let digits = ''
  const digitChunkSize = digitsToStoreBits(bitChunkSize)

  const chunks = chunkArray(bits, bitChunkSize)
  for (const chunk of chunks) {
    let value = parseInt(chunk.join('').padEnd(bitChunkSize, '0'), 2)
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
  const size = 1
  const padding = size * 4
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${
    qr.size * size + padding * 2
  } ${qr.size * size + padding * 2}">`
  svg += `<rect x="0" y="0" width="${qr.size * size + padding * 2}" height="${
    qr.size * size + padding * 2
  }" fill="#fff"/>`
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) svg += `<rect x="${x * size + padding}" y="${
        y * size + padding
      }" width="${size}" height="${size}" fill="#000"/>`
    }
  }
  return svg + '</svg>'
}
