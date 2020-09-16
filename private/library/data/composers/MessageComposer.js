import DataComposer from './BaseComposer';

import dataHandler from '../DataHandler';
import eventCentral from '../../EventCentral';
import storageManager from '../../StorageManager';
import socketManager from '../../SocketManager';

class MessageComposer extends DataComposer {
  constructor() {
    super({
      handler: dataHandler.messages,
      completionEvent: eventCentral.Events.COMPLETE_MESSAGE,
      dependencies: [
        dataHandler.messages,
        dataHandler.rooms,
        dataHandler.users,
        dataHandler.teams,
      ],
    });

    this.MessageTypes = {
      CHAT: 'chat',
      WHISPER: 'whisper',
      BROADCAST: 'broadcast',
      MESSAGE: 'message',
    };
  }

  getMessage({
    messageId,
  }) {
    return this.handler.getObject({ objectId: messageId });
  }

  fetchMessagesByRoom({
    roomId,
    callback,
  }) {
    this.handler.fetchObjects({
      event: socketManager.EmitTypes.GETROOMMSGS,
      emitParams: { roomId },
      callback: ({ error: getError }) => {
        if (getError) {
          console.log('get messages error', getError);
        }

        callback({ error: getError });
      },
    });
  }

  getMessagesByRoom({
    roomId,
  }) {
    return this.handler.getObjects({
      filter: {
        rules: [
          { paramName: 'roomId', paramValue: roomId },
        ],
      },
    });
  }

  sendMessage({
    participantIds,
    message,
    image,
    callback,
  }) {
    const messageToSend = message;
    messageToSend.ownerAliasId = storageManager.getAliasId();
    messageToSend.teamId = storageManager.getTeamId();

    this.handler.createObject({
      callback,
      params: {
        participantIds,
        image,
        message: messageToSend,
      },
    });
  }

  updateMessage({
    message,
    messageId,
    callback,
  }) {
    this.handler.updateObject({
      callback,
      params: {
        messageId,
        message,
      },
    });
  }

  removeMessage({
    messageId,
    callback,
  }) {
    this.handler.removeObject({
      callback,
      params: { messageId },
    });
  }
}

const messageComposer = new MessageComposer();

export default messageComposer;
