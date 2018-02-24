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

/**
 * A filter will be used to filter out the objects retrieved or received. Only those who match the filter will be accepted.
 * @typedef {Object} Filter
 * @property {string} paramName - Name of the parameter.
 * @property {string} paramValue - Value of the parameter.
 */

const socketManager = require('../SocketManager');
const eventCentral = require('../EventCentral');

const offlineError = {
  type: 'offline',
  text: ['Unable to connect to the server.'],
};
const noFunctionError = {
  type: 'no function',
  text: ['This data type does not support the function.'],
};

class BaseData {
  constructor({
    createEvents,
    retrieveEvents,
    updateEvents,
    removeEvents,
    objectTypes,
    eventTypes,
    emitTypes,
  }) {
    this.objects = {};
    this.removeEvents = removeEvents;
    this.createEvents = createEvents;
    this.retrieveEvents = retrieveEvents;
    this.updateEvents = updateEvents;
    this.objectTypes = objectTypes;
    this.eventTypes = eventTypes;
    this.hasFetched = false;

    eventCentral.addWatcher({
      event: eventCentral.Events.STARTUP,
      func: () => {
        this.fetchObjects({});
      },
    });

    eventCentral.addWatcher({
      event: eventCentral.Events.LOGIN,
      func: () => {
        this.fetchObjects({});
      },
    });

    eventCentral.addWatcher({
      event: eventCentral.Events.RECONNECT,
      func: () => {
        this.fetchObjects({});
      },
    });

    eventCentral.addWatcher({
      event: eventCentral.Events.LOGOUT,
      func: () => {
        this.fetchObjects({ reset: true });
      },
    });

    if (emitTypes) {
      const func = ({ data }) => {
        const { changeType } = data;
        const object = data[this.objectTypes.one];
        const paramsToEmit = {
          changeType,
        };
        paramsToEmit[this.objectTypes.one] = object;

        switch (changeType) {
          case socketManager.ChangeTypes.UPDATE: {
            if (this.objects[object.objectId]) {
              Object.keys(object).forEach((param) => {
                this.objects[object.objectId][param] = object[param];
              });
            } else {
              this.objects[object.objectId] = object;
            }

            break;
          }
          case socketManager.ChangeTypes.CREATE: {
            this.objects[object.objectId] = object;

            break;
          }
          case socketManager.ChangeTypes.REMOVE: {
            this.objects[object.objectId] = undefined;

            break;
          }
          default: {
            console.log(`Incorrect change type for ${this.objectTypes.one}: ${changeType}`);

            break;
          }
        }

        eventCentral.emitEvent({
          event: this.eventTypes.one,
          params: paramsToEmit,
        });
      };

      emitTypes.forEach((type) => {
        socketManager.addEvent(type, func);
      });
    }
  }

  /**
   * Retrieves objects from server.
   * @param {Object} params - Parameters.
   * @param {Object} [params.emitParams] - Data to send to the server.
   * @param {boolean} [params.reset] - Should stored objects be reset?
   */
  fetchObjects({
    emitParams = {},
    reset = false,
  }) {
    if (!socketManager.isOnline) {
      eventCentral.emitEvent({
        event: eventCentral.Events.ERROR,
        params: {
          event: this.retrieveEvents.many,
        },
      });

      return;
    }

    socketManager.emitEvent(this.retrieveEvents.many, emitParams, ({ error, data }) => {
      if (error) {
        const errorParams = {
          event: this.retrieveEvents.many,
          data: emitParams,
        };

        eventCentral.emitEvent({
          event: eventCentral.Events.ERROR,
          params: errorParams,
        });

        return;
      }

      const objects = data[this.objectTypes.many];
      const params = {};
      params[this.objectTypes.many] = objects;
      params.hasReset = reset;

      if (reset) {
        this.objects = {};
        this.objects = objects;
      } else {
        objects.forEach((object) => {
          this.objects[object.objectId] = object;
        });
      }

      this.hasFetched = true;

      eventCentral.emitEvent({
        params,
        event: this.eventTypes.many,
      });
    });
  }

  /**
   * Retrieve object from server.
   * @param {Object} params - Parameters.
   * @param {Object} params.params - Parameters to send to the server.
   */
  fetchObject({ params }) {
    if (!socketManager.isOnline) {
      eventCentral.emitEvent({
        event: eventCentral.Events.ERROR,
        params: {
          event: this.retrieveEvents.one,
        },
      });

      return;
    }

    socketManager.emitEvent(this.retrieveEvents.one, params, ({ error, data }) => {
      if (error) {
        const errorParams = {
          event: this.retrieveEvents.one,
          data: params,
        };

        eventCentral.emitEvent({
          event: eventCentral.Events.ERROR,
          params: errorParams,
        });

        return;
      }

      const object = data[this.objectTypes.one];
      const dataToSend = { data: {} };
      const eventParams = {};

      eventParams[this.objectTypes.one] = object;
      dataToSend.data[this.objectTypes.one] = object;

      if (this.objects[object.objectId]) {
        Object.keys(object).forEach((param) => {
          this.objects[object.objectId][param] = object[param];
        });
      } else {
        this.objects[object.objectId] = object;
      }

      eventCentral.emitEvent({
        params: eventParams,
        event: this.eventTypes.one,
      });
    });
  }

  /**
   * Craete an object on the server and return the created object.
   * @param {Object} params - Parameters.
   * @param {Object} params.params - Parameters to send.
   * @param {Function} params.callback - Callback.
   * @param {string} [params.event] - Event type to emit. Will override the default one.
   */
  createObject({
    params,
    callback,
    event,
  }) {
    if (!this.createEvents) {
      callback({ error: noFunctionError });

      return;
    } else if (!socketManager.isOnline) {
      callback({ error: offlineError });

      return;
    }

    socketManager.emitEvent(event || this.createEvents.one, params, ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const object = data[this.objectTypes.one];

      this.objects[object.objectId] = object;

      callback({ data });
    });
  }

  /**
   * Update an object on the server and return the updated object.
   * @param {Object} params - Parameters.
   * @param {Object} params.params - Parameters to send.
   * @param {Function} params.callback - Callback.
   */
  updateObject({
    params,
    callback,
  }) {
    if (!this.updateEvents) {
      callback({ error: noFunctionError });

      return;
    } else if (!socketManager.isOnline) {
      callback({ error: offlineError });

      return;
    }

    socketManager.emitEvent(this.updateEvents.one, params, ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const object = data[this.objectTypes.one];

      this.objects[object.objectId] = object;

      callback({ data });
    });
  }

  /**
   * Remove an object from the server and local.
   * @param {Object} params - Parameters.
   * @param {Object} params.params - Parameters to send.
   * @param {Function} params.callback - Callback.
   */
  removeObject({
    params,
    callback,
  }) {
    if (!this.removeEvents) {
      callback({ error: noFunctionError });

      return;
    } else if (!socketManager.isOnline) {
      callback({ error: offlineError });

      return;
    }

    socketManager.emitEvent(this.removeEvents.one, params, ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const object = data[this.objectTypes.one];

      this.objects[object.objectId] = undefined;

      callback({
        data: { success: true },
      });
    });
  }

  /**
   * Get locally stored object.
   * @param {Object} params - Parameters.
   * @param {string} params.objectId - Id of the object.
   * @return {Object} Found object.
   */
  getObject({ objectId }) {
    return this.objects[objectId];
  }

  /**
   * Get locally stored objects.
   * Setting paramName and value will retrieve objects matching them.
   * @param {Object} params - Parameters.
   * @param {Object} params.filter - Filter to check against.
   * @param {boolean} [params.orCheck] - Is it enough for only one sent value to match?
   * @return {Object} Stored objects.
   */
  getObjects({ orCheck, filter }) {
    if (filter) {
      return Object.keys(this.objects).filter((objectKey) => {
        const object = this.objects[objectKey];

        if (orCheck) {
          return filter.rules.some(rule => rule.paramValue === object[rule.paramName]);
        }

        return filter.rules.every(rule => rule.paramValue === object[rule.paramName]);
      }).map(objectKey => this.objects[objectKey]);
    }

    return this.objects;
  }
}

module.exports = BaseData;