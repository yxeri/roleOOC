const BaseView = require('./BaseView');
const MapMarker = require('../../worldMap/MapMarker');

const worldMapHandler = require('../../worldMap/WorldMapHandler');
const storageManager = require('../../StorageManager');
const eventHandler = require('../../EventCentral');
const dataHandler = require('../../data/DataHandler');
const socketManager = require('../../SocketManager');
const mouseHandler = require('../../MouseHandler');
const elementCreator = require('../../ElementCreator');

const ids = {
  RIGHTCLICKMENU: 'rMenu',
  LEFTCLICKMENU: 'lMenu',
};

class WorldMapView extends BaseView {
  constructor({
    mapStyles,
    listId,
    classes = [],
    elementId = `mapView-${Date.now()}`,
    positionTypes = Object.keys(worldMapHandler.PositionTypes).map(positionType => worldMapHandler.PositionTypes[positionType]),
    backgroundColor = '000000',
    minZoom = 3,
    maxZoom = 16,
    centerCoordinates = storageManager.getCenterCoordinates(),
    cornerCoordinates = {
      upperLeft: storageManager.getCornerOneCoordinates(),
      bottomRight: storageManager.getCornerTwoCoordinates(),
    },
  }) {
    super({
      elementId,
      classes: classes.concat(['worldMapView']),
    });

    this.markers = {};
    this.worldMap = undefined;
    this.clusterer = undefined;
    this.heatMapPoints = undefined;
    this.heatMapLayer = undefined;
    this.backgroundColor = backgroundColor;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.mapStyles = mapStyles;
    this.centerCoordinates = centerCoordinates;
    this.cornerCoordinates = cornerCoordinates;
    this.positionTypes = positionTypes;
    this.listId = listId;
    this.rightClickMenu = elementCreator.createContainer({
      elementId: `${this.elementId}${ids.RIGHTCLICKMENU}`,
    });
    this.leftClickMenu = elementCreator.createContainer({
      elementId: `${this.elementId}${ids.LEFTCLICKMENU}`,
    });

    eventHandler.addWatcher({
      event: eventHandler.Events.WORLDMAP,
      func: () => {
        this.startMap();
      },
    });

    eventHandler.addWatcher({
      event: eventHandler.Events.FOCUS_MAPPOSITION,
      func: ({ origin, position }) => {
        const marker = this.markers[position.objectId];

        if (marker && (!listId || listId === origin)) {
          this.realignMap({ markers: [marker] });
        }
      },
    });

    eventHandler.addWatcher({
      event: eventHandler.Events.POSITION,
      func: ({ position, changeType }) => {
        switch (changeType) {
          case socketManager.ChangeTypes.CREATE: {
            const marker = new MapMarker({ position, worldMapView: this });

            this.markers[position.objectId] = marker;

            break;
          }
          case socketManager.ChangeTypes.UPDATE: {
            const marker = new MapMarker({ position, worldMapView: this });

            this.markers[position.objectId] = marker;

            break;
          }
          case socketManager.ChangeTypes.REMOVE: {
            this.markers[position.objectId].setMap(null);
            this.markers[position.objectId] = undefined;

            break;
          }
          default: {
            break;
          }
        }
      },
    });

    if (worldMapHandler.hasFected) {
      this.startMap();
    }
  }

  realignMap({ markers }) {
    const bounds = new google.maps.LatLngBounds();

    if (markers) {
      Object.keys(markers).forEach((markerId) => {
        const marker = markers[markerId];

        if (marker) {
          bounds.extend(marker.getPosition());
        }
      });
    } else {
      bounds.extend(new google.maps.LatLng(this.cornerCoordinates.upperLeft.latitude, this.cornerCoordinates.upperLeft.longitude));
      bounds.extend(new google.maps.LatLng(this.cornerCoordinates.bottomRight.latitude, this.cornerCoordinates.bottomRight.longitude));
    }

    this.worldMap.fitBounds(bounds);
  }

  createMarkers() {
    const markers = {};
    const positions = dataHandler.positions.getObjects({
      orCheck: true,
      filter: {
        rules: this.positionTypes.map((positionType) => {
          return {
            paramName: 'positionType',
            paramValue: positionType,
          };
        }),
      },
    });

    positions.forEach((position) => {
      markers[position.objectId] = new MapMarker({ position, worldMapView: this });
    });

    return markers;
  }

  showRightClickBox(event) {
    const projection = this.overlay.getProjection();
    const xy = projection.fromLatLngToContainerPixel(event.latLng);

    this.rightClickMenu.style.left = `${xy.x + 5}px`;
    this.rightClickMenu.style.top = `${xy.y + 5}px`;

    this.rightClickMenu.classList.remove('hide');
  }

  hideRightClickMenu() {
    this.rightClickMenu.classList.add('hide');
  }

  createPositionClickBox({ event, positionId }) {
    const position = dataHandler.positions.getObject({ objectId: positionId });


  }

  createPositionRightClickBox({ event, positionId }) {
    dataHandler.positions.fetchObject({
      params: { positionId, full: true },
      noEmit: true,
      callback: ({ error, data }) => {
        if (error) {
          return;
        }

        this.showRightClickBox(event);
      },
    });
  }

  createMapRightClickBox(event) {
    this.showRightClickBox(event);
  }

  createMapClickBox() {

  }

  startMap() {
    const centerCoordinates = storageManager.getCenterCoordinates();

    this.worldMap = new google.maps.Map(this.element, {
      disableDefaultUI: true,
      fullscreenControl: false,
      keyboardShortcuts: false,
      mapTypeControl: false,
      noClear: true,
      zoomControl: false,
      panControl: false,
      overviewMapControl: false,
      rotateControl: false,
      scaleControl: false,
      streetViewControl: false,
      center: {
        lat: centerCoordinates.latitude,
        lng: centerCoordinates.longitude,
      },
      zoom: this.defaultZoomLevel,
      backgroundColor: this.backgroundColor,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      styles: this.mapStyles,
    });

    mouseHandler.addGMapsClickListener({
      element: this.worldMap,
      right: (event) => {
        this.createMapRightClickBox(event);
      },
    });

    this.markers = this.createMarkers();

    Object.keys(this.markers).forEach((markerId) => {
      const marker = this.markers[markerId];

      if (marker) {
        marker.setMap(this.worldMap);
      }
    });

    this.overlay = new google.maps.OverlayView();
    this.overlay.draw = () => {};
    this.overlay.setMap(this.worldMap);

    this.element.appendChild(this.rightClickMenu);

    this.realignMap({
      markers: this.createMarkers(),
    });
  }
}

module.exports = WorldMapView;
