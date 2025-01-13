import fs from 'fs/promises'
;(async () => {
  const s = await fs.readFile('dist/bundle.js.gz.b85', 'utf-8')

  d = new DecompressionStream('deflate')
  w = d.writable.getWriter()
  r = d.readable.getReader()
  ;(async () => {
    c = ''
    while (1) {
      let { done: d, value: v } = await r.read()
      if (d) break
      c += String.fromCharCode(...v)
    }
    console.log(c)
  })()
  for (i = 0; i < s.length; i += 5) {
    n = 0
    for (j = 0; j < 5; j++) {
      n = n * 85 + (s.charCodeAt(i + j) - 33)
    }
    w.write(
      new Uint8Array([
        (n >>> 24) & 0xff,
        (n >>> 16) & 0xff,
        (n >>> 8) & 0xff,
        n & 0xff,
      ])
    )
  }
  w.close()
})()
