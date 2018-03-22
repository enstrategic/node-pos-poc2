const serialport = require('serialport')
// stopBits 1, parity none are node-serialport's defaults
const defaultBaudRate = 9600
const MockSerialPort = require('serialport/test')
const mockBinding = MockSerialPort.Binding

// Set to true to work with mock serial ports instead
const testMode = false

var port = null

if (testMode) {
  mockBinding.createPort('COM1_TEST')
  mockBinding.createPort('COM2_TEST')
}

module.exports.activeSerialPorts = function () {
  if (testMode) {
    return new Promise((resolve, reject) => {
      var mockPorts =  [
        {
          path: 'COM1_TEST',
          comName: 'COM1_TEST',
          manufacturer: 'Mock serial port'
        },
        {
          path: 'COM2_TEST',
          comName: 'COM2_TEST',
          manufacturer: 'Mock serial port'
        }
      ]
      resolve(mockPorts)
    })
  }
  return serialport.list()
}

module.exports.openPort = function(path, dataCallback, errorCallback) {
  if (!path) {
    console.log('no serial port path provided.')
    return
  }
  if (testMode) {
    port = new MockSerialPort(path, {
      baudRate: defaultBaudRate
    })
  } else {
    port = new SerialPort(path, {
      baudRate: defaultBaudRate
    })
  }

  port.on('error', err => {
    console.log('Serial port error: ' + err)
    if (errorCallback) {
      errorCallback(err)
    }
  })

  port.on('data', data => {
    if (dataCallback) {
      dataCallback(data)
    }
  })
  port.on('open', () => {
    console.log('port opened at ' + port.path)
    port.binding.emitData(Buffer.from('display connected.'))
  })

  port.on('close', () => {
    console.log('reopening port.')
    openPort(path, dataCallback, errorCallback)
  })

  console.log('serial port connected.')
}

module.exports.write = function (message) {
  var portValid = port && port.isOpen
  if (portValid) {
    port.write(Buffer.from(message), () => {
      console.log('Last write: ', port.binding.lastWrite.toString('utf8'))
      port.drain(() => { port.flush() })
    })
  }
}
