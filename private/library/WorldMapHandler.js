const eventHandler = require('./EventCentral');
const dataHandler = require('./data/DataHandler');

class WorldMapHandler {
  constructor() {
    /**
     * A LOCAL position is within the game area.
     * Eveything outside of the game area is of type WORLD.
     * @type {{string}}
     */
    this.PositionTypes = {
      USER: 'user',
      WORLD: 'world',
      LOCAL: 'local',
    };

    eventHandler.addWatcher({
      event: eventHandler.Events.POSITION,
      func: () => {},
    });

    this.startMap();
  }

  startMap() {
    if (
      typeof google === 'undefined'
      || typeof MarkerClusterer === 'undefined'
      || typeof MapLabel === 'undefined'
      || !dataHandler.positions.hasFetched
      || !dataHandler.users.hasFetched
      || !dataHandler.teams.hasFetched
    ) {
      setTimeout(() => { this.startMap(); }, 500);

      return;
    }

    eventHandler.emitEvent({
      event: eventHandler.Events.WORLDMAP,
      params: {},
    });
  }
}

const worldMapHandler = new WorldMapHandler();

module.exports = worldMapHandler;
