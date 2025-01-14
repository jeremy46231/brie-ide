import fs from 'fs/promises'
import { QR as OriginalQR } from './qr-image/lib/qr-base'

const file = await fs.readFile('dist/bundle.js')
globalThis.window = {} as any
eval(file.toString())
const QR = globalThis.window.QR as (text: string) => number[][]

function qrText(qr: number[][]) {
  const paddingSide = '██'.repeat(2)
  const paddingTop = ('██'.repeat(qr.length + 4) + '\n').repeat(2)
  const qrStr =
    paddingTop +
    qr
      .map(
        (row) =>
          paddingSide +
          row.map((bit) => (!bit ? '██' : '  ')).join('') +
          paddingSide
      )
      .join('\n') +
    '\n' +
    paddingTop
  return qrStr
}
function sideBySide(a: string, b: string, filler = '█', padding = 1) {
  const linesA = a.split('\n').filter((line) => line)
  const widthA =
    linesA.reduce((max, line) => Math.max(max, line.length), 0) + padding
  const linesB = b.split('\n').filter((line) => line)
  const paddedA = linesA.map(
    (lineA, i) => lineA.padEnd(widthA, filler) + (linesB[i] || '')
  )
  if (linesB.length > linesA.length) {
    paddedA.push(
      ...linesB
        .slice(linesA.length)
        .map((lineB) => filler.repeat(widthA) + lineB)
    )
  }
  return paddedA.join('\n')
}

function test(text: string) {
  const qr = QR(text)
  const originalQR = OriginalQR(text, 'L', false)

  const qrStr = qrText(qr)
  const originalQRStr = qrText(originalQR)
  const sideBySideStr = sideBySide(qrStr, originalQRStr)

  console.log(text)
  console.log(sideBySideStr)
}

test('https://jer.app')
test('http://google.com')
test('https://example.com/#123456789012345678901234567890')
