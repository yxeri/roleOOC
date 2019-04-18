/*
 Copyright 2019 Carmilla Mina Jankovic

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

class VoiceCommander {
  constructor() {
    if (typeof annyang !== 'undefined') { // eslint-disable-line
      this.voiceListener = annyang; // eslint-disable-line
    }
    this.commands = {};
  }

  start() {
    if (!this.voiceListener) {
      setTimeout(this.start, 1000);

      return;
    }

    this.voiceListener.start({
      autoRestart: true,
      continuous: false,
    });
    this.voiceListener.addCommands(this.commands);
  }

  addCommands({
    activationString,
    commands = [],
  }) {
    const commandsObj = {};

    commands.forEach((command) => {
      const {
        func,
        strings = [],
      } = command;

      strings.forEach((string) => {
        const fullString = activationString
          ? `${activationString} ${string}`
          : string;

        commandsObj[fullString] = func;
        this.commands[fullString] = func;
      });
    });

    if (this.voiceListener) {
      this.voiceListener.addCommands(commandsObj);
    }
  }

  pause() {
    if (!this.voiceListener) {
      return;
    }

    this.voiceListener.pause();
  }

  unpause() {
    if (!this.voiceListener) {
      return;
    }

    this.voiceListener.resume();
  }
}

const voiceCommander = new VoiceCommander();

module.exports = voiceCommander;
