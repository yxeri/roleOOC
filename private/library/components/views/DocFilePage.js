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

const BaseView = require('./BaseView');

const docFileComposer = require('../../data/composers/DocFileComposer');
const eventCentral = require('../../EventCentral');
const elementCreator = require('../../ElementCreator');

/**
 * Create header part of the document.
 * @param {Object} params - Parameters.
 * @param {Object} params.docFile - Document to create header for.
 * @return {HTMLElement} Header paragraph.
 */
function createHeader({ docFile }) {
  const elements = [
    elementCreator.createSpan({ text: docFile.title }),
    elementCreator.createSpan({ text: docFile.ownerAliasId || docFile.ownerId }),
    elementCreator.createSpan({ text: docFile.code }),
  ];

  if (docFile.team) {
    elements.push(elementCreator.createSpan({ text: docFile.team }));
  }

  return elementCreator.createParagraph({ elements });
}

/**
 * Create body part of the document.
 * @param {Object} params - Parameters.
 * @param {Object} params.docFile - Document to create body for.
 * @return {DocumentFragment} Body fragment.
 */
function createBody({ docFile }) {
  const fragment = document.createDocumentFragment();

  docFile.text.forEach((section) => {
    fragment.appendChild(elementCreator.createParagraph({ text: section }));
  });

  return fragment;
}

class DocFilePage extends BaseView {
  constructor({
    classes = [],
    elementId = `dFPage-${Date.now()}`,
  }) {
    super({
      elementId,
      classes: classes.concat(['docFilePage']),
    });

    eventCentral.addWatcher({
      event: eventCentral.Events.OPEN_DOCFILE,
      func: ({ docFile }) => {
        const storedDocFile = docFileComposer.getDocFile({ docFileId: docFile.objectId });
        const newElement = elementCreator.createContainer({
          elementId,
          classes,
        });

        newElement.appendChild(createHeader({ docFile: storedDocFile }));
        newElement.appendChild(createBody({ docFile: storedDocFile }));

        this.replaceOnParent({ element: newElement });
      },
    });
  }
}

module.exports = DocFilePage;
