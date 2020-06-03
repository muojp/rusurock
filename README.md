# rusurock - SMS/call notifier for Slack

Notify calls/SMS's on your SIM card to Slack using Huawei USB 3G modems.

![screenshot-01](https://raw.githubusercontent.com/muojp/rusurock/images/screenshot-01.jpg)

## Prerequisites

 - Node.js
 - npm
 - Huawei USB 3G modem (confirmed HW-01C)
 - Linux machine (Raspberry Pi series w/ 512MB+ would be enough. Tested on NanoPi NEO)

## Usage

Export environment vars:

```
export RUSUROCK_SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...../...../.....'
export RUSUROCK_SLACK_MENTION='<@.....>'
```

Make sure your SIM card is inserted and 3G USB modem is connected on your machine.

```
$ git clone git@github.com:muojp/rusurock.git
$ cd rusurock
$ npm i
$ node .
```

## Sample output

```
issue command: AT
OK
issue command: AT+CNUM
+CNUM: ,"<masked>",129
CNUM: "<masked>"
notify: Started checking incoming calls/SMS's on "<masked>"
OK
issue command: AT+CLIP=1
OK
issue command: AT+CNMI=2,1
OK
+CMTI: "SM",0
issue command: AT+CMGL=0
+CMGL: 0,0,,33
<masked>
OK
notify: ありがとうねぇ
```

## Author

Kei Nakazawa

## License

MIT
