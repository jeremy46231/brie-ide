import fs from 'fs/promises'
;(async () => {
  const location = { hash: '#' + await fs.readFile('dist/bundle.js.digits', 'utf-8') }
  const window = {}
  let d, w

  d=new DecompressionStream('deflate-raw');w=d.writable.getWriter();w.write(new Uint8Array([...[...location.hash.slice(1).matchAll('.{10}')].map(s=>(+s[0]).toString(2).padStart(33,0)).join``.matchAll('.{8}')].map(s=>parseInt(s[0],2)).slice(0,2259)));w.close();d.readable.getReader().read().then(v=>eval(new TextDecoder().decode(v.value)))

  await new Promise(r => setTimeout(r, 100))
  const QR = window.QR

  const qr = QR('http://jer.app')
  const string = qr.map(row => row.map(cell => !cell ? '██' : '  ').join('')).join('\n')
  console.log(string)
})()
