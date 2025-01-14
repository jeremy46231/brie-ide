window['QR'] = QR
'document' in globalThis &&
  (document.querySelector('input').onchange = (e) => {
    const qr = QR(e.target.value)
    const string = qr
      .map((row) => row.map((cell) => (cell ? '██' : '  ')).join(''))
      .join('\n')
    document.querySelector('pre').textContent = string
  })
