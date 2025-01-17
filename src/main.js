let doc = document
doc.write`<meta name=viewport content=initial-scale=1><input style=width:100%;font-size:16><div style="display:grid;margin:1em;max-width:calc(100vh - 73px)">`
doc.title = 'QRQR'

let div = doc.querySelector`div`
let input = doc.querySelector`input`
input.oninput = update
setTimeout(update, 10)

function update() {
  let value = input.value || doc.baseURI
  let qr = QR(value)
  div.style.gridTemplateColumns = `repeat(${qr.length}, 1fr)`
  div.innerHTML = qr
    .flat()
    .map(
      (cell) => `<div style=aspect-ratio:1;background:${cell && '#000'}></div>`
    ).join``
  // let string = qr
  //   .map((row) => row.map((cell) => (cell ? '██' : '  ')).join(''))
  //   .join('\n')
  // document.querySelector('pre').textContent = string
}
