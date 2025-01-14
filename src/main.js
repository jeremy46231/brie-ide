const div = document.querySelector('div')
const input = document.querySelector('input')
input.oninput = update
setTimeout(update, 10)

function update() {
  const value = input.value
  if (!value) return (div.innerHTML = '<a href=https:qrqr.jer.app>source')
  const qr = QR(value)
  div.style.gridTemplateColumns = `repeat(${qr.length}, 1fr)`
  div.innerHTML = qr
    .flat()
    .map(
      (cell) =>
        `<div style=aspect-ratio:1;background:${cell && '#000'}></div>`
    ).join``
  // const string = qr
  //   .map((row) => row.map((cell) => (cell ? '██' : '  ')).join(''))
  //   .join('\n')
  // document.querySelector('pre').textContent = string
}
