/*
 Copyright 2019 Carmilla Mina Jankovic

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

const ViewWrapper = require('../library/components/ViewWrapper');
const SpoonyList = require('./SpoonyUserList');

class SpoonyView extends ViewWrapper {
  constructor({
    effect,
    classes = [],
    elementId = `spoonyView-${Date.now()}`,
  }) {
    const spoonyList = new SpoonyList({
      effect,
      shouldFocusOnClick: false,
    });

    super({
      elementId,
      columns: [
        { components: [{ component: spoonyList }] },
      ],
      classes: classes.concat(['peopleView']),
    });
  }
}

module.exports = SpoonyView;
