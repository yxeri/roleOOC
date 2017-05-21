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

const List = require('../base/List');
const StandardView = require('../base/StandardView');
const DialogBox = require('../DialogBox');
const ButtonBox = require('../templates/ButtonBox');
const elementCreator = require('../../ElementCreator');
const socketManager = require('../../SocketManager');
const eventCentral = require('../../EventCentral');
const textTools = require('../../TextTools');
const soundLibrary = require('../../audio/SoundLibrary');

class ToolsViewer extends StandardView {
  constructor({ isFullscreen }) {
    super({ isFullscreen, viewId: 'toolsViewer' });

    this.viewer.appendChild(elementCreator.createParagraph({ text: 'Rumours' }));
    this.viewer.appendChild(elementCreator.createList({}));
    this.viewer.classList.add('selectedView');

    this.codeList = new List({ shouldSort: false, title: 'CODES' });

    this.populateList();
    this.populateMessages();

    this.itemList.appendChild(this.codeList.element);

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.GAMECODE,
      func: ({ gameCode }) => {
        if (gameCode.codeType !== 'loot') {
          return;
        }

        this.codeList.addItem({ item: elementCreator.createSpan({ text: gameCode.code }) });
      },
    });
  }

  populateList() {
    const systemList = new List({
      title: 'SYSTEM',
      shouldSort: false,
    });

    const createAliasButton = elementCreator.createButton({
      classes: ['hide'],
      text: 'Create alias',
      func: () => {
        const createDialog = new DialogBox({
          buttons: {
            left: {
              text: 'Cancel',
              eventFunc: () => {
                createDialog.removeView();
              },
            },
            right: {
              text: 'Create',
              eventFunc: () => {
                const emptyFields = createDialog.markEmptyFields();

                if (emptyFields) {
                  soundLibrary.playSound('fail');
                  createDialog.changeExtraDescription({ text: ['You cannot leave obligatory fields empty!'] });

                  return;
                }

                const alias = createDialog.inputs.find(({ inputName }) => inputName === 'alias').inputElement.value.toLowerCase();

                socketManager.emitEvent('addAlias', { alias }, ({ error: createError }) => {
                  if (createError) {
                    console.log(createError);

                    return;
                  }

                  eventCentral.triggerEvent({
                    event: eventCentral.Events.NEWALIAS,
                    params: { alias },
                  });
                  createDialog.removeView();
                });
              },
            },
          },
          inputs: [{
            placeholder: 'Alias',
            inputName: 'alias',
            isRequired: true,
            maxLength: 10,
          }],
          description: [
            textTools.createMixedString(60),
            'Alter Ego Creator 0.0.2',
            'Made available by Razor',
            'Your new alias will be available in CHAT',
          ],
          extraDescription: ['Enter your new alias'],
        });
        createDialog.appendTo(this.element.parentElement);
      },
    });
    const createSimpleMsgButton = elementCreator.createButton({
      classes: ['hide'],
      text: 'Create rumour',
      func: () => {
        const createDialog = new DialogBox({
          buttons: {
            left: {
              text: 'Cancel',
              eventFunc: () => {
                createDialog.removeView();
              },
            },
            right: {
              text: 'Create',
              eventFunc: () => {
                const emptyFields = createDialog.markEmptyFields();

                if (emptyFields) {
                  soundLibrary.playSound('fail');
                  createDialog.changeExtraDescription({ text: ['You cannot leave obligatory fields empty!'] });

                  return;
                }

                const text = createDialog.inputs.find(({ inputName }) => inputName === 'simpleText').inputElement.value;

                socketManager.emitEvent('simpleMsg', { text }, ({ error: createError, data }) => {
                  if (createError) {
                    console.log(createError);

                    return;
                  }

                  const { simpleMsg } = data;

                  eventCentral.triggerEvent({
                    event: eventCentral.Events.SIMPLEMSG,
                    params: { simpleMsg },
                  });
                  createDialog.removeView();
                });
              },
            },
          },
          inputs: [{
            placeholder: 'Text',
            inputName: 'simpleText',
            isRequired: true,
            multiLine: true,
          }],
          description: ['Create a rumour that is visible for all other players'],
          extraDescription: ['Enter the message'],
        });
        createDialog.appendTo(this.element.parentElement);
      },
    });
    const createGameCodeButton = elementCreator.createButton({
      classes: ['hide'],
      text: 'Create loot code',
      func: () => {
        const createDialog = new DialogBox({
          buttons: {
            left: {
              text: 'Cancel',
              eventFunc: () => {
                createDialog.removeView();
              },
            },
            right: {
              text: 'Create',
              eventFunc: () => {
                const emptyFields = createDialog.markEmptyFields();

                if (emptyFields) {
                  soundLibrary.playSound('fail');
                  createDialog.changeExtraDescription({ text: ['You cannot leave obligatory fields empty!'] });

                  return;
                }

                socketManager.emitEvent('createGameCode', { codeType: 'loot' }, ({ error: createError, data }) => {
                  if (createError) {
                    console.log(createError);

                    return;
                  }

                  eventCentral.triggerEvent({ event: eventCentral.Events.GAMECODE, params: { gameCode: data.gameCode } });
                  createDialog.removeView();

                  const gameCodeBox = new ButtonBox({
                    description: [
                      `Your new code is: ${data.gameCode.code}`,
                      'All unused codes are also listed to the left, under CODES',
                    ],
                    buttons: [elementCreator.createButton({
                      text: 'Noted',
                      func: () => { gameCodeBox.removeView(); },
                    })],
                  });

                  gameCodeBox.appendTo(this.element.parentElement);
                });
              },
            },
          },
          description: ['Create a loot code. The loot code can be used by another player to steal some of your credits'],
        });
        createDialog.appendTo(this.element.parentElement);
      },
    });

    systemList.addItems({ items: [createSimpleMsgButton, createGameCodeButton, createAliasButton] });
    this.itemList.appendChild(systemList.element);

    this.accessElements.push({
      element: createSimpleMsgButton,
      accessLevel: 1,
    });
    this.accessElements.push({
      element: createAliasButton,
      accessLevel: 1,
    });
    this.accessElements.push({
      element: createGameCodeButton,
      accessLevel: 1,
    });
  }

  populateMessages() {
    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.USER,
      func: ({ changedUser }) => {
        if (changedUser) {
          this.codeList.replaceAllItems({ items: [] });
        }

        socketManager.emitEvent('getGameCodes', { codeType: 'loot' }, ({ error, data }) => {
          if (error) {
            console.log(error);

            return;
          }

          const { gameCodes = [] } = data;

          this.codeList.replaceAllItems({ items: gameCodes.map(gameCode => elementCreator.createSpan({ text: gameCode.code })) });
        });

        socketManager.emitEvent('getSimpleMessages', {}, ({ error, data }) => {
          if (error) {
            console.log(error);

            return;
          }

          const { simpleMsgs } = data;

          const fragment = document.createDocumentFragment();
          simpleMsgs.reverse().forEach((simpleMsg) => {
            fragment.appendChild(elementCreator.createListItem({
              element: elementCreator.createParagraph({ text: simpleMsg.text }) }));
          });

          this.viewer.lastElementChild.innerHTML = '';
          this.viewer.lastElementChild.appendChild(fragment);
        });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.SIMPLEMSG,
      func: ({ simpleMsg }) => {
        const listItem = elementCreator.createListItem({ element: elementCreator.createParagraph({ text: simpleMsg.text }) });

        this.addMessage(listItem);
      },
    });
  }

  addMessage(messageItem) {
    this.viewer.lastElementChild.insertBefore(messageItem, this.viewer.lastElementChild.firstElementChild);
  }
}

module.exports = ToolsViewer;
