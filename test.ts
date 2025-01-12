import { QR } from './js/qr'

const qr = QR('http://jer.app')

const string = qr.map(row => row.map(cell => !cell ? '██' : '  ').join('')).join('\n')
console.log(string)