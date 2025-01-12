import fs from 'fs/promises'
import { CompressionStream } from 'node:stream/web'
;(async () => {
  const size = (await fs.stat('dist/bundle.js')).size
  console.log(`Original size: ${size} bytes`)
  const file = await fs.readFile('dist/bundle.js')
  // uint8Array with CompressionStream
  const compressedData = await compress(file, 'deflate-raw')
  fs.writeFile('dist/bundle.js.gz', compressedData)
  const compressedSize = compressedData.length
  console.log(
    `Compressed size: ${compressedSize} bytes (${Math.round(
      (compressedSize / size) * 100
    )}%)`
  )
  const base64 = Buffer.from(compressedData).toString('base64')
  fs.writeFile('dist/bundle.js.gz.b64', base64)
  const base64Size = base64.length
  console.log(
    `Base64 size: ${base64Size} bytes (${Math.round(
      (base64Size / size) * 100
    )}%)`
  )
  const base85 = encodeBase85(compressedData)
  fs.writeFile('dist/bundle.js.gz.b85', base85)
  const base85Size = base85.length
  console.log(
    `Base85 size: ${base85Size} bytes (${Math.round(
      (base85Size / size) * 100
    )}%)`
  )
})()

async function readAll(
  compressionStream: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  const reader = compressionStream.getReader()
  const chunks: Uint8Array[] = []
  let done = false

  while (!done) {
    const { value, done: readerDone } = await reader.read()
    if (value) {
      chunks.push(value)
    }
    done = readerDone
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result
}
async function compress(
  file: Buffer,
  algorithm: CompressionFormat
): Promise<Uint8Array> {
  const compressionStream = new CompressionStream(algorithm)
  const writer = compressionStream.writable.getWriter()
  writer.write(file)
  writer.close()
  return readAll(compressionStream.readable as ReadableStream<Uint8Array>)
}

// ...existing code...
function encodeBase85(data: Uint8Array): string {
  let output = ''
  const padding = (4 - (data.length % 4)) % 4
  const padded = new Uint8Array(data.length + padding)
  padded.set(data)

  for (let i = 0; i < padded.length; i += 4) {
    let value =
      (((padded[i] << 24) >>> 0) |
        (padded[i + 1] << 16) |
        (padded[i + 2] << 8) |
        padded[i + 3]) >>>
      0
    let block = ''
    for (let j = 0; j < 5; j++) {
      block = String.fromCharCode((value % 85) + 33) + block
      value = Math.floor(value / 85)
    }
    output += block
  }

  // Remove extra chars for padding
  return output.slice(0, output.length - padding)
}
function decodeBase85(str: string): Uint8Array {
  const padding = (5 - (str.length % 5)) % 5
  str += '~'.repeat(padding)
  const bytes: number[] = []

  for (let i = 0; i < str.length; i += 5) {
    let value = 0
    for (let j = 0; j < 5; j++) {
      value = value * 85 + (str.charCodeAt(i + j) - 33)
    }
    bytes.push(
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    )
  }

  // Remove extra bytes from padding
  return new Uint8Array(bytes.slice(0, bytes.length - padding))
}

export {}
