/*
 Copyright 2018 Carmilla Mina Jankovic

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

const ViewWrapper = require('../ViewWrapper');
const MessageList = require('../lists/MessageList');
const RoomList = require('../lists/RoomList');
const InputArea = require('./inputs/InputArea');
const UserList = require('../lists/UserList');
const WhisperRoomList = require('../lists/WhisperRoomList');
const RoomFollowingList = require('../lists/RoomFollowingList');
const RoomInfo = require('./RoomInfo');

const messageComposer = require('../../data/composers/MessageComposer');
const accessCentral = require('../../AccessCentral');
const roomComposer = require('../../data/composers/RoomComposer');
const eventCentral = require('../../EventCentral');
const storageManager = require('../../StorageManager');
const textTools = require('../../TextTools');
const viewSwitcher = require('../../ViewSwitcher');

class ChatView extends ViewWrapper {
  constructor({
    effect,
    shouldResize,
    placeholder,
    title,
    whisperText,
    showTeam,
    allowImages,
    hideDate,
    fullDate,
    showUserImage = true,
    titles = {
      rooms: 'Rooms',
      following: 'Following',
      whispers: 'Whispers',
      users: 'Users',
    },
    sendOnEnter = false,
    hideRoomList = false,
    classes = [],
    roomListPlacement = 'left',
    inputPlacement = 'bottom',
    elementId = `chView-${Date.now()}`,
  }) {
    const roomList = new RoomList({
      effect,
      minimumAccessLevel: accessCentral.AccessLevels.STANDARD,
      title: titles.rooms,
    });
    const roomFollowingList = new RoomFollowingList({
      effect,
      minimumAccessLevel: accessCentral.AccessLevels.STANDARD,
      title: titles.following,
    });
    const whisperRoomList = new WhisperRoomList({
      effect,
      whisperText,
      minimumAccessLevel: accessCentral.AccessLevels.STANDARD,
      title: titles.whispers,
    });
    const userList = new UserList({
      effect,
      showImage: showUserImage,
      minimumAccessLevel: accessCentral.AccessLevels.STANDARD,
      title: titles.users,
      shouldFocusOnClick: false,
    });
    const messageList = new MessageList({
      effect,
      whisperText,
      showTeam,
      fullDate,
      hideDate,
      shouldSwitchRoom: true,
      roomLists: [
        roomFollowingList,
        whisperRoomList,
        roomList,
        userList,
      ],
    });
    const inputArea = new InputArea({
      shouldResize,
      placeholder,
      sendOnEnter,
      allowImages,
      minimumAccessLevel: storageManager.getPermissions().SendMessage
        ? storageManager.getPermissions().SendMessage.accessLevel
        : accessCentral.AccessLevels.STANDARD,
      classes: [inputPlacement],
      triggerCallback: ({ text }) => {
        const roomId = messageList.getRoomId();
        const room = roomComposer.getRoom({ roomId });
        const participantIds = room.isWhisper
          ? room.participantIds
          : [];
        const message = {
          text,
          roomId,
        };

        if (room.isUser) {
          message.messageType = messageComposer.MessageTypes.WHISPER;
          participantIds.push(storageManager.getAliasId() || storageManager.getUserId());
          participantIds.push(roomId);
        } else if (room.isWhisper) {
          message.messageType = messageComposer.MessageTypes.WHISPER;
        } else {
          message.messageType = messageComposer.MessageTypes.CHAT;
        }

        const imagePreview = document.getElementById('imagePreview-input');
        let image;

        if (imagePreview.getAttribute('src')) {
          image = {
            source: imagePreview.getAttribute('src'),
            imageName: imagePreview.getAttribute('name'),
            width: imagePreview.naturalWidth,
            height: imagePreview.naturalHeight,
          };
        }

        if (!image && textTools.trimSpace(text.join('')).length === 0) {
          return;
        }

        messageComposer.sendMessage({
          message,
          image,
          participantIds,
          callback: ({ error, data }) => {
            if (error) {
              console.log('sendMessage', error);

              return;
            }

            this.inputArea.clearInput();

            const { message: newMessage } = data;

            if (room.isUser) {
              eventCentral.emitEvent({
                event: eventCentral.Events.SWITCH_ROOM,
                params: {
                  listType: roomList.ListTypes.ROOMS,
                  room: { objectId: newMessage.roomId },
                },
              });
            }
          },
        });
      },
      focusCallback: () => {},
      blurCallback: () => {},
      inputCallback: () => {},
    });
    const roomInfo = new RoomInfo({
      whisperText,
    });
    const columns = [];
    const mainColumn = {
      components: [{ component: roomInfo }],
      classes: ['columnChat'],
    };
    const roomListColumn = {
      components: [
        { component: roomFollowingList },
        { component: whisperRoomList },
        { component: roomList },
        { component: userList },
      ],
      classes: [
        'columnList',
        'columnRoomList',
      ],
    };

    switch (inputPlacement) {
      case 'top': {
        mainColumn.components.push({ component: inputArea });
        mainColumn.components.push({ component: messageList });

        break;
      }
      default: {
        mainColumn.components.push({ component: messageList });
        mainColumn.components.push({ component: inputArea });

        break;
      }
    }

    if (!hideRoomList) {
      messageList.setRoomListId(roomList.getElementId());

      switch (roomListPlacement) {
        case 'left': {
          columns.push(roomListColumn);
          columns.push(mainColumn);

          break;
        }
        default: {
          columns.push(mainColumn);
          columns.push(roomListColumn);

          break;
        }
      }
    } else {
      columns.push(mainColumn);
    }

    super({
      elementId,
      columns,
      title,
      classes: classes.concat(['chatView']),
    });

    this.inputArea = inputArea;
    this.whisperRoomList = whisperRoomList;
    this.userRoomList = userList;
    this.messageList = messageList;
    this.roomList = roomList;

    eventCentral.addWatcher({
      event: eventCentral.Events.VIEW_SWITCHED,
      func: ({ view }) => {
        if (view.viewType === viewSwitcher.ViewTypes.CHAT) {
          this.messageList.scrollList();
        }
      },
    });
  }

  addToView(params) {
    this.inputArea.showView();

    super.addToView(params);
  }

  removeFromView() {
    super.removeFromView();

    this.inputArea.hideView();
  }
}

module.exports = ChatView;
