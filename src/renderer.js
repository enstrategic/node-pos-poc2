const hid = require('node-hid')
const poleDisplay = require('./poleDisplay.js')

var device = null
var serialDevice = null

function scannerSearch() {
  document.querySelector('#scanner-results').textContent = 'Scanning USB devices.'
  var scanner = null
  var devices = hid.devices().filter(device => device.usagePage != 1)
  document.querySelector('#scanner-select').innerHTML = generateDropdown(devices)
}

function generateDropdown(devices) {
  if (devices.length > 0) {
    console.log('devices: ' + JSON.stringify(devices, null, 3))
    var optionTags = ['<option value="" selected disabled hidden>Choose a USB Device...</option>']
    optionTags = optionTags.concat(devices.map(device => {
      return '<option value="'
      + device.path
      + '">'
      + device.product
      + '</option>'
    }))
    var markup = optionTags.reduce((accumulator, current) => accumulator + current)
    console.log(markup)
    return markup
  }
  return null
}

function serialSearch() {
  ports = poleDisplay.activeSerialPorts()
  .then(ports => {
    console.log(JSON.stringify(ports, null, 2))
    document.querySelector('#serial-select').innerHTML = generateSerialDropdown(ports)
  })
}

function generateSerialDropdown(devices) {
  var optionTags = ['<option value="" selected disabled hidden>Choose a Serial Device...</option>']
  optionTags = optionTags.concat(devices.map(device => {
    return '<option value="'
    + device.path
    + '">'
    + device.comName
    + ": "
    + device.manufacturer
    + '</option>'
  }))
  var markup = optionTags.reduce((accumulator, current) => accumulator + current)
  return markup
}

function registerDevice() {
  var path = this.value
  try {
    if (device != null) {
      device.close()
    }
    device = new hid.HID(path)
    device.on('data', data => {handleBuffer(data)})
    device.on('error', error => {
      handleError(error)
    })
    document.querySelector('#scanner-results').textContent = 'Connected and waiting for scan.'
  } catch(e) {
    handleError('Failed to register HID device with error: ' + e)
  }
}

function selectSerialPort() {
  var path = this.value
  try {
    poleDisplay.openPort(path, handleSerialData, handleError)
  } catch (err) {
    handleError(err)
  }
}

function sendMessage() {
  var message = document.querySelector("#serial-echo-data").value
  poleDisplay.write(message)
}

function handleBuffer(data) {
  try {
    var bufferString = data.toString()
    console.log(bufferString)
    document.querySelector('#scanner-results').textContent = bufferString
  } catch(e) {
    handleError('Failed to convert data to string. Error: ' + e + ' Raw data: ' + data)
  }
}

function handleSerialData(data) {
  console.log('data: ' + data.toString('utf8'))
}

function handleError(message) {
  alert(message)
  console.log(message)
}

document.addEventListener('DOMContentLoaded', function(event) {
  scannerSearch()
  serialSearch()
  document.querySelector('#refresh-button').addEventListener('click', scannerSearch)
  document.querySelector('#serial-refresh-button').addEventListener('click', serialSearch)
  document.querySelector('#scanner-select').addEventListener('change', registerDevice)
  document.querySelector('#serial-echo-button').addEventListener('click', sendMessage)
  document.querySelector('#serial-select').addEventListener('change', selectSerialPort)
})
