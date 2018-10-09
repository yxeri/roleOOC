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

const List = require('./List');
const UserDialog = require('../views/dialogs/UserDialog');

const dataHandler = require('../../data/DataHandler');
const eventCentral = require('../../EventCentral');
const storageManager = require('../../StorageManager');
const aliasComposer = require('../../data/composers/AliasComposer');
const accessCentral = require('../../AccessCentral');

class RoomList extends List {
  constructor({
    title,
    classes = [],
    elementId = `userRList-${Date.now()}`,
  }) {
    classes.push('roomList');
    classes.push('userRoomList');

    const headerFields = [{
      paramName: 'username',
      fallbackTo: 'aliasName',
    }];

    super({
      elementId,
      classes,
      title,
      shouldFocusOnClick: false,
      minimumAccessLevel: accessCentral.AccessLevels.STANDARD,
      dependencies: [
        dataHandler.rooms,
        dataHandler.users,
        dataHandler.teams,
        dataHandler.aliases,
      ],
      listItemClickFuncs: {
        leftFunc: (objectId) => {
          if (storageManager.getAccessLevel() <= accessCentral.AccessLevels.ANONYMOUS) {
            return;
          }

          const userDialog = new UserDialog({
            identityId: objectId,
            origin: this.elementId,
          });

          userDialog.addToView({
            element: this.element,
          });

          this.removeFocusOnItem();
        },
      },
      collector: dataHandler.users,
      listItemFields: headerFields,
    });

    eventCentral.addWatcher({
      event: eventCentral.Events.SWITCH_ROOM,
      func: ({
        room,
        origin,
        listType = '',
      }) => {
        if ((origin && origin === this.elementId) || listType !== this.ListTypes.ROOMS) {
          return;
        }

        const { objectId } = room;

        this.setFocusedListItem(objectId);
      },
    });
  }

  getCollectorObjects() {
    const userAliases = [storageManager.getUserId()].concat(aliasComposer.getCurrentUserAliases().map(alias => alias.objectId));
    const allAliases = aliasComposer.getAllAliases();
    const allUsers = this.collector.getObjects({
      filter: this.filter,
    });

    return allAliases.concat(allUsers).filter(object => !userAliases.includes(object.objectId)).sort((a, b) => {
      const aParam = (a.username || a.aliasName).toLowerCase();
      const bParam = (b.username || b.aliasName).toLowerCase();

      if (aParam < bParam) {
        return -1;
      }

      if (aParam > bParam) {
        return 1;
      }

      return 0;
    });
  }
}

module.exports = RoomList;
