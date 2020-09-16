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

import List from './List';

import {
  users,
  teams,
  positions,
} from '../../data/DataHandler';
import eventCentral from '../../EventCentral';
import positionComposer from '../../data/composers/PositionComposer';

export default class PositionList extends List {
  constructor(params) {
    const listParams = params;
    listParams.sorting = {
      paramName: 'positionName',
      fallbackParamName: 'objectId',
    };
    listParams.shouldToggle = typeof listParams.shouldToggle === 'boolean'
      ? listParams.shouldToggle
      : true;
    listParams.positionTypes = listParams.positionTypes || Object.keys(positionComposer.PositionTypes).map((positionType) => positionComposer.PositionTypes[positionType]);
    listParams.elementId = listParams.elementId || `pList-${Date.now()}`;
    listParams.classes = listParams.classes
      ? listParams.classes.concat(['positionList'])
      : [];
    listParams.filter = {
      orCheck: true,
      rules: listParams.positionTypes.map((positionType) => {
        return { paramName: 'positionType', paramValue: positionType };
      }),
    };
    listParams.dependencies = [
      users,
      teams,
      positions,
    ];
    listParams.listItemClickFuncs = {
      leftFunc: (objectId) => {
        eventCentral.emitEvent({
          event: eventCentral.Events.FOCUS_MAPPOSITION,
          params: {
            showDescription: true,
            origin: this.elementId,
            position: { objectId },
            zoomLevel: params.zoomLevel,
          },
        });
      },
    };
    listParams.collector = positions;
    listParams.listItemFields = listParams.listItemFields || [
      { paramName: 'positionName' },
    ];

    super(listParams);

    this.positionTypes = listParams.positionTypes;

    eventCentral.addWatcher({
      event: eventCentral.Events.FOCUS_MAPPOSITION,
      func: ({
        origin,
        position,
      }) => {
        if (!origin || origin !== this.elementId) {
          this.removeFocusOnItem();

          return;
        }

        const { objectId } = position;

        this.setFocusedListItem(objectId);
      },
    });

    if (this.positionTypes.includes('user')) {
      eventCentral.addWatcher({
        event: eventCentral.Events.AGED_POSITIONS,
        func: ({ positions: sentPositions }) => {
          sentPositions.forEach((position) => this.removeListItem(position));
        },
      });
    }
  }

  shouldFilterItem(params) {
    if (params.object.coordinatesHistory.length === 0) {
      return false;
    }

    return super.shouldFilterItem(params);
  }

  getCollectorObjects() {
    return super.getCollectorObjects().filter((position) => {
      return !/(^polygon)|(^line)/ig.test(position.positionName)
        && position.coordinatesHistory.length !== 0
        && (position.positionType !== 'user' || new Date() - new Date(position.lastUpdated) < positionComposer.maxPositionAge);
    });
  }
}
