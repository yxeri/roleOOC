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

import BaseDialog from './BaseDialog';

import elementCreator from '../../../ElementCreator';
import labelHandler from '../../../labels/LabelHandler';
import roomComposer from '../../../data/composers/RoomComposer';
import eventCentral from '../../../EventCentral';

const ids = {
  ROOMNAME: 'roomName',
  PASSWORD: 'password',
  REPEATPASSWORD: 'repeatPassword',
  TOPIC: 'topic',
};

class RoomDialog extends BaseDialog {
  constructor({
    classes = [],
    elementId = `rDialog-${Date.now()}`,
  }) {
    const inputs = [
      elementCreator.createInput({
        elementId: ids.ROOMNAME,
        inputName: 'roomName',
        type: 'text',
        isRequired: true,
        maxLength: 20,
        placeholder: labelHandler.getLabel({ baseObject: 'RoomDialog', label: 'roomName' }),
      }),
      elementCreator.createInput({
        elementId: ids.TOPIC,
        inputName: 'topic',
        type: 'text',
        multiLine: true,
        maxLength: 300,
        placeholder: labelHandler.getLabel({ baseObject: 'RoomDialog', label: 'topic' }),
      }),
      elementCreator.createInput({
        elementId: ids.PASSWORD,
        inputName: 'password',
        type: 'password',
        maxLength: 40,
        placeholder: labelHandler.getLabel({ baseObject: 'RoomDialog', label: 'password' }),
      }),
      elementCreator.createInput({
        elementId: ids.REPEATPASSWORD,
        inputName: 'repeatPassword',
        type: 'password',
        maxLength: 40,
        placeholder: labelHandler.getLabel({ baseObject: 'RoomDialog', label: 'repeatPassword' }),
      }),
    ];
    const lowerButtons = [
      elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'BaseDialog', label: 'cancel' }),
        clickFuncs: {
          leftFunc: () => { this.removeFromView(); },
        },
      }),
      elementCreator.createButton({
        text: labelHandler.getLabel({ baseObject: 'BaseDialog', label: 'create' }),
        clickFuncs: {
          leftFunc: () => {
            if (this.hasEmptyRequiredInputs()) {
              return;
            }

            if (this.getInputValue(ids.PASSWORD) !== '' && this.getInputValue(ids.PASSWORD) !== this.getInputValue(ids.REPEATPASSWORD)) {
              BaseDialog.markInput({ input: this.getElement(ids.PASSWORD) });
              BaseDialog.markInput({ input: this.getElement(ids.REPEATPASSWORD) });

              this.setInputValue({ elementId: ids.PASSWORD, value: '' });
              this.setInputValue({ elementId: ids.REPEATPASSWORD, value: '' });

              return;
            }

            roomComposer.createRoom({
              room: {
                roomName: this.getInputValue(ids.ROOMNAME),
                password: this.getInputValue(ids.PASSWORD),
                topic: this.getInputValue(ids.TOPIC),
              },
              callback: ({ data, error }) => {
                if (error) {
                  if (error.type === 'invalid length') {
                    switch (error.extraData.param) {
                      case 'roomName': {
                        this.updateLowerText({ text: [labelHandler.getLabel({ baseObject: 'RoomDialog', label: 'roomNameLength' })] });

                        break;
                      }
                      case 'password': {
                        this.updateLowerText({ text: [labelHandler.getLabel({ baseObject: 'RoomDialog', label: 'passwordLength' })] });

                        break;
                      }
                      case 'topic': {
                        this.updateLowerText({ text: [labelHandler.getLabel({ baseObject: 'RoomDialog', label: 'topicLength' })] });

                        break;
                      }
                      default: {
                        this.updateLowerText({ text: [labelHandler.getLabel({ baseObject: 'BaseDialog', label: 'error' })] });

                        break;
                      }
                    }
                  }

                  return;
                }

                const { room: createdRoom } = data;

                eventCentral.emitEvent({
                  event: eventCentral.Events.FOLLOWED_ROOM,
                  params: {
                    room: { objectId: createdRoom.objectId },
                  },
                });

                this.removeFromView();
              },
            });
          },
        },
      }),
    ];

    super({
      elementId,
      inputs,
      lowerButtons,
      upperText: [labelHandler.getLabel({ baseObject: 'RoomDialog', label: 'createRoom' })],
      classes: classes.concat(['RoomDialog']),
    });
  }
}

export default RoomDialog;
