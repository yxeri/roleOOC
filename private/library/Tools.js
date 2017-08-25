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

class Tools {
  static shuffleArray(array) {
    const shuffledArray = array;
    let currentIndex = array.length;
    let tempVal;
    let randIndex;

    while (currentIndex !== 0) {
      randIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      tempVal = array[currentIndex];
      shuffledArray[currentIndex] = array[randIndex];
      shuffledArray[randIndex] = tempVal;
    }

    return shuffledArray;
  }

  static getQueryParameters() {
    const query = window.location.search;

    if (query) {
      const params = {};

      query.split('?')[1].split('&').forEach((combo) => {
        const split = combo.split('=');

        params[split[0]] = split[1];
      });

      return params;
    }

    return false;
  }
}

module.exports = Tools;
