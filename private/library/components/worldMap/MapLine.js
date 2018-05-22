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

const MapObject = require('./MapObject');

/**
 * Requires Google maps library
 */
class MapLine extends MapObject {
  constructor({
    position,
    clickFuncs,
    alwaysShowLabel = false,
    shouldCluster = true,
    styles = {},
  }) {
    const { coordinatesHistory } = position;
    const latestCoordinates = coordinatesHistory[coordinatesHistory.length - 1];
    const allPoints = [new google.maps.LatLng(latestCoordinates.latitude, latestCoordinates.longitude)]
      .concat(latestCoordinates.extraCoordinates.map(coords => new google.maps.LatLng(coords.latitude, coords.longitude)));

    super({
      alwaysShowLabel,
      shouldCluster,
      position,
      clickFuncs,
      // TODO Combine with MapPolygon
      dragEndFunc: () => {
        const extraCoordinates = this.mapObject.getPath().getArray();
        const firstCoordinates = extraCoordinates.shift();

        this.setCurrentCoordinates({
          coordinates: {
            longitude: firstCoordinates.lng(),
            latitude: firstCoordinates.lat(),
            extraCoordinates: extraCoordinates.map((coordinates) => {
              return {
                latitude: coordinates.lat(),
                longitude: coordinates.lng(),
              };
            }),
          },
        });
      },
      mapObject: new google.maps.Polyline({
        path: new google.maps.MVCArray(allPoints),
        strokeColor: styles.strokeColor || '#000000',
        strokeOpacity: styles.strokeOpacity || 0.8,
        strokeWeight: styles.strokeWeight || 3,
        opacity: styles.opacity || 1,
        // icon: {
        //   url: icon.url || '/images/mapicon.png',
        //   size: icon.size || new google.maps.Size(14, 14),
        //   origin: icon.origin || new google.maps.Point(0, 0),
        //   anchor: icon.anchor || new google.maps.Point(7, 7),
        // },
      }),
    });
  }

  // TODO Get center between two points, if the total points is an even amount.
  getCenter() {
    if (this.currentCoordinates.extraCoordinates.length > 1) {
      const middleIndex = Math.floor((this.currentCoordinates.extraCoordinates.length / 2) - 1);

      return this.currentCoordinates.extraCoordinates[middleIndex];
    }

    return super.getCenter();
  }

  // TODO Combine with MapPolygon
  setCurrentCoordinates({ coordinates }) {
    const allPoints = [new google.maps.LatLng(coordinates.latitude, coordinates.longitude)]
      .concat(coordinates.extraCoordinates.map(coords => new google.maps.LatLng(coords.latitude, coords.longitude)));

    super.setCurrentCoordinates({ coordinates });

    this.mapObject.setPath(new google.maps.MVCArray(allPoints));
  }
}

module.exports = MapLine;
