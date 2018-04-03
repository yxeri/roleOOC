const dataHandler = require('./DataHandler');
const eventCentral = require('../EventCentral');

class BaseComposer {
  constructor({
    completionEvent,
    dependencies = [],
  }) {
    this.isComplete = false;
    this.dependencies = dependencies;
    this.completionEvent = completionEvent;

    this.checkIsComplete();
  }

  checkIsComplete() {
    if (!this.dependencies.every(dependency => dependency.hasFetched)) {
      setTimeout(() => {
        this.checkIsComplete();
      }, 200);

      return;
    }

    this.dependencies.forEach((dependency) => { console.log(dependency, dependency.hasFetched) });

    this.isComplete = true;

    if (this.completionEvent) {
      eventCentral.emitEvent({
        event: this.completionEvent,
        params: {},
      });
    }
  }

  createCreatorName({ object, full = true }) {
    const user = dataHandler.users.getObject({ objectId: object.ownerAliasId || object.ownerId });

    if (!user) {
      return object.ownerAliasId || object.ownerId;
    } else if (full) {
      return user.fullName || user.username;
    }

    return user.username;
  }
}

module.exports = BaseComposer;
