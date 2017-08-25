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

const View = require('../base/View');
const TextAnimation = require('./TextAnimation');
const textTools = require('../../TextTools');
const eventCentral = require('../../EventCentral');
const elementCreator = require('../../ElementCreator');
const storageManager = require('../../StorageManager');

class Terminal extends View {
  constructor({ skipAnimation }) {
    super({ isFullscreen: true, viewId: 'terminal' });
    this.element.classList.add('fullHeight');

    this.skipAnimation = skipAnimation;
    this.terminalInput = elementCreator.createInput({ inputName: 'terminalInput', placeholder: 'Enter to run/see available programs', classes: ['terminalInput'] });
    this.element.appendChild(elementCreator.createList({ elementId: 'terminalFeed' }));
    this.element.appendChild(this.terminalInput);
    this.queue = [];
    this.printing = false;
    this.shortQueue = [];
    this.timeout = 50;
    this.firstRun = true;
    this.commands = [];
    this.triggers = {};
    this.nextFunc = null;

    eventCentral.addWatcher({
      watcherParent: this.element,
      event: eventCentral.Events.USER,
      func: ({ changedUser, firstConnection }) => {
        if (changedUser !== storageManager.getUserName() && !firstConnection) {
          this.element.firstElementChild.innerHTML = '';
          this.queue = [];
          this.queueMessage({
            message: {
              text: [
                'Welcome to OSAT, administrator C. Jenkins',
                '-----------------',
                'Your actions will be monitored',
                'Input or click on the command you want to run',
                'Programs:',
              ],
              elements: this.getClickableCommandNames(),
            },
          });
        }
      },
    });
  }

  setNextFunc(func) {
    this.nextFunc = func;
  }

  resetNextFunc() {
    this.nextFunc = null;

    this.clearInput();
    this.queueMessage({ message: { text: ['[Process completed]', 'Programs:'], elements: this.getClickableCommandNames() } });
  }

  addCommand(command) {
    this.commands.push(command);
  }

  clearInput() {
    this.terminalInput.value = '';
  }

  autoCompleteCommand() {
    const commands = this.getCommandNames();
    const matched = [];
    const inputValue = this.terminalInput.value.toLowerCase();
    let matches;

    commands.forEach((commandName) => {
      const lowerCommand = commandName.toLowerCase();
      matches = false;

      for (let j = 0; j < inputValue.length; j += 1) {
        if (inputValue.charAt(j) === lowerCommand.charAt(j)) {
          matches = true;
        } else {
          matches = false;

          break;
        }
      }

      if (matches) {
        matched.push(commandName);
      }
    });

    if (matched.length === 1) {
      this.terminalInput.value = matched[0];
    } else if (matched.length > 0) {
      this.queueMessage({
        message: {
          text: ['$ Multiple matched commands:'],
          elements: matched.map((commandName) => {
            return elementCreator.createSpan({
              text: commandName,
              classes: ['clickable'],
              func: () => {
                this.triggerCommand(commandName);
              },
            });
          }),
        },
      });
    }
  }

  triggerCommand(value) {
    const inputValue = (value || this.terminalInput.value).toString();

    if (this.nextFunc) {
      if (textTools.trimSpace(inputValue.toLowerCase()) === 'abort') {
        this.clearInput();
        this.queueMessage({ message: { text: ['You have aborted the running program'] } });
        this.resetNextFunc();
      } else {
        this.queueMessage({ message: { text: [`$ ${inputValue}`] } });
        this.nextFunc(inputValue);
        this.clearInput();
      }

      return;
    }

    if (inputValue === '') {
      this.queueMessage({ message: { text: ['$', 'Programs:'], elements: this.getClickableCommandNames() } });
    } else {
      const sentCommandName = textTools.trimSpace(inputValue.toLowerCase());
      const command = this.commands.find(({ commandName }) => sentCommandName === commandName.toLowerCase());

      if (command) {
        this.queueMessage({
          message: {
            text: [
              `$ ${inputValue}`,
              `Running command ${command.commandName}:`,
            ],
            elements: [
              elementCreator.createSpan({ text: 'Type abort or click to ' }),
              elementCreator.createSpan({
                classes: ['clickable', 'linkLook'],
                text: 'abort command',
                func: () => {
                  this.triggerCommand('abort');
                },
              }),
            ],
          },
        });
        command.startFunc();
      } else {
        this.queueMessage({ message: { text: [`$ ${inputValue}: command not found`, 'Programs:'], elements: this.getClickableCommandNames() } });
      }
    }

    this.clearInput();
  }

  addRow(message) {
    const currentText = message.text;

    if (currentText && currentText.length > 0) {
      const text = currentText.shift();
      const row = elementCreator.createListItem({ elementId: message.elementId, classes: message.classes, element: elementCreator.createSpan({ text }) });

      this.element.firstElementChild.appendChild(row);
      row.scrollIntoView();
      setTimeout(() => { this.addRow(message); }, this.timeout);
    } else {
      if (message.elements) {
        if (message.elementPerRow) {
          message.elements.forEach(element => this.appendRow({ classes: message.classes, elements: [element] }));
        } else {
          this.appendRow({ classes: message.classes, elements: message.elements });
        }
      }

      this.consumeShortQueue();
    }
  }

  consumeShortQueue() {
    if (this.shortQueue.length > 0) {
      const message = this.shortQueue.shift();

      this.addRow(message);
    } else {
      this.printing = false;
      this.consumeQueue();
    }
  }

  consumeQueue() {
    if (this.element.parentNode && !this.printing && this.queue.length > 0) {
      this.shortQueue = this.queue.splice(0, 10);
      this.printing = true;
      this.consumeShortQueue();
    }
  }

  queueMessage({ message }) {
    this.queue.push(message);
    this.consumeQueue(this.queue);
  }

  appendTo(parentElement) {
    if (!this.firstRun) {
      super.appendTo(parentElement);
      this.enableKeyTriggers();
      this.terminalInput.focus();
      this.consumeQueue();
    } else {
      this.addKeyTrigger({
        charCode: 13, // Enter
        triggerless: true,
        func: () => {
          this.triggerCommand();
        },
      });
      this.addKeyTrigger({
        charCode: 9, // Tab
        triggerless: true,
        func: () => {
          this.autoCompleteCommand();
        },
      });
      this.startBootSequence(parentElement);
      eventCentral.addWatcher({
        watcherParent: this,
        event: eventCentral.Events.TERMINAL,
        func: ({ mission }) => {
          if (mission) {
            const func = this.triggers[mission.missionType];

            if (func) { func({ mission }); }
          }
        },
      });
    }
  }

  removeView() {
    this.disableKeyTriggers();
    super.removeView();
  }

  getInput() {
    return textTools.trimSpace(this.terminalInput.value);
  }

  getCommandNames() {
    return this.commands.map(({ commandName }) => commandName);
  }

  getClickableCommandNames() {
    return this.commands.map(({ commandName }) => {
      return elementCreator.createSpan({
        text: commandName,
        classes: ['clickable', 'linkLook'],
        func: () => {
          this.triggerCommand(commandName);
        },
      });
    });
  }

  addTrigger({ trigger, triggerName }) {
    this.triggers[triggerName] = trigger;
  }

  appendRow({ elements, classes }) {
    const listItem = elementCreator.createListItem({ classes });

    elements.forEach(element => listItem.appendChild(element));

    this.element.firstElementChild.appendChild(listItem);
    listItem.scrollIntoView();
  }

  replaceLastRow({ text, classes }) {
    const listItem = elementCreator.createListItem({
      element: elementCreator.createSpan({ text }),
      classes,
    });

    this.element.firstElementChild.replaceChild(listItem, this.element.firstElementChild.lastElementChild);
  }

  startBootSequence(parentElement) {
    const endFunc = () => {
      this.firstRun = false;
      this.appendTo(parentElement);
      this.queueMessage({
        message: {
          text: [
            'Welcome to OSAT, administrator C. Jenkins',
            '-----------------',
            'Your actions will be monitored',
            'Input or click on the command you want to run',
            'Programs:',
          ],
          elements: this.getClickableCommandNames(),
        },
      });
    };

    if (this.skipAnimation) {
      endFunc();

      return;
    }

    const boot = new TextAnimation({ removeTime: 700 });

    boot.setQueue([
      {
        func: boot.printLines,
        params: {
          corruption: true,
          corruptionAmount: 0.5,
          classes: ['logo'],
          array: [
            '                          ####',
            '                ####    #########    ####',
            '               ###########################',
            '              #############################',
            '            #######        ##   #  ##########',
            '      ##########           ##    #  ###  ##########',
            '     #########             #########   #   #########',
            '       #####               ##     ########   #####',
            '     #####                 ##     ##     ##########',
            '     ####                  ##      ##     #   ######',
            ' #######                   ##########     ##    ########',
            '########                   ##       ########     ########',
            ' ######      Organica      ##       #      #############',
            '   ####     Oracle         ##       #      ##     ####',
            '   ####     Operating      ##       #      ##    #####',
            '   ####      System        ##       #      ###########',
            '########                   ##       #########    ########',
            '########                   ##########      #    #########',
            ' ########                  ##      ##     ## ###########',
            '     #####                 ##      ##     ### #####',
            '       #####               ##     ########   #####',
            '      #######              ##########   #  ########',
            '     ###########           ##    ##    # ###########',
            '      #############        ##    #   #############',
            '            ################################',
            '              ############################',
            '              #######  ##########  #######',
            '                ###      ######      ###',
            '                          ####',
          ],
        },
      }, {
        func: boot.printLines,
        params: {
          corruption: false,
          waitTime: 700,
          array: [
            'Oracle System Administrator Toolset',
            'OSAT ACCESS AUTHENTICATION',
            'PERMITTED ONLY BY AUTHORIZED PERSONNEL',
            'ACCESS DENIED',
            'ACCESS DENIED',
            'ACCESS DENIED',
            'ACCESS DENIED',
            'ACCESS DENIED',
            'Loading...',
          ],
        },
      }, {
        func: boot.printLines,
        params: {
          corruption: false,
          waitTime: 1200,
          array: [
            'ACCESS GRANTED',
            'Welcome, administrator Charlotte Jenkins',
            'Your field report is 721 days late',
            'Oracle status: HQ CONNECTION FAILED',
            'OSAT version: UNDEFINED',
          ],
        },
      }, {
        func: boot.printLines,
        params: {
          classes: ['logo'],
          waitTime: 700,
          array: [
            'THIS RELEASE OF OSAT WAS BROUGHT TO YOU BY',
            '   ####',
            '###############',
            ' #####  #########                                           ####',
            '  ####     #######  ########     ###########    ####     ###########',
            '  ####    ######      #######   ####   #####  ########    ####   #####',
            '  ####  ###         ####  ####        ####  ###    ###### ####   #####',
            '  #########        ####    ####     ####   #####     ##############',
            '  #### ######     ####     #####  ####     #######   ###  ########',
            '  ####   ######  ##### #### #### ############  #######    ####   ###',
            ' ######    #############    ################     ###      ####    #####',
            '########     ########        ####                        ######      #####   ##',
            '               ###########        ##                                    ###### ',
            '                    ###############',
            '                  Razor  #####  Demos - Warez - Honey',
            'ENJOY',
          ],
        },
      }, {
        func: boot.printLines,
        params: {
          corruption: false,
          array: [
            'Loading',
            '...',
            '...',
            '...',
            '...',
            '...',
          ],
        },
      },
    ]);
    boot.setEndFunc(endFunc);
    boot.appendTo(parentElement);
  }
}

module.exports = Terminal;
