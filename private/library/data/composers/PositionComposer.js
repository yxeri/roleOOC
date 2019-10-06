const BaseComposer = require('./BaseComposer');

const eventHandler = require('../../EventCentral');
const dataHandler = require('../DataHandler');
const storageManager = require('../../StorageManager');

class PositionComposer extends BaseComposer {
  constructor() {
    super({
      completionEvent: eventHandler.Events.COMPLETE_POSITION,
      handler: dataHandler.positions,
      dependencies: [
        dataHandler.positions,
        dataHandler.users,
        dataHandler.teams,
      ],
    });

    this.PositionTypes = {
      USER: 'user',
      WORLD: 'world',
      LOCAL: 'local',
      DEVICE: 'device',
    };
    this.maxPositionAge = 1200000;
    this.PositionStructures = {
      MARKER: 'marker',
      CIRCLE: 'circle',
      POLYGON: 'polygon',
      LINE: 'line',
    };

    eventHandler.addWatcher({
      event: eventHandler.Events.COMPLETE_POSITION,
      func: () => {
        eventHandler.emitEvent({
          event: eventHandler.Events.WORLDMAP,
          params: {},
        });

        this.checkPositionAge();
      },
    });
  }

  updatePosition({
    positionId,
    position,
    callback,
  }) {
    this.handler.updateObject({
      callback,
      params: {
        positionId,
        position,
      },
    });
  }

  getPositions({ positionTypes = [] }) {
    return this.handler.getObjects({
      filter: {
        orCheck: true,
        rules: positionTypes.map((positionType) => {
          return {
            paramName: 'positionType',
            paramValue: positionType,
          };
        }),
      },
    });
  }

  checkPositionAge() {
    const oldPositions = this.getPositions({ positionTypes: ['user'] })
      .filter((position) => position.coordinatesHistory.length !== 0 && new Date() - new Date(position.lastUpdated) > this.maxPositionAge);

    eventHandler.emitEvent({
      event: eventHandler.Events.AGED_POSITIONS,
      params: { positions: oldPositions },
    });

    setTimeout(() => { this.checkPositionAge(); }, 60000);
  }

  getPosition({ positionId }) {
    return this.handler.getObject({ objectId: positionId });
  }

  createPosition({
    position,
    callback,
  }) {
    const positionToCreate = position;
    positionToCreate.ownerAliasId = storageManager.getAliasId();
    positionToCreate.teamId = storageManager.getTeamId();

    this.handler.createObject({
      callback,
      params: { position: positionToCreate },
    });
  }

  removePosition({
    positionId,
    callback,
  }) {
    this.handler.removeObject({
      callback,
      params: { positionId },
    });
  }

  addPositionTypes(positionTypes = []) {
    positionTypes.forEach((positionType) => {
      this.PositionTypes[positionType] = positionType;
    });
  }
}

const positionComposer = new PositionComposer();

module.exports = positionComposer;
