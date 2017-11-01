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
const elementCreator = require('../../ElementCreator');
const socketManager = require('../../SocketManager');
const storageManager = require('../../StorageManager');
const eventCentral = require('../../EventCentral');
const soundLibrary = require('../../audio/SoundLibrary');
const textTools = require('../../TextTools');

// TODO Duplicate code in DialogBox
/**
 * Mark empty fields. Returns true if one of them were empty
 * @param {HTMLInputElement[]} inputs - Inputs to check
 * @returns {boolean} Is one of the fields empty?
 */
function markEmptyFields(inputs) {
  let emptyFields = false;

  inputs.forEach((input) => {
    if (input.value === '') {
      emptyFields = true;
      input.classList.add('markedInput');
    }
  });

  return emptyFields;
}

/**
 * Create alias button. Will set alias input on click
 * @param {string} params.alias Alias to set
 * @returns {HTMLElement} Alias button
 */
function createAliasButton({ alias }) {
  return elementCreator.createButton({
    data: alias,
    text: alias,
    func: () => {
      const aliasInput = document.getElementById('creatorAlias');
      console.log(aliasInput);

      if (aliasInput) {
        aliasInput.value = document.createTextNode(alias).textContent;
      }
    },
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

class DirViewer extends StandardView {
  constructor({ isFullscreen }) {
    super({ isFullscreen });

    this.element.setAttribute('id', 'dirViewer');
    this.viewer.classList.add('selectedView');
    this.selectedItem = null;
    this.systemList = new List({
      shouldSort: false,
      title: 'system',
      titleCallback: () => {
        this.lists.forEach((list) => {
          if (this.systemList !== list) {
            list.hideList();
          }
        });
      },
    });
    this.aliasList = new List({ title: 'ALIASES', shouldSort: true, minimumToShow: 2 });
    this.dirList = new List({
      viewId: 'dirList',
      shouldSort: true,
      title: 'dir',
      titleCallback: () => {
        this.lists.forEach((list) => {
          if (this.dirList !== list) {
            list.hideList();
          }
        });
      },
    });
    this.myFiles = new List({
      viewId: 'myDir',
      shouldSort: true,
      title: 'my_files',
      titleCallback: () => {
        this.lists.forEach((list) => {
          if (this.myFiles !== list) {
            list.hideList();
          }
        });
      },
    });
    this.myTeamFiles = new List({ viewId: 'myTeamDir', shouldSort: true, title: 'My Team' });
    this.teamFiles = new List({ viewId: 'teamDir', shouldSort: true, title: 'teams' });
    // Team name : List
    this.teamLists = {};

    this.lists = [
      this.systemList,
      this.dirList,
      this.myFiles,
    ];

    this.populateList();
  }

  showDoc(docFile) {
    const docFragment = document.createDocumentFragment();
    const system = elementCreator.createContainer({});
    const edit = elementCreator.createContainer({
      classes: ['button'],
      func: () => {
        this.editDocFile(docFile);
      },
    });

    edit.appendChild(elementCreator.createContainer({ classes: ['buttonLeftCorner'] }));
    edit.appendChild(elementCreator.createContainer({ classes: ['buttonUpperRightCorner'] }));
    edit.appendChild(elementCreator.createSpan({ text: 'edit doc' }));

    system.appendChild(edit);

    if (docFile.creator === storageManager.getUserName()) {
      docFragment.appendChild(system);
    }

    docFragment.appendChild(elementCreator.createParagraph({ text: `${docFile.title}`, classes: ['title'] }));
    docFragment.appendChild(elementCreator.createParagraph({ text: `Creator: ${docFile.customCreator || docFile.creator}` }));
    docFragment.appendChild(elementCreator.createParagraph({ text: `ID: ${docFile.docFileId.toUpperCase()}` }));
    docFragment.appendChild(elementCreator.createParagraph({ text: `Public: ${docFile.isPublic ? 'Yes' : 'No'}` }));
    docFragment.appendChild(elementCreator.createParagraph({ text: '------' }));

    docFile.text.forEach((line) => {
      const classes = [];

      if (line === '') {
        classes.push('emptyParagraph');
      }

      docFragment.appendChild(elementCreator.createParagraph({ text: line, classes }));
    });

    this.viewer.classList.remove('flash');

    setTimeout(() => {
      this.viewer.innerHTML = '';
      this.viewer.classList.add('flash');
      this.viewer.scrollTop = this.viewer.scrollHeight;
      this.viewer.appendChild(docFragment);
    }, 100);
  }

  createDocFileButton(docFile) {
    const title = `${docFile.title || docFile.docFileId}`;
    const button = elementCreator.createButton({
      data: docFile.docFileId,
      text: title,
      func: () => {
        const docFileId = button.getAttribute('data');
        this.lists.forEach(list => list.hideList());

        if (docFileId || docFile.team === storageManager.getTeam() || (docFile.customCreator && storageManager.getCreatorAliases().indexOf(docFile.customCreator) > -1)) {
          socketManager.emitEvent('getDocFile', { docFileId, title: docFile.title }, ({ error: docFileError, data: docFileData }) => {
            if (docFileError) {
              console.log(docFileError);

              const paragraph = elementCreator.createParagraph({ text: 'Something went wrong. Unable to get file' });

              this.viewer.innerHTML = '';
              this.viewer.appendChild(paragraph);

              return;
            } else if (!docFileData.docFile) {
              const paragraph = elementCreator.createParagraph({ text: 'File not found' });

              this.viewer.innerHTML = '';
              this.viewer.appendChild(paragraph);
            }

            this.showDoc(docFileData.docFile);
          });
        } else {
          const deniedDialog = new DialogBox({
            buttons: {
              left: {
                text: 'Cancel',
                eventFunc: () => {
                  deniedDialog.removeView();
                },
              },
              right: {
                text: 'Unlock',
                eventFunc: () => {
                  if (deniedDialog.markEmptyFields()) {
                    soundLibrary.playSound('fail');
                    deniedDialog.changeExtraDescription({ text: ['You cannot leave obligatory fields empty!'] });

                    return;
                  }

                  const docFileIdValue = deniedDialog.inputs.find(({ inputName }) => inputName === 'docFileId').inputElement.value;

                  socketManager.emitEvent('getDocFile', { docFileId: docFileIdValue }, ({ error: docFileError, data: docFileData }) => {
                    if (docFileError) {
                      if (docFileError.type === 'does not exist') {
                        deniedDialog.changeExtraDescription({ text: ['Incorrect code', 'Access denied'] });

                        return;
                      }

                      deniedDialog.changeExtraDescription({ text: ['Soemthing went wrong', 'Unable to retrieve document'] });

                      return;
                    }

                    const { team, docFileId: sentId, title: sentTitle } = docFileData.docFile;
                    const creator = docFileData.docFile.customCreator || docFileData.docFile.creator;

                    if (team) {
                      const item = this.teamLists[team].getItem({ name: sentTitle });

                      item.firstElementChild.setAttribute('data', sentId);
                      item.firstElementChild.classList.remove('locked');
                    } else {
                      const item = this.dirList[creator].getItem({ name: sentTitle });

                      item.firstElementChild.setAttribute('data', sentId);
                      item.firstElementChild.classList.remove('locked');
                    }

                    if (this.selectedItem) {
                      this.selectedItem.classList.remove('selectedItem');
                    }

                    this.selectedItem = button.parentElement;
                    this.selectedItem.classList.add('selectedItem');

                    deniedDialog.removeView();
                    this.showDoc(docFileData.docFile);
                  });
                },
              },
            },
            description: ['Access denied. File is locked'],
            extraDescription: ['Please enter the file code to unlock it'],
            inputs: [{
              placeholder: 'File code',
              inputName: 'docFileId',
              isRequired: true,
            }],
          });

          deniedDialog.appendTo(this.element.parentElement);
        }
      },
    });

    if ((docFile.isLocked || !docFile.docFileId) && docFile.team !== storageManager.getTeam() && (!docFile.customCreator || storageManager.getCreatorAliases().indexOf(docFile.customCreator) === -1)) {
      button.classList.add('locked');
    }

    return button;
  }

  editDocFile(docFile) {
    this.viewer.innerHTML = '';

    const docFragment = document.createDocumentFragment();
    const titleInput = elementCreator.createInput({ placeholder: 'Title', inputName: 'docTitle', isRequired: true, maxLength: 40 });
    const idInput = elementCreator.createInput({ placeholder: 'Code to access the document with [a-z, 0-9]', inputName: 'docId', isRequired: true, maxLength: 10 });
    const bodyInput = elementCreator.createInput({ placeholder: 'Text', inputName: 'docBody', isRequired: true, multiLine: true, maxLength: 6000 });
    const visibilitySet = elementCreator.createRadioSet({
      title: 'Who should be able to view the document? Those with the correct code will always be able to view the document.',
      optionName: 'visibility',
      options: [
        { optionId: 'visPublic', optionLabel: 'Everyone' },
        { optionId: 'visPrivate', optionLabel: 'Only those with the correct code' },
      ],
    });
    const buttons = elementCreator.createContainer({ classes: ['buttons'] });

    // TODO Duplicate code in Messenger
    bodyInput.addEventListener('input', () => {
      bodyInput.style.height = 'auto';
      bodyInput.style.height = `${bodyInput.scrollHeight}px`;
    });

    docFragment.appendChild(titleInput);
    docFragment.appendChild(idInput);

    docFragment.appendChild(bodyInput);
    docFragment.appendChild(visibilitySet);

    if (docFile) {
      titleInput.value = docFile.title;
      idInput.value = document.createTextNode(docFile.docFileId).textContent;
      idInput.setAttribute('disabled', 'true');
      idInput.classList.add('locked');

      if (docFile.isPublic) {
        docFragment.getElementById('visPublic').setAttribute('checked', 'true');
      } else {
        docFragment.getElementById('visPrivate').setAttribute('checked', 'true');
      }

      bodyInput.innerHTML = '';
      bodyInput.value = document.createTextNode(docFile.text.join('\n')).textContent;
    }

    const save = elementCreator.createContainer({
      classes: ['button'],
      func: () => {
        console.log('save');
        if (!markEmptyFields([titleInput, bodyInput, idInput])) {
          const docId = textTools.trimSpace(idInput.value);
          const docIdAllowed = textTools.isInternationalAllowed(docId);

          if (!docIdAllowed) {
            idInput.classList.add('markedInput');
            idInput.setAttribute('placeholder', 'Has to be alphanumerical (a-z, 0-9)');
            idInput.value = '';

            return;
          }

          const newDocFile = {
            title: titleInput.value,
            docFileId: docId,
            text: bodyInput.value.split('\n'),
            customCreator: storageManager.getSelectedAlias(),
            isPublic: document.getElementById('visPublic').checked === true,
          };
          const updateExisting = typeof docFile !== 'undefined';
          const eventName = updateExisting ? 'updateDocFile' : 'createDocFile';

          socketManager.emitEvent(eventName, { docFile: newDocFile, userName: storageManager.getUserName() }, ({ error: docFileError }) => {
            if (docFileError) {
              if (docFileError.type === 'not allowed') {

                return;
              } else if (docFileError.type === 'invalid characters') {
                idInput.setAttribute('placeholder', 'ID already exists');
                idInput.value = '';
                idInput.classList.add('markedInput');
                titleInput.setAttribute('placeholder', 'Title already exists');
                titleInput.value = '';
                titleInput.classList.add('markedInput');

                return;
              } else if (docFileError.type === 'already exists') {
                const extraData = docFileError.extraData;

                if (extraData) {
                  if (extraData.title) {
                    titleInput.setAttribute('placeholder', 'Title already exists');
                    titleInput.value = '';
                    titleInput.classList.add('markedInput');
                  }

                  if (extraData.docFileId) {
                    idInput.setAttribute('placeholder', 'ID already exists');
                    idInput.value = '';
                    idInput.classList.add('markedInput');
                  }
                } else {
                  idInput.setAttribute('placeholder', 'ID already exists');
                  idInput.value = '';
                  idInput.classList.add('markedInput');
                  titleInput.setAttribute('placeholder', 'Title already exists');
                  titleInput.value = '';
                  titleInput.classList.add('markedInput');
                }
              }

              return;
            }

            this.viewer.innerHTML = '';
            this.viewer.appendChild(document.createTextNode('doc uploaded'));

            if (updateExisting) {
              this.myFiles.removeItem({ name: docFile.docFileId });
            }

            eventCentral.triggerEvent({ event: eventCentral.Events.CREATEDOCFILE, params: { docFile: newDocFile } });
          });
        }
      },
    });

    save.appendChild(elementCreator.createContainer({ classes: ['buttonLeftCorner'] }));
    save.appendChild(elementCreator.createContainer({ classes: ['buttonUpperRightCorner'] }));
    save.appendChild(elementCreator.createSpan({ text: 'save' }));

    buttons.appendChild(save);
    docFragment.appendChild(buttons);

    this.viewer.appendChild(docFragment);
    // Trigger resize to fit text, if editing an existing doc
    bodyInput.dispatchEvent(new Event('input'));
  }

  populateList() {
    const searchButton = elementCreator.createButton({
      text: 'id_search',
      func: () => {
        this.lists.forEach(list => list.hideList());

        const idDialog = new DialogBox({
          buttons: {
            left: {
              text: 'cancel',
              eventFunc: () => {
                idDialog.removeView();
              },
            },
            right: {
              text: 'search',
              eventFunc: () => {
                const emptyFields = idDialog.markEmptyFields();

                if (emptyFields) {
                  soundLibrary.playSound('fail');
                  idDialog.changeExtraDescription({ text: ['You cannot leave obligatory fields empty!'] });

                  return;
                }

                const docFileId = idDialog.inputs.find(({ inputName }) => inputName === 'docFileId').inputElement.value.toLowerCase();

                socketManager.emitEvent('getDocFile', { docFileId }, ({ error: docError, data: { docFile } }) => {
                  if (docError) {
                    console.log(docError);

                    return;
                  } else if (!docFile || docFile === null) {
                    idDialog.changeExtraDescription({ text: ['Unable to retrieve document with sent ID. Please try again'] });

                    return;
                  }

                  this.showDoc(docFile);
                  idDialog.removeView();
                });
              },
            },
          },
          inputs: [{
            placeholder: 'Document ID',
            inputName: 'docFileId',
            isRequired: true,
            maxLength: 10,
          }],
          description: [
            'Retrieve a document from the archives',
          ],
          extraDescription: ['Enter the ID of the document'],
        });
        idDialog.appendTo(this.element.parentElement);
      },
    });
    const createButton = elementCreator.createButton({
      classes: ['hide'],
      text: 'Create doc',
      func: () => {
        this.lists.forEach(list => list.hideList());
        this.editDocFile();
      },
    });

    this.systemList.addItems({ items: [searchButton, createButton] });

    this.itemList.appendChild(this.systemList.element);
    // this.itemList.appendChild(this.aliasList.element);
    this.itemList.appendChild(this.myFiles.element);
    this.itemList.appendChild(this.myTeamFiles.element);
    this.itemList.appendChild(this.dirList.element);
    this.itemList.appendChild(elementCreator.createContainer({ classes: ['menuRightCorner'] }));

    this.accessElements.push({
      element: createButton,
      accessLevel: 1,
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.DOCFILE,
      func: ({ docFile, updating, oldTitle, oldTeam }) => {
        const userName = storageManager.getSelectedAlias() || storageManager.getUserName();
        const creator = docFile.customCreator || docFile.creator;
        const docTeam = docFile.team;
        let previous;

        if (oldTitle && updating && ((!oldTeam && docFile.team) || (oldTeam && !docFile.team))) {
          const userTeam = storageManager.getTeam();

          if (!oldTeam && docFile.team) {
            const list = this.dirList[creator];

            if (list) {
              previous = list.getItem({ name: oldTitle });
              list.removeItem({ name: oldTitle });
            }
          } else if (oldTeam && !docFile.team) {
            if (userTeam && userTeam === oldTeam) {
              this.myTeamFiles.removeItem({ name: oldTitle });
            } else {
              const list = this.teamLists[oldTeam];

              if (list) {
                previous = list.getItem({ name: oldTitle });
                list.removeItem({ name: oldTitle });
              }
            }
          }
        }

        if (creator === userName) {
          this.myFiles.addItem({ item: this.createDocFileButton(docFile), shouldReplace: updating, oldTitle });
        } else if (docTeam && docTeam !== '') {
          if (docTeam === storageManager.getTeam()) {
            this.myTeamFiles.addItem({ item: this.createDocFileButton(docFile), shouldReplace: updating, oldTitle });
          } else {
            const list = this.teamLists[docTeam];

            if (!list) {
              this.teamLists[docTeam] = new List({
                title: docTeam,
                shouldSort: true,
                showTitle: true,
                minimumToShow: 0,
              });
              this.teamLists[docTeam].addItem({ item: this.createDocFileButton(docFile), shouldReplace: updating, oldTitle });
              this.teamFiles.addItem({ item: this.teamLists[docTeam].element });
            } else {
              previous = previous || oldTitle ? list.getItem({ name: oldTitle }) : undefined;

              if (updating && previous && !docFile.docFileId) {
                docFile.docFileId = previous.getAttribute('data');
              }

              list.addItem({ item: this.createDocFileButton(docFile), shouldReplace: updating, oldTitle });
            }
          }
        } else {
          const list = this.dirList[creator];

          if (!list) {
            this.dirList[creator] = new List({
              title: creator,
              shouldSort: true,
              showTitle: true,
              minimumToShow: 0,
            });
            this.dirList[creator].addItem({ item: this.createDocFileButton(docFile), shouldReplace: updating, oldTitle });
            this.dirList.addItem({ item: this.dirList[creator].element });
          } else {
            previous = previous || oldTitle ? list.getItem({ name: oldTitle }) : undefined;

            if (updating && previous && !docFile.docFileId) {
              docFile.docFileId = previous.getAttribute('data');
            }

            list.addItem({ item: this.createDocFileButton(docFile), shouldReplace: updating, oldTitle });
          }
        }
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.NEWALIAS,
      func: ({ alias }) => {
        this.aliasList.addItem({ item: createAliasButton({ alias }) });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.NEWCREATORALIAS,
      func: ({ alias }) => {
        this.aliasList.addItem({ item: createAliasButton({ alias }) });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.CREATEDOCFILE,
      func: ({ docFile, updating }) => {
        this.myFiles.addItem({ item: this.createDocFileButton(docFile), shouldReplace: updating });
      },
    });

    eventCentral.addWatcher({
      watcherParent: this,
      event: eventCentral.Events.USER,
      func: ({ changedUser, firstConnection }) => {
        if (changedUser) {
          if (storageManager.getToken()) {
            const aliases = storageManager.getCreatorAliases().concat(storageManager.getAliases());

            if (aliases.length > 0) {
              this.aliasList.replaceAllItems({ items: aliases.map(alias => createAliasButton({ alias })) });
              this.aliasList.addItem({ item: createAliasButton({ alias: storageManager.getUserName() }) });

              if (firstConnection || changedUser) {
                this.aliasList.toggleList(true);
              }
            } else {
              const userName = storageManager.getUserName();

              this.aliasList.replaceAllItems({ items: [] });
              this.aliasList.addItem({ item: createAliasButton({ alias: userName }) });

              const listItem = findItem(this.aliasList, userName);

              if (listItem) {
                this.selectedItem = listItem;
                this.selectedItem.classList.add('selectedItem');
              }
            }
          } else {
            this.aliasList.replaceAllItems({ items: [] });
          }

          this.viewer.innerHTML = '';
          this.myFiles.replaceAllItems({ items: [] });
          this.myTeamFiles.replaceAllItems({ items: [] });
        }

        socketManager.emitEvent('getDocFiles', {}, ({ error, data }) => {
          if (error) {
            console.log(error);

            return;
          }

          const { myDocFiles = [], myTeamDocFiles = [], userDocFiles = [], teamDocFiles = [] } = data;
          const groupedUserDocs = {};
          const groupedTeamDocs = {};

          userDocFiles.forEach((docFile) => {
            const creator = docFile.customCreator || docFile.creator;

            if (!groupedUserDocs[creator]) {
              groupedUserDocs[creator] = [];
            }

            groupedUserDocs[creator].push(docFile);
          });
          teamDocFiles.forEach((docFile) => {
            if (!groupedTeamDocs[docFile.team]) {
              groupedTeamDocs[docFile.team] = [];
            }

            groupedTeamDocs[docFile.team].push(docFile);
          });

          this.myFiles.replaceAllItems({ items: myDocFiles.map(docFile => this.createDocFileButton(docFile)) });
          this.myTeamFiles.replaceAllItems({ items: myTeamDocFiles.map(docFile => this.createDocFileButton(docFile)) });
          this.dirList.replaceAllItems({
            items: Object.keys(groupedUserDocs).map((userName) => {
              const docs = groupedUserDocs[userName];
              const list = new List({
                items: docs.map(docFile => this.createDocFileButton(docFile)),
                title: userName,
                shouldSort: true,
                showTitle: true,
                minimumToShow: 0,
              });

              this.dirList[userName] = list;

              return list.element;
            }),
          });
          this.teamFiles.replaceAllItems({
            items: Object.keys(groupedTeamDocs).map((teamName) => {
              const docs = groupedTeamDocs[teamName];
              const list = new List({
                items: docs.map(docFile => this.createDocFileButton(docFile)),
                title: teamName,
                shouldSort: true,
                showTitle: true,
                minimumToShow: 0,
              });

              this.teamLists[teamName] = list;

              return list.element;
            }),
          });
        });
      },
    });
  }

  appendTo(parentElement) {
    const main = document.getElementById('main');
    main.classList.add('multiMenu');

    super.appendTo(parentElement);
  }

  removeView() {
    const main = document.getElementById('main');
    main.classList.remove('multiMenu');

    super.removeView();
    this.viewer.classList.remove('flash');
  }
}

module.exports = DirViewer;
