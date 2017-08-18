/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const textTools = require('../../TextTools');

class Message {
  constructor({ time: date, text, userName, image, shortTeam }, { printable, lockDate }) { // roomName, extraClass, customSender, morseCode
    const timeStamp = textTools.generateTimeStamp({ date, lockDate });

    this.printable = printable;
    this.headerItems = [{
      textLine: userName,
      clickFunc: () => {
        console.log(userName);
      },
    }, {
      textLine: shortTeam ? `[${shortTeam.toUpperCase()}]` : '',
    }, {
      textLine: timeStamp.halfTime,
      placeLower: true,
    }, {
      textLine: timeStamp.fullDate,
      placeLower: true,
    }];
    this.text = text;
    this.image = image;
  }
}

module.exports = Message;
