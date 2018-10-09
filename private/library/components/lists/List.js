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

/**
 * A filter will be used to filter out the objects retrieved or received. Only those who match the filter will be accepted.
 * @typedef {Object} Filter
 * @property {string} paramName - Name of the parameter.
 * @property {string} paramValue - Value of the parameter.
 */

/**
 * A list item field is a value that will be printed into an element in the list.
 * @typedef {Object} ListItemField
 * @property {string} paramName - Name of the parameter to retrieve the value from and print.
 * @property {string} [fallbackTo] - Name of the parameter that will be used if paramName does not exist in the object.
 * @property {Function} [func] - Function that will be called if the item is clicked.
 * @property {Function} [convertFunc] - Function that will be called when printing the field. It can be used to convert IDs of objects to human-readable names.
 *
 */

const BaseView = require('../views/BaseView');

const eventCentral = require('../../EventCentral');
const elementCreator = require('../../ElementCreator');
const socketManager = require('../../SocketManager');
const userComposer = require('../../data/composers/UserComposer');
const accessCentral = require('../../AccessCentral');
const storageManager = require('../../StorageManager');

const cssClasses = {
  focusListItem: 'focusListItem',
  markListItem: 'markListItem',
  newListItem: 'newListItem',
  removeListItem: 'removeListItem',
};
const itemChangeTimeout = 800;

class List extends BaseView {
  /**
   * List constructor.
   * @param {Object} params - Parameters.
   * @param {Object} params.collector - Data handler to use for object retrieval.
   * @param {ListItemField[]} [params.listItemFields] - The object parameters to get and output. Leaving this and fieldToAppend empty will output a list of objectIds.
   * @param {string} [params.fieldToAppend] - The object parameter to output after listItemFields. Leaving this and listItemFields will output a list of objectIds.
   * @param {Object} [params.listItemClickFuncs] - Functions to call on clicks on the list item.
   * @param {Object} [params.listItemClickFuncs.leftFunc] - Function to call on left clicks.
   * @param {Object} [params.listItemClickFuncs.right] - Function to call on right clicks.
   * @param {Object} [params.listItemSpecificClasses] - CSS classes that will be set on values in the object.
   * @param {Object} [params.filter] - Filters to use on object retrieval.
   * @param {boolean} [params.shouldFocusOnClick] - Should list items that are clicked be focused?
   * @param {string[]} [params.classes] - CSS classes.
   * @param {string} [params.elementId] - Id of the list element.
   * @param {string} [params.focusedId] - Id of the list item that will be focused from the start.
   * @param {Object} [params.dependencies] - Data handler dependencies. The creation of the list will only run when all the handlers have retrieved their objects.
   * @param {boolean} [params.shouldPaginate] - Should the list be appended in pieces?
   */
  constructor({
    collector,
    listItemFields,
    fieldToAppend,
    filter,
    appendClasses,
    listItemFieldsClasses,
    sorting,
    title,
    shouldToggle,
    listItemSpecificClasses,
    userFilter,
    minimumAccessLevel,
    listType,
    onCreateFunc = () => {},
    shouldPaginate = false,
    shouldScrollToBottom = false,
    listItemClickFuncs = {},
    dependencies = [],
    focusedId = '-1',
    shouldFocusOnClick = true,
    classes = [],
    elementId = `list-${Date.now()}`,
  }) {
    super({
      elementId,
      minimumAccessLevel,
      classes: classes.concat(['list']),
    });

    this.onCreateFunc = onCreateFunc;
    this.ListTypes = {
      ROOMS: 'rooms',
      FOLLOWEDROOMS: 'followedRooms',
      WHISPERROOMS: 'whisperRooms',
    };
    this.dependencies = dependencies;
    this.listItemClickFuncs = listItemClickFuncs;
    this.collector = collector;
    this.listItemFieldsClasses = listItemFieldsClasses;
    this.listItemFields = listItemFields;
    this.appendClasses = appendClasses;
    this.fieldToAppend = fieldToAppend;
    this.focusedId = focusedId;
    this.markedIds = [];
    this.shouldFocusOnClick = shouldFocusOnClick;
    this.filter = filter;
    this.userFilter = userFilter;
    this.shouldScrollToBottom = shouldScrollToBottom;
    this.sorting = sorting;
    this.title = title;
    this.shouldPaginate = shouldPaginate;
    this.listItemSpecificClasses = listItemSpecificClasses;
    this.shouldToggle = shouldToggle;
    this.listType = listType;

    if (collector.eventTypes.one) {
      eventCentral.addWatcher({
        event: collector.eventTypes.one,
        func: (data) => {
          const object = data[collector.objectTypes.one];
          const { changeType } = data;
          const user = userComposer.getCurrentUser();

          if (changeType !== socketManager.ChangeTypes.REMOVE && (this.filter || this.userFilter)) {
            const filterFunc = (rule) => {
              if (rule.shouldInclude) {
                return object[rule.paramName].includes(rule.paramValue);
              }

              return rule.paramValue === object[rule.paramName];
            };
            const userFilterFunc = (rule) => {
              const {
                shouldInclude,
                paramValue,
                paramName,
                objectParamName,
                shouldBeTrue = true,
              } = rule;

              if (shouldInclude) {
                const isIncluded = user[paramName].includes(object[objectParamName]);

                return shouldBeTrue
                  ? isIncluded
                  : !isIncluded;
              }

              const isIncluded = paramValue === object[objectParamName];

              return shouldBeTrue
                ? isIncluded
                : !isIncluded;
            };

            if (this.filter) {
              if (this.filter.orCheck && !this.filter.rules.some(filterFunc)) {
                return;
              }

              if (!this.filter.rules.every(filterFunc)) {
                return;
              }
            }

            if (this.userFilter) {
              if (this.userFilter.orCheck && !this.userFilter.rules.some(userFilterFunc)) {
                return;
              }

              if (!this.userFilter.rules.every(userFilterFunc)) {
                return;
              }
            }
          }

          switch (changeType) {
            case socketManager.ChangeTypes.UPDATE: {
              if (this.hasAccess({ object, user }).canSee) {
                this.addOneItem({
                  object,
                  shouldAnimate: true,
                  shouldReplace: true,
                });
              } else {
                this.removeOneItem({ object });
              }

              break;
            }
            case socketManager.ChangeTypes.CREATE: {
              if (this.hasAccess({ object, user }).canSee) {
                this.onCreateFunc({ object });

                this.addOneItem({
                  object,
                  shouldAnimate: true,
                });
                this.scrollList();
              }

              break;
            }
            case socketManager.ChangeTypes.REMOVE: {
              console.log('going to remove object', object, collector.objectTypes.one);

              this.removeOneItem({ object });

              break;
            }
            default: {
              break;
            }
          }
        },
      });
    }

    if (collector.eventTypes.many) {
      eventCentral.addWatcher({
        event: collector.eventTypes.many,
        func: () => {
          this.appendList();
        },
      });
    }

    eventCentral.addWatcher({
      event: eventCentral.Events.RECONNECT,
      func: () => {
        this.appendList();
      },
    });
  }

  scrollList() {
    if (this.shouldScrollToBottom && this.listElement && this.listElement.lastElementChild) {
      this.listElement.lastElementChild.scrollIntoView();
    }
  }

  addToView(params) {
    this.appendList();

    super.addToView(params);
  }

  appendList() {
    if (!this.dependencies.every(dependency => dependency.hasFetched)) {
      setTimeout(() => {
        this.appendList();
      }, 200);

      return;
    }

    const elements = [];
    const listClasses = [];

    if (this.shouldToggle) {
      listClasses.push('hide');
    }

    if (this.title) {
      const clickFuncs = {
        leftFunc: () => {
          this.listElement.classList.toggle('hide');
        },
      };

      elements.push(elementCreator.createHeader({
        clickFuncs: this.shouldToggle ?
          clickFuncs :
          undefined,
        elements: [elementCreator.createSpan({ text: this.title, classes: ['listTitle'] })],
      }));
    }

    this.listElement = elementCreator.createList({
      classes: listClasses,
    });

    elements.push(this.listElement);

    const container = elementCreator.createContainer({
      elements,
      elementId: this.elementId,
      classes: this.classes,
    });
    const allObjects = this.getCollectorObjects();

    if (this.shouldPaginate) {
      this.listElement.appendChild(this.createListFragment({ objects: allObjects.slice(50, allObjects.length) }));
    } else {
      this.listElement.appendChild(this.createListFragment({ objects: allObjects }));
    }

    this.replaceOnParent({ element: container });
    this.scrollList();
  }

  removeListItem({ objectId }) {
    const existingItem = this.getElement(objectId);

    this.listElement.removeChild(existingItem);
  }

  hasAccess({ object, user }) { // eslint-disable-line
    return accessCentral.hasAccessTo({
      objectToAccess: object,
      toAuth: user,
    });
  }

  createListFragment({ objects }) {
    const user = userComposer.getCurrentUser();
    const fragment = document.createDocumentFragment();
    const marked = storageManager.getMarked();

    console.log('marked', marked, marked[this.listType], this.listType);

    objects.forEach((object) => {
      const { canSee } = this.hasAccess({ object, user });

      if (canSee) {
        const listItem = this.createListItem({
          object,
          isMarked: marked[this.listType]
            ? marked[this.listType].map(mark => mark.objectId).includes(object.objectId)
            : false,
        });

        fragment.appendChild(listItem);
      }
    });

    return fragment;
  }

  getCollectorObjects() {
    return this.collector.getObjects({
      user: userComposer.getCurrentUser(),
      filter: this.filter,
      sorting: this.sorting,
    });
  }

  getFocusedListItem() {
    return this.getElement(this.focusedId);
  }

  setFocusedListItem(elementId) {
    if (!this.shouldFocusOnClick) {
      return;
    }

    const toFocus = this.getElement(elementId);

    this.removeFocusOnItem();

    if (toFocus) {
      this.focusedId = elementId;

      toFocus.classList.add(cssClasses.focusListItem);
    }
  }

  removeFocusOnItem() {
    const focused = this.getFocusedListItem();

    if (focused) {
      focused.classList.remove(cssClasses.focusListItem);
    }

    this.focusedId = undefined;
  }

  markListItem(elementId) {
    const toMark = this.getElement(elementId);

    if (toMark) {
      toMark.classList.add(cssClasses.markListItem);

      if (!this.markedIds.includes(elementId)) {
        this.markedIds.push(elementId);
      }
    }
  }

  unmarkListItem(elementId) {
    const markedIndex = this.markedIds.indexOf(elementId);

    if (markedIndex > -1) {
      const element = this.getElement(elementId);

      element.classList.remove(cssClasses.markListItem);

      this.markedIds.splice(markedIndex, 1);
    }
  }

  createListItem({
    object,
    isMarked = false,
  }) {
    const { objectId } = object;
    const classes = this.focusedId === objectId
      ? [cssClasses.focusListItem]
      : [];
    const listItemElements = [];
    const clickFuncs = {
      leftFunc: () => {
        this.setFocusedListItem(objectId);
        this.unmarkListItem(objectId);

        if (this.listItemClickFuncs.leftFunc) {
          this.listItemClickFuncs.leftFunc(objectId);
        }

        socketManager.checkAndReconnect();
      },
    };

    if (this.listItemSpecificClasses) {
      this.listItemSpecificClasses.forEach((item) => {
        const { classes: itemClasses = [], paramName, paramValue } = item;
        const objectValue = object[paramName];

        if ((objectValue && objectValue === paramValue) || (!objectValue && !paramValue)) {
          itemClasses.forEach((cssClass) => {
            classes.push(cssClass);
          });
        }
      });
    }

    if (this.listItemClickFuncs.right) {
      clickFuncs.right = () => {
        this.listItemClickFuncs.right(objectId);
      };
    }

    if (this.listItemFields || this.fieldToAppend) {
      /**
       * Add item fields to the list item.
       */
      if (this.listItemFields) {
        const elements = this.listItemFields
          .filter(field => typeof object[field.paramName] !== 'undefined' || typeof object[field.fallbackTo] !== 'undefined')
          .map((field) => {
            const {
              paramName,
              fallbackTo,
              convertFunc,
              func,
              classes: fieldClasses,
            } = field;
            const value = object[paramName] || object[fallbackTo];
            const text = convertFunc ?
              convertFunc(value) :
              value;
            const spanParams = {
              text,
              classes: fieldClasses,
            };

            if (func) {
              spanParams.clickFuncs = {
                leftFunc: () => {
                  func(objectId);
                },
              };
            }

            return text !== '' ?
              elementCreator.createSpan(spanParams) :
              document.createTextNode('');
          });

        const paragraphParams = {
          elements,
          classes: this.listItemFieldsClasses,
        };

        if (this.listItemClickFuncs.onlyListItemFields) {
          paragraphParams.clickFuncs = clickFuncs;
        }

        listItemElements.push(elementCreator.createParagraph(paragraphParams));
      }

      /**
       * Append field after the item fields.
       */
      if (this.fieldToAppend) {
        const field = object[this.fieldToAppend];

        field.forEach((value) => {
          listItemElements.push(elementCreator.createParagraph({
            classes: this.appendClasses,
            elements: [elementCreator.createSpan({ text: value })],
          }));
        });
      }
    } else { // Fallback. Create list item if none has been created.
      listItemElements.push(elementCreator.createParagraph({
        elements: [elementCreator.createSpan({ text: objectId })],
      }));
    }

    const listItemParams = {
      classes,
      elementId: `${this.elementId}${objectId}`,
      elements: listItemElements,
    };

    if (!this.listItemClickFuncs.onlyListItemFields) {
      listItemParams.clickFuncs = clickFuncs;
    }

    if (isMarked) {
      listItemParams.classes.push(cssClasses.markListItem);
    }

    return elementCreator.createListItem(listItemParams);
  }

  addOneItem({
    object,
    shouldReplace = false,
    shouldAnimate = false,
  }) {
    const { objectId } = object;
    const newItem = this.createListItem({ object });
    const element = this.getElement(objectId);

    if (shouldAnimate) {
      newItem.classList.add(cssClasses.newListItem);
      setTimeout(() => { newItem.classList.remove(cssClasses.newListItem); }, itemChangeTimeout);
    }

    if (shouldReplace && element) {
      this.listElement.replaceChild(newItem, this.getElement(objectId));
    } else if (this.sorting && this.sorting.reverse) {
      const firstChild = this.listElement.firstElementChild;

      if (firstChild) {
        this.listElement.insertBefore(newItem, firstChild);
      } else {
        this.listElement.appendChild(newItem);
      }
    } else {
      this.listElement.appendChild(newItem);
    }
  }

  removeOneItem({ object }) {
    const { objectId } = object;
    const toRemove = this.getElement(objectId);

    toRemove.classList.add(cssClasses.removeListItem);

    setTimeout(() => {
      const element = this.getElement(objectId);

      if (element) {
        this.listElement.removeChild(element);
      }
    }, itemChangeTimeout);
  }

  animateItem({ elementId }) {
    const element = this.getElement(elementId);

    if (element) {
      element.classList.add(cssClasses.newListItem);
      setTimeout(() => { element.classList.remove(cssClasses.newListItem); }, itemChangeTimeout);
    }
  }

  markItem({ objectId }) {
    const element = this.getElement(objectId);

    storageManager.addMarked({
      objectId,
      listType: this.listType,
    });

    if (element) {
      this.animateItem({ elementId: objectId });
      element.classList.add(cssClasses.markListItem);
    }
  }

  unmarkItem({ objectId }) {
    const element = this.getElement(objectId);

    if (element) {
      storageManager.pullMarked({
        objectId,
        listType: this.listType,
      });

      element.classList.remove(cssClasses.markListItem);
    }
  }
}

module.exports = List;
