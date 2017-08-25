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

const textTools = require('../../TextTools');
const elementCreator = require('../../ElementCreator');

class Clock {
  constructor(element) {
    this.element = element;

    this.updateTime();

    // TODO Time should be retrieved from server
  }

  /**
   * Start time tracking and calls updateTime to update time in DOM
   */
  start() {
    const now = new Date();
    const waitTime = ((60 - now.getSeconds()) * 1000) - now.getMilliseconds();

    setTimeout(() => {
      this.updateTime();
      this.start();
    }, waitTime);
  }

  /**
   * Updates time in DOM
   */
  updateTime() {
    const date = new Date();

    if (date.getSeconds() > 59) {
      date.setMinutes(date.getMinutes() + 1);
    }

    const beautifulDate = textTools.generateTimeStamp({ date });
    const timeSpan = elementCreator.createSpan({
      text: `${beautifulDate.halfTime}`,
    });
    const dateSpan = elementCreator.createSpan({
      text: `${beautifulDate.fullDate}`,
    });
    this.element.replaceChild(timeSpan, this.element.firstChild);
    this.element.replaceChild(dateSpan, this.element.lastElementChild);
  }
}

module.exports = Clock;
