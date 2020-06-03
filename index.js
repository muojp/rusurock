'use strict';

const pdu = require('node-pdu');
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const { IncomingWebhook } = require('@slack/webhook')
const WEBHOOK_URI = process.env.RUSUROCK_SLACK_WEBHOOK_URL
const WEBHOOK_MENTION = process.env.RUSUROCK_SLACK_MENTION

const webhook = new IncomingWebhook(WEBHOOK_URI)
const port = new SerialPort('/dev/ttyUSB0')
const parser = port.pipe(new Readline({ delimiter: '\r\n' }))

parser.on('data', handleCommands)

var isInitialized = false
const atCommandResponseRegex = /^\+([A-Z]+): (.+)$/

var runningCommand = undefined
var isWaiting = false
var dataBuffer = ''
function setCommandType(type) {
	runningCommand = type
}

function setIsWaiting(newVal) {
	isWaiting = newVal
}

function sleep(msec) {
	return new Promise(function (resolve) {
		setTimeout(function() { resolve() }, msec);
	})
}

async function issueCommand(atCommand, commandType, enableWait) {
	await sleep(1000)
	// clear previous data buffer
	dataBuffer = ''
	console.log('issue command: ' + atCommand)
	port.write(atCommand)
	setCommandType(commandType)
	setIsWaiting(enableWait)
}

function processPdu() {
	if (dataBuffer.length !== 0) {
		const msg = pdu.parse(dataBuffer)
		dataBuffer = ''
		const sender = msg.getAddress()['_phone']
		const subscriberId = msg.getSca()['_phone']
		const data = msg.getData()['_data']
		notify(`${data}\nfrom ${sender} (${subscriberId}) on SMS`)
	}
}

function notify(text) {
	console.log(`notify: ${text}`)
	webhook.send({
		text: WEBHOOK_MENTION + ' ' + text
	})
}

function handleCommands(data) {
	console.log(data)
	const result = atCommandResponseRegex.exec(data)
	if (result !== null) {
		const commandCode = result[1]
		const params = result[2].split(',')
		switch (commandCode) {
			case 'CNUM':
				console.log('CNUM: ' + params[1])
				notify('Started checking incoming calls/SMS\'s on ' + params[1])
				issueCommand('AT+CLIP=1', 'CLIP', true)
				break
			case 'CMTI':
				if (params[0] === '"SM"') {
					// retrieve SMS by number
					const idx = params[1]
					// TODO: could be better issuing CMGL instead of indivisual CMGR's
					// issueCommand('AT+CMGR='+idx, 'CMGR', true)
					issueCommand('AT+CMGL=0', 'CMGL', true)
				}
				break
			case 'CMGR':
				// data follows
				break
			case 'CMGL':
				if (dataBuffer.length !== 0) {
					// flush buffer
					processPdu()
				}
				break
			case 'CLIP':
				notify(`${params[0]} is calling`)
				break
		}
	}
	else if (data === 'OK') {
		if (isWaiting) {
			setIsWaiting(false)
			switch (runningCommand) {
				case 'AT':
					issueCommand('AT+CNUM', 'CNUM', true)
					break
				case 'CLIP':
					issueCommand('AT+CNMI=2,1', 'CNMI', true)
					break
				case 'CMGR':
					processPdu()
					break
				case 'CMGL':
					processPdu()
					issueCommand('AT+CMGD=0,1', 'CMGD', true)
					break
			}
		}
	}
	else if (data === 'RING') {
		// ringing. try to hang up the call immediately
		issueCommand('AT+CHUP', 'CHUP', false)
	}
	else {
		// data segment
		dataBuffer += data
	}
}

function run() {
	issueCommand('AT', 'AT', true)
	// issueCommand('AT+CMGR=0', 'CMGR', true)
	// issueCommand('AT+CMGL=1', 'CMGL', true)
}

run()
