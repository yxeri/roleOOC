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

const BaseDialog = require('./BaseDialog');

const elementCreator = require('../../../ElementCreator');
const labelHandler = require('../../../labels/LabelHandler');
const positionComposer = require('../../../data/composers/PositionComposer');

const ids = {
  CREATEPOSITIONNAME: 'createPositionName',
  CREATEPOSITIONDESCRIPTION: 'createPositionDescription',
  POSITIONTYPE: 'createPositionType',
  POSITIONPOINT: 'createPositionPoint',
  POSITIONCIRCLE: 'createPositionCircle',
};

class MessageDialog extends BaseDialog {
  constructor({
    latitude,
    longitude,
    classes = [],
    elementId = `posDialog-${Date.now()}`,
  }) {
    super({
      elementId,
      classes: classes.concat(['PositionDialog']),
      lowerButtons: [
        elementCreator.createButton({
          text: labelHandler.getLabel({ baseObject: 'BaseDialog', label: 'cancel' }),
          clickFuncs: {
            leftFunc: () => {
              this.removeFromView();
            },
          },
        }),
        elementCreator.createButton({
          text: labelHandler.getLabel({ baseObject: 'BaseDialog', label: 'create' }),
          clickFuncs: {
            leftFunc: () => {
              const position = {
                coordinates: {
                  longitude,
                  latitude,
                },
                positionName: this.getInputValue(ids.CREATEPOSITIONNAME),
                isStationary: true,
              };
              const description = this.getInputValue(ids.CREATEPOSITIONDESCRIPTION);

              if (description) {
                position.description = description.split('\n');
              }

              if (document.getElementById(ids.POSITIONCIRCLE).checked) {
                position.positionStructure = positionComposer.PositionStructures.CIRCLE;
              }

              positionComposer.createPosition({
                position,
                callback: ({ error }) => {
                  if (error) {
                    console.log('Create position', error);

                    return;
                  }

                  this.removeFromView();
                },
              });
            },
          },
        }),
      ],
      inputs: [
        elementCreator.createInput({
          elementId: ids.CREATEPOSITIONNAME,
          inputName: 'positionName',
          type: 'text',
          isRequired: true,
          placeholder: labelHandler.getLabel({ baseObject: 'MapObject', label: 'createPositionName' }),
        }),
        elementCreator.createInput({
          elementId: ids.CREATEPOSITIONDESCRIPTION,
          inputName: 'positionDescription',
          type: 'text',
          multiLine: true,
          placeholder: labelHandler.getLabel({ baseObject: 'MapObject', label: 'createPositionDescription' }),
        }),
        elementCreator.createRadioSet({
          elementId: ids.POSITIONTYPE,
          title: 'Type of position',
          optionName: 'visibility',
          options: [
            {
              optionId: ids.POSITIONPOINT,
              optionLabel: 'Point',
              value: 'public',
              isDefault: true,
            }, {
              optionId: ids.POSITIONCIRCLE,
              optionLabel: 'Circle',
              value: 'private',
            },
          ],
        }),
      ],
    });
  }
}

module.exports = MessageDialog;
