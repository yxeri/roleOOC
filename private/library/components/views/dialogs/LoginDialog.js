/*
 Copyright 2018 Aleksandar Jankovic

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

const BaseDialog = require('./BaseDialog');

const dataHandler = require('../../../data/DataHandler');
const eventCentral = require('../../../EventCentral');
const elementCreator = require('../../../ElementCreator');
const labelHandler = require('../../../labels/LabelHandler');
const socketManager = require('../../../SocketManager');

const ids = {
  USERNAME: 'username',
  PASSWORD: 'password',
};

class LoginDialog extends BaseDialog {
  constructor({
    classes = [],
    elementId = `lDialog-${Date.now()}`,
  }) {
    const inputs = [
      elementCreator.createInput({
        elementId: `${elementId}${ids.USERNAME}`,
        inputName: 'username',
        type: 'text',
        isRequired: true,
        maxLength: 20,
        placeholder: labelHandler.getLabel({ baseObject: 'LoginDialog', label: 'username' }),
      }),
      elementCreator.createInput({
        elementId: `${elementId}${ids.PASSWORD}`,
        inputName: 'password',
        type: 'password',
        isRequired: true,
        maxLength: 40,
        placeholder: labelHandler.getLabel({ baseObject: 'LoginDialog', label: 'password' }),
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
        text: labelHandler.getLabel({ baseObject: 'LoginDialog', label: 'login' }),
        clickFuncs: {
          leftFunc: () => {
            if (this.hasEmptyRequiredInputs()) {
              return;
            }

            socketManager.login({
              username: this.getInputValue(ids.USERNAME),
              password: this.getInputValue(ids.PASSWORD),
              callback: ({ error }) => {
                if (error) {
                  this.updateLowerText({
                    text: [labelHandler.getLabel({ baseObject: 'LoginDialog', label: 'incorrect' })],
                  });

                  this.setInputValue({
                    elementId: ids.PASSWORD,
                    value: '',
                  });

                  return;
                }

                this.setInputValue({
                  elementId: ids.PASSWORD,
                  value: '',
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
      classes: classes.concat(['loginDialog']),
    });
  }
}

module.exports = LoginDialog;
