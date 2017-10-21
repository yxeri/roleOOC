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

const StandardView = require('../base/StandardView');
const MessageList = require('../elements/MessageList');
const Message = require('../elements/Message');
const List = require('../base/List');
const DialogBox = require('../DialogBox');
const ButtonBox = require('../templates/ButtonBox');

const keyHandler = require('../../KeyHandler');
const socketManager = require('../../SocketManager');
const storageManager = require('../../StorageManager');
const eventCentral = require('../../EventCentral');
const elementCreator = require('../../ElementCreator');
const soundLibrary = require('../../audio/SoundLibrary');
const textTools = require('../../TextTools');
const deviceChecker = require('../../DeviceChecker');
const viewTools = require('../../ViewTools');

/**
 * Takes a list of user names and filters out current users user name and aliases
 * @param {string[]} userNames List of users
 * @returns {string[]} List of users, excluding current user name and aliases
 */
function filterUserAliases(userNames) {
  const aliases = storageManager.getAliases();
  aliases.push(storageManager.getUserName());

  return userNames.filter(userName => aliases.indexOf(userName) === -1);
}

/**
 * Converts room name to sender and receiver user names
 * @param {string} sentRoomName Whisper room name and user name combined
 * @returns {{userName: string, whisperTo: string}} Name of the user sending whisper and user that is whispered to
 */
function convertWhisperRoomName(sentRoomName) {
  let userName = null;
  let whisperTo = null;

  if (sentRoomName.indexOf('-whisper-') > -1) {
    const roomSplit = sentRoomName.split('-whisper-');
    userName = roomSplit[0];
    whisperTo = roomSplit[1];
  }

  return { userName, whisperTo };
}

/**
 * Retrieve history and trigger CHATMSG event
 * @param {string} params.roomName Name of the room to retrieve history from
 * @param {boolean} params.infiniteScroll Did infinite scroll trigger the history retrieval?
 * @param {Function} params.callback Callback
 */
function getHistory({ roomName, infiniteScroll = false, callback = () => {} }) {
  const { whisperTo, userName } = convertWhisperRoomName(roomName);

  if (whisperTo) {
    roomName = userName;
  }

  socketManager.emitEvent('getHistory', { roomName, whisperTo }, ({ data: historyData, error: historyError }) => {
    if (historyError) {
      callback({ error: historyError });

      return;
    }

    const messages = historyData.history.messages;

    if (whisperTo) {
      roomName = `${userName}-whisper-${whisperTo}`;
    }

    eventCentral.triggerEvent({
      event: eventCentral.Events.HISTORY,
      params: {
        infiniteScroll,
        roomName,
        messages,
        options: { printable: false },
        shouldScroll: !infiniteScroll,
        isHistory: true,
        following: historyData.following,
      },
    });
  });
}

/**
 * Finds and returns the list item that contains the button with sent text
 * @param {Object} list List item
 * @param {string} text Text to compare to
 * @returns {HTMLLIElement} List item element
 */
function findItem(list, text) {
  if (!list.element.lastElementChild) {
    return null;
  }

  const listItems = Array.from(list.element.lastElementChild.getElementsByTagName('LI'));

  return listItems.find(item => (item.firstElementChild.getAttribute('data') || item.firstElementChild.innerText) === text);
}

class Messenger extends StandardView {
  constructor({ sendButtonText, isTopDown }) {
    super({ isFullscreen: true });

    this.element.setAttribute('id', 'messenger');
    this.inputField = document.createElement('TEXTAREA');
    this.inputField.setAttribute('rows', '3');
    this.inputField.setAttribute('placeholder', 'Input message. alt+enter to send');
    this.inputField.addEventListener('input', () => { this.resizeInputField(); });
    this.selectedItem = null;

    this.optionsDiv = elementCreator.createContainer({
      classes: ['options', 'hide'],
    });
    this.element.appendChild(this.optionsDiv);

    this.messageList = new MessageList({ isTopDown });
    this.systemList = new List({
      title: 'system',
      shouldSort: false,
      titleCallback: () => {
        this.lists.forEach((list) => {
          if (this.systemList !== list) {
            list.hideList();
          }
        });
      },
    });
    this.followList = new List({
      title: 'following',
      shouldSort: false,
      titleCallback: () => {
        this.lists.forEach((list) => {
          if (this.followList !== list) {
            list.hideList();
          }
        });
      },
    });
    this.roomsList = new List({
      title: 'rooms',
      shouldSort: true,
      titleCallback: () => {
        this.lists.forEach((list) => {
          if (this.roomsList !== list) {
            list.hideList();
          }
        });
      },
    });
    this.userList = new List({
      title: 'users',
      shouldSort: true,
      titleCallback: () => {
        this.lists.forEach((list) => {
          if (this.userList !== list) {
            list.hideList();
          }
        });
      },
    });
    this.lists = [
      this.systemList,
      this.followList,
      this.roomsList,
      this.userList,
    ];

    this.imagePreview = new Image();
    this.imagePreview.classList.add('hide');

    const imageInput = document.createElement('INPUT');
    imageInput.classList.add('hide');
    imageInput.setAttribute('type', 'file');
    imageInput.setAttribute('accept', 'image/png, image/jpeg');
    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        this.imagePreview.classList.remove('hide');
        this.imagePreview.setAttribute('src', reader.result);
        this.imagePreview.setAttribute('name', file.name);
        this.imagePreview.classList.add('imagePreview');
        this.focusInput();
      });

      reader.readAsDataURL(file);
    });

    const sendButton = elementCreator.createContainer({
      classes: ['button'],
      func: () => {
        this.sendMessage();
      },
    });

    sendButton.appendChild(elementCreator.createContainer({ classes: ['buttonLeftCorner'] }));
    sendButton.appendChild(elementCreator.createContainer({ classes: ['buttonUpperRightCorner'] }));
    sendButton.appendChild(elementCreator.createSpan({ text: sendButtonText }));

    const imageButton = elementCreator.createButton({
      func: () => { imageInput.click(); },
      text: 'Pic',
      classes: ['hide'],
    });
    imageButton.appendChild(imageInput);
    this.accessElements.push({
      element: imageButton,
      accessLevel: 2,
    });

    const buttons = document.createElement('DIV');
    buttons.classList.add('buttons');

    buttons.appendChild(imageButton);
    buttons.appendChild(sendButton);

    this.inputArea = document.createElement('DIV');
    this.inputArea.classList.add('inputArea');
    this.inputArea.classList.add('hide');
    this.inputArea.appendChild(this.imagePreview);
    this.inputArea.appendChild(this.inputField);
    this.inputArea.appendChild(buttons);
    this.accessElements.push({
      element: this.inputArea,
      accessLevel: 1,
    });

    this.viewer.classList.add('selectedView');

    if (isTopDown) {
      this.inputArea.classList.add('topDown');
      this.viewer.appendChild(this.inputArea);
      this.viewer.appendChild(this.messageList.element);
    } else {
      this.inputArea.classList.add('bottomUp');
      this.viewer.appendChild(this.messageList.element);
      this.viewer.appendChild(this.inputArea);
    }

    this.viewer.addEventListener('click', () => {
      this.optionsDiv.classList.add('hide');
    });

    this.inputArea.addEventListener('click', () => {
      this.optionsDiv.classList.add('hide');
    });

    this.inputField.addEventListener('focus', () => {
      if (deviceChecker.deviceType === deviceChecker.DeviceEnum.ANDROID) {
        if (viewTools.isLandscape()) {
          this.element.classList.add('androidLandscapeKeyboardFix');
        } else {
          this.element.classList.add('androidPortraitKeyboardFix');
        }

        this.messageList.scroll();
      }
    });

    this.viewer.firstElementChild.addEventListener('click', () => {
      if (deviceChecker.deviceType === deviceChecker.DeviceEnum.ANDROID) {
        this.element.classList.remove('androidLandscapeKeyboardFix', 'androidPortraitKeyboardFix');
        this.inputField.value = 'android';
        this.messageList.scroll();
      }
    });

    this.viewer.addEventListener('mousewheel', () => {
      if (this.viewer.firstElementChild) {
        if (!this.messageList.isTopDown) {
          // getHistory({ roomName: storageManager.getRoom() });
        }
      }
    });

    this.populate();
  }

  sendMessage() {
    if (this.inputField.value.trim() !== '') {
      const { whisperTo, userName } = convertWhisperRoomName(storageManager.getRoom());
      const roomName = whisperTo || storageManager.getRoom();

      const chatMsgData = {
        message: {
          roomName,
          text: this.inputField.value.split('\n'),
          userName: whisperTo ? userName : storageManager.getSelectedAlias() || storageManager.getUserName(),
        },
      };

      const imageSource = this.imagePreview.getAttribute('src');

      if (imageSource) {
        chatMsgData.image = {
          source: imageSource,
          imageName: this.imagePreview.getAttribute('name'),
          width: this.imagePreview.naturalWidth,
          height: this.imagePreview.naturalHeight,
        };

        this.imagePreview.removeAttribute('src');
        this.imagePreview.removeAttribute('name');
        this.imagePreview.classList.add('hide');
      }

      const event = whisperTo ? 'whisperMsg' : 'chatMsg';

      socketManager.emitEvent(event, chatMsgData, ({ data, error }) => {
        if (error) {
          console.log(error);

          return;
        }

        eventCentral.triggerEvent({
          event: eventCentral.Events.CHATMSG,
          params: {
            roomName,
            isWhisper: data.isWhisper,
            message: data.message,
            options: { printable: false },
            shouldScroll: true,
          },
        });
        this.clearInputField();
      });

      this.focusInput();
    }
  }

  resizeInputField() {
    this.inputField.style.height = 'auto';
    this.inputField.style.height = `${this.inputField.scrollHeight}px`;
    this.viewer.scrollTop = this.viewer.scrollHeight;
  }

  clearInputField() {
    this.inputField.value = '';
    this.resizeInputField();
  }

  removeView() {
    const main = document.getElementById('main');
    main.classList.remove('multiMenu');

    keyHandler.removeKey(13);
    this.element.parentNode.classList.remove('messengerMain');
    super.removeView();

    this.messageList.element.classList.remove('flash');

    // forEach on childNodes does not work in iOS 7
    for (let i = 0; i < this.messageList.element.childNodes.length; i += 1) {
      const listItem = this.messageList.element.childNodes[i];

      listItem.classList.remove('flash');
    }
  }

  focusInput() {
    this.inputField.focus();
  }

  populate() {
    const createButton = elementCreator.createButton({
      classes: ['hide'],
      text: 'Create room',
      func: () => {
        this.lists.forEach(list => list.hideList());

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

                const room = {
                  roomName: createDialog.inputs.find(({ inputName }) => inputName === 'roomName').inputElement.value,
                  password: createDialog.inputs.find(({ inputName }) => inputName === 'password').inputElement.value,
                };

                if (!textTools.isInternationalAllowed()) {
                  createDialog.clearInput('roomName');
                  createDialog.changeExtraDescription({
                    text: [
                      'Invalid characters in room name',
                      'Valid characters are a-z 0-9',
                      'Unable to create the room',
                    ],
                  });
                }

                socketManager.emitEvent('createRoom', { room }, ({ error: createError, data }) => {
                  if (createError) {
                    console.log(createError);

                    return;
                  }

                  eventCentral.triggerEvent({
                    event: eventCentral.Events.FOLLOWROOM,
                    params: { room: data.room },
                  });
                  createDialog.removeView();
                });
              },
            },
          },
          inputs: [{
            placeholder: 'Name of the room',
            inputName: 'roomName',
            isRequired: true,
            maxLength: 20,
          }, {
            placeholder: 'Optional password',
            inputName: 'password',
            type: 'password',
          }],
          description: ['Employees are strictly prohibited from having more than 5% fun in their group room.'],
          extraDescription: ['Enter a name and optional password for the room', 'Allowed characters in the name: a-z 0-9'],
        });
        createDialog.appendTo(this.element.parentElement);
      },
    });

    this.systemList.addItems({ items: [createButton] });

    this.itemList.appendChild(this.systemList.element);
    this.itemList.appendChild(this.followList.element);
    this.itemList.appendChild(this.roomsList.element);
    this.itemList.appendChild(this.userList.element);
    this.itemList.appendChild(elementCreator.createContainer({ classes: ['menuRightCorner'] }));

    this.accessElements.push({
      element: this.systemList.element,
      accessLevel: 1,
    });
    this.accessElements.push({
      element: createButton,
      accessLevel: 1,
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.HISTORY,
      func: ({ roomName, messages, isWhisper, options }) => {
        const userNames = storageManager.getAliases();
        const userName = storageManager.getUserName();


        if (messages.length === 0) {
          this.messageList.element.innerHTML = '';

          return;
        }

        if (userName) {
          userNames.push(userName);
        }

        let fullRoomName = roomName;

        if (isWhisper) {
          if (userNames.indexOf(messages[0].userName) > -1) {
            fullRoomName = `${messages[0].userName}-whisper-${roomName}`;
          } else {
            fullRoomName = `${roomName}-${messages[0].userName}`;
          }
        }

        if (roomName === storageManager.getRoom()) {
          const itemsOptions = {
            animation: 'flash',
            isHistory: true,
          };

          this.messageList.element.innerHTML = '';

          this.messageList.addItems(messages.map(message => new Message(message, options)), itemsOptions);
        } else {
          const listItem = findItem(this.followList, fullRoomName);

          if (listItem) {
            listItem.firstElementChild.classList.add('selected');
          }
        }
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.CHATMSG,
      func: ({ message, roomName, isWhisper, options }) => {
        const userNames = storageManager.getAliases();
        const userName = storageManager.getUserName();

        if (userName) {
          userNames.push(userName);
        }

        let fullRoomName = roomName;

        if (isWhisper) {
          if (userNames.indexOf(message.userName) > -1) {
            fullRoomName = `${message.userName}-whisper-${roomName}`;
          } else {
            fullRoomName = `${roomName}-${message.userName}`;
          }
        }

        if (fullRoomName === storageManager.getRoom()) {
          const itemsOptions = {
            animation: 'flash',
            shouldScroll: true,
          };

          this.messageList.addItems([message].map(currentMessage => new Message(currentMessage, options)), itemsOptions);

          return;
        }

        const listItem = findItem(this.followList, fullRoomName);

        if (listItem) {
          listItem.firstElementChild.classList.add('selected');
        } else if (isWhisper) {
          eventCentral.triggerEvent({
            event: eventCentral.Events.FOLLOWROOM,
            params: { isSelected: true, room: { roomName: `${userName} <-> ${message.userName}` }, data: fullRoomName, whisper: true },
          });
        }
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.BCASTMSG,
      func: ({ message }) => {
        const itemsOptions = {
          animation: 'flash',
          shouldScroll: true,
        };

        const intro = message.intro || [
          'EMPLOYEE. STAND AT ATTENTION', '----------',
        ];
        const extro = message.extro || [
          'END OF MESSAGE', '----------',
        ];

        message.text = intro.concat(message.text).concat(extro);

        this.messageList.addItems([new Message(message, {})], itemsOptions);
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.SWITCHROOM,
      func: () => {
        const roomName = storageManager.getRoom();
        const listItem = findItem(this.followList, roomName);

        if (listItem) {
          this.selectedItem = listItem;
          this.selectedItem.classList.add('selectedItem');
        }

        this.messageList.element.classList.remove('flash');

        if (roomName && roomName !== '') {
          setTimeout(() => {
            this.messageList.element.classList.add('flash');

            getHistory({ roomName, switchedRoom: true });
          }, 100);
        }
      },
    });

    eventCentral.addWatcher({
      watcherParent: this.followList,
      event: eventCentral.Events.FOLLOWROOM,
      func: ({ isSelected, room: { roomName }, whisperTo, data, whisper }) => {
        if (!whisper) {
          this.followList.addItem({ item: this.createRoomButton({ roomName, data: data || roomName }) });
        } else {
          this.followList.addItem({ item: this.createWhisperButton({ isSelected, roomName, whisperTo, data: data || roomName }) });
        }
      },
    });

    eventCentral.addWatcher({
      watcherParent: this.followList,
      event: eventCentral.Events.UNFOLLOWROOM,
      func: ({ room }) => {
        const currentRoom = storageManager.getRoom();

        if (currentRoom === room.roomName) {
          storageManager.setRoom('public');
        }

        this.followList.removeItem({
          name: room.roomName.indexOf('-team') > -1 ? 'team' : room.roomName,
        });

        // TODO Has to re-add to unfollowed list
      },
    });

    eventCentral.addWatcher({
      watcherParent: this.roomsList,
      event: eventCentral.Events.NEWROOM,
      func: ({ room: { roomName }, isProtected }) => {
        this.roomsList.addItem({ item: this.createRoomButton({ roomName, isProtected }) });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.NEWUSER,
      func: ({ user }) => {
        this.userList.addItem({
          item: this.createWhisperButton({
            roomName: storageManager.getUserName(),
            whisperTo: user.userName,
          }),
        });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.USER,
      func: ({ changedUser, firstConnection }) => {
        if (storageManager.getToken()) {
          this.inputArea.classList.remove('hide');
          this.messageList.element.classList.remove('fullHeight');

          socketManager.emitEvent('listUsers', {}, ({ error, data }) => {
            if (error) {
              console.log(error);

              return;
            }

            socketManager.emitEvent('listAliases', {}, ({ error: aliasError, data: aliasData }) => {
              if (aliasError) {
                console.log(aliasError);

                return;
              }

              const users = filterUserAliases(data.users.map(user => user.userName));
              const retrievedAliases = filterUserAliases(aliasData.aliases);
              const userName = storageManager.getSelectedAlias() || storageManager.getUserName();

              this.userList.replaceAllItems({ items: users.concat(retrievedAliases).map(thisUserName => this.createWhisperButton({ roomName: userName, whisperTo: thisUserName })) });
            });
          });
        } else {
          this.userList.replaceAllItems({ items: [] });
          this.followList.replaceAllItems({ items: [] });
          this.roomsList.replaceAllItems({ items: [] });

          this.inputArea.classList.add('hide');
          this.messageList.element.classList.add('fullHeight');
        }

        socketManager.emitEvent('getRooms', {}, ({ error, data }) => {
          if (error) {
            console.log(error);

            return;
          }

          const { rooms = [], followedRooms = [], whisperRooms = [], protectedRooms = [] } = data;

          this.followList.replaceAllItems({ items: followedRooms.map(room => this.createRoomButton({ roomName: room.roomName })) });
          this.followList.addItems({
            items: whisperRooms.map((room) => {
              const { whisperTo, userName } = convertWhisperRoomName(room.roomName);

              return this.createWhisperButton({ roomName: `${userName} <-> ${whisperTo}`, data: room.roomName });
            }),
          });

          this.roomsList.replaceAllItems({
            items: rooms.map(room => this.createRoomButton({
              roomName: room.roomName,
              isProtected: protectedRooms.map(protectedRoom => protectedRoom.roomName).indexOf(room.roomName) > -1,
            })),
          });

          const listItem = findItem(this.followList, storageManager.getRoom());

          if (listItem) {
            this.selectedItem = listItem;
            this.selectedItem.classList.add('selectedItem');
          }
        });
      },
    });
  }

  appendTo(parentElement) {
    const main = document.getElementById('main');
    main.classList.add('multiMenu');

    keyHandler.addKey(13, () => { this.sendMessage(); });
    super.appendTo(parentElement);
    this.messageList.scroll();
  }

  leaveRoom({ roomName }) {
    const isWhisperRoom = roomName.indexOf('-whisper-') > -1;

    socketManager.emitEvent('unfollow', { isWhisperRoom, user: { userName: storageManager.getUserName() }, room: { roomName } }, ({ error }) => {
      if (error) {
        if (error.type === 'not allowed') {
          const unfollowBox = new ButtonBox({
            description: [
              'This is a system protected room. You may not unfollow it',
            ],
            buttons: [
              elementCreator.createButton({
                text: 'Understood',
                func: () => {
                  unfollowBox.removeView();
                },
              }),
            ],
          });

          unfollowBox.appendTo(this.element.parentElement);

          return;
        }

        console.log(error);

        return;
      }

      this.followList.removeItem({ name: roomName });

      if (isWhisperRoom) {
        this.userList.addItem({
          item: this.createWhisperButton({
            roomName: storageManager.getUserName(),
            whisperTo: roomName.split('-whisper-')[1],
          }),
        });
      } else {
        this.roomsList.addItem({ item: this.createRoomButton({ roomName }) });
      }

      eventCentral.triggerEvent({ event: eventCentral.Events.UNFOLLOWROOM, params: { room: { roomName } } });
    });
  }

  createWhisperButton({ roomName, whisperTo, data, isSelected }) {
    const { whisperTo: retrievedWhisperTo } = convertWhisperRoomName(data || roomName);
    const buttonClasses = [];

    if (isSelected) {
      buttonClasses.push('selected');
    }

    const button = elementCreator.createButton({
      data: data || roomName,
      text: whisperTo ? `${whisperTo}` : roomName,
      classes: buttonClasses,
      func: () => {
        this.lists.forEach(list => list.hideList());

        const userName = storageManager.getSelectedAlias() || storageManager.getUserName();
        const whisperRoomName = `${userName}-whisper-${whisperTo}`;

        if (this.selectedItem) {
          this.selectedItem.classList.remove('selectedItem');
        }

        button.classList.remove('selected');

        if (retrievedWhisperTo) {
          storageManager.setRoom(data || roomName);
        } else if (!this.followList.getItem({ name: whisperRoomName })) {
          socketManager.emitEvent('followWhisperRoom', { whisperTo, sender: { userName }, room: { roomName: whisperRoomName } }, ({ error }) => {
            if (error) {
              console.log(error);

              return;
            }

            eventCentral.triggerEvent({
              event: eventCentral.Events.FOLLOWROOM,
              params: { room: { roomName: `${userName} <-> ${whisperTo}` }, data: whisperRoomName, whisper: true },
            });
            storageManager.setRoom(whisperRoomName);
          });
        }
      },
      rightFunc: (event) => {
        const fragment = document.createDocumentFragment();
        this.optionsDiv.innerHTML = '';

        fragment.appendChild(elementCreator.createButton({
          text: `Unfollow "${roomName}"`,
          data: roomName,
          func: () => {
            this.lists.forEach(list => list.hideList());

            this.leaveRoom({ roomName: data });
            this.optionsDiv.classList.add('hide');
          },
        }));

        this.optionsDiv.appendChild(fragment);

        this.optionsDiv.style.top = `${event.pageY}px`;
        this.optionsDiv.style.left = `${event.pageX}px`;
        this.optionsDiv.classList.remove('hide');
      },
    });

    return button;
  }

  createRoomButton({ roomName, isProtected }) {
    const classes = [];
    let buttonText = roomName;

    if (/-team$/.test(roomName)) {
      buttonText = 'team';
    }

    if (isProtected) {
      classes.push('locked');
    }

    const button = elementCreator.createButton({
      classes,
      data: roomName,
      text: buttonText,
      func: () => {
        this.lists.forEach(list => list.hideList());

        if (this.selectedItem) {
          this.selectedItem.classList.remove('selectedItem');
        }

        button.classList.remove('selected');

        socketManager.emitEvent('authUserToRoom', { room: { roomName } }, ({ error, data }) => {
          if (error) {
            console.log(error);

            return;
          }

          const { isFollowing, room } = data;

          if (isFollowing) {
            storageManager.setRoom(room.roomName);

            return;
          }

          const followDialog = new DialogBox({
            description: ['Do you wish to enter the room? The members of the room will be informed of you entering it'],
            buttons: {
              left: {
                text: 'Cancel',
                eventFunc: () => {
                  followDialog.removeView();
                },
              },
              right: {
                text: 'Follow',
                eventFunc: () => {
                  const passwordInput = followDialog.inputs.find(({ inputName }) => inputName === 'password');

                  socketManager.emitEvent('follow', {
                    user: {
                      userName: storageManager.getUserName(),
                    },
                    room: {
                      roomName: room.roomName,
                      password: passwordInput ? passwordInput.inputElement.value : undefined,
                    },
                  }, ({ error: followError }) => {
                    if (followError) {
                      if (followError.type === 'not allowed') {
                        console.log(followError);
                        followDialog.changeExtraDescription({ text: ['Access denied', 'Incorrect password or access level'] });

                        return;
                      }

                      console.log(followError);
                      followDialog.changeExtraDescription({ text: ['Failed to join the room'] });

                      return;
                    }

                    button.parentElement.remove();
                    eventCentral.triggerEvent({
                      event: eventCentral.Events.FOLLOWROOM,
                      params: { room },
                    });

                    storageManager.setRoom(roomName);
                    followDialog.removeView();
                  });
                },
              },
            },
          });

          if (isProtected) {
            followDialog.addInput({
              placeholder: 'Password',
              inputName: 'password',
              type: 'password',
              isRequired: false,
            });
            followDialog.changeExtraDescription({ text: ['The room is protected. Enter the correct password'] });
          }

          followDialog.appendTo(this.element.parentElement);
        });
      },
      rightFunc: (event) => {
        const fragment = document.createDocumentFragment();
        this.optionsDiv.innerHTML = '';

        fragment.appendChild(elementCreator.createButton({
          text: `Unfollow "${roomName}"`,
          data: roomName,
          func: () => {
            this.lists.forEach(list => list.hideList());

            this.leaveRoom({ roomName });
            this.optionsDiv.classList.add('hide');
          },
        }));
        // fragment.appendChild(elementCreator.createButton({
        //   text: `Remove "${roomName}"`,
        //   data: roomName,
        //   func: () => {
        //     this.leaveRoom({ roomName });
        //   },
        // }));

        this.optionsDiv.appendChild(fragment);

        this.optionsDiv.style.top = `${event.pageY}px`;
        this.optionsDiv.style.left = `${event.pageX}px`;
        this.optionsDiv.classList.remove('hide');
      },
    });

    return button;
  }
}

module.exports = Messenger;
