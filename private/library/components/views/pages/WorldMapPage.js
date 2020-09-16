import BaseView from '../BaseView';
import MapMarker from '../../worldMap/MapMarker';
import MapLine from '../../worldMap/MapLine';
import MapPolygon from '../../worldMap/MapPolygon';
import MapObject from '../../worldMap/MapObject';
import PositionDialog from '../dialogs/PositionDialog';
import MapCircle from '../../worldMap/MapCircle';

import elementCreator from '../../../ElementCreator';
import positionComposer from '../../../data/composers/PositionComposer';
import storageManager from '../../../StorageManager';
import eventHandler from '../../../EventCentral';
import socketManager from '../../../SocketManager';
import mouseHandler from '../../../MouseHandler';
import labelHandler from '../../../labels/LabelHandler';
import viewSwitcher from '../../../ViewSwitcher';

class WorldMapPage extends BaseView {
  constructor({
    mapStyles,
    polygonStyle,
    lineStyle,
    markerStyle,
    circleStyle,
    labelStyle,
    listId,
    clusterStyle,
    hoverExcludeRule = {},
    triggeredStyles = {},
    choosableStyles = {},
    alwaysShowLabels = {},
    classes = [],
    elementId = `mapView-${Date.now()}`,
    positionTypes = [],
    backgroundColor = '#000000',
    minZoom = 4,
    maxZoom = 15,
    centerCoordinates,
    cornerCoordinates,
  }) {
    super({
      elementId,
      classes: classes.concat(['worldMapPage']),
    });

    this.markers = {};
    this.worldMap = undefined;
    this.clusterer = undefined;
    this.overlay = undefined;
    this.backgroundColor = backgroundColor;
    this.polygonStyle = polygonStyle;
    this.lineStyle = lineStyle;
    this.markerStyle = markerStyle;
    this.circleStyle = circleStyle;
    this.clusterStyle = clusterStyle;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.mapStyles = mapStyles;
    this.centerCoordinates = centerCoordinates;
    this.cornerCoordinates = cornerCoordinates;
    this.positionTypes = Object.values(positionComposer.PositionTypes).concat(positionTypes);
    this.listId = listId;
    this.labelStyle = labelStyle;
    this.alwaysShowLabels = alwaysShowLabels;
    this.choosableStyles = choosableStyles;
    this.triggeredStyles = triggeredStyles;
    this.hoverExcludeRule = hoverExcludeRule;

    this.element.appendChild(MapObject.leftClickBox);
    this.element.appendChild(MapObject.rightClickBox);

    eventHandler.addWatcher({
      event: eventHandler.Events.WORLDMAP,
      func: () => {
        this.startMap();
      },
    });

    eventHandler.addWatcher({
      event: eventHandler.Events.SHOW_MAP_CLICK_BOX,
      func: () => {
        if (!document.body.contains(MapObject.leftClickBox)) {
          console.log('clicked box');

          this.element.appendChild(MapObject.leftClickBox);
          this.element.appendChild(MapObject.rightClickBox);
        }
      },
    });
  }

  insertPosition({
    position,
    changeType,
  }) {
    if (!this.worldMap || (position.coordinatesHistory && position.coordinatesHistory.length === 0)) {
      return;
    }

    switch (changeType) {
      case socketManager.ChangeTypes.CREATE:
      case socketManager.ChangeTypes.UPDATE: {
        const oldMarker = this.markers[position.objectId];

        if (oldMarker) {
          this.clusterer.removeMarker(oldMarker.mapObject);
          oldMarker.setMap(null);
        }

        const newMarker = this.createMarker({ position });
        this.markers[position.objectId] = newMarker;

        newMarker.setMap(this.worldMap);

        if (newMarker.shouldCluster) {
          this.clusterer.addMarker(newMarker.mapObject);
        }

        break;
      }
      case socketManager.ChangeTypes.REMOVE: {
        const marker = this.markers[position.objectId];

        this.clusterer.removeMarker(marker.mapObject);
        marker.setMap(null);

        this.markers[position.objectId] = undefined;

        break;
      }
      default: {
        break;
      }
    }
  }

  realignMap({
    markers,
    zoomLevel,
    useDefaultCoordinates = false,
  }) {
    const bounds = new google.maps.LatLngBounds();

    if (!useDefaultCoordinates && markers) {
      markers.forEach((marker) => {
        const coordinates = marker.getCenter();

        bounds.extend(new google.maps.LatLng(coordinates.latitude, coordinates.longitude));
      });
    } else {
      const cornerCoordinates = this.cornerCoordinates || {
        upperLeft: storageManager.getCornerOneCoordinates(),
        bottomRight: storageManager.getCornerTwoCoordinates(),
      };

      this.worldMap.setZoom(zoomLevel || this.maxZoom);
      bounds.extend(new google.maps.LatLng(cornerCoordinates.upperLeft.latitude, cornerCoordinates.upperLeft.longitude));
      bounds.extend(new google.maps.LatLng(cornerCoordinates.bottomRight.latitude, cornerCoordinates.bottomRight.longitude));
    }

    this.worldMap.fitBounds(bounds);
    this.worldMap.setCenter(bounds.getCenter());

    if (zoomLevel) {
      this.worldMap.setZoom(zoomLevel);
    }
  }

  /**
   * Create a marker based on its type.
   * @param {Object} params Parameters.
   * @param {Object} params.position Position to create a marker for.
   * @return {Object} The created marker.
   */
  createMarker({ position }) {
    let newMarker;

    switch (position.positionStructure) {
      case positionComposer.PositionStructures.CIRCLE: {
        newMarker = new MapCircle({
          position,
          overlay: this.overlay,
          hoverExcludeRule: this.hoverExcludeRule.circles,
          triggeredStyles: this.triggeredStyles.circles,
          choosableStyles: this.choosableStyles.circles,
          alwaysShowLabel: this.alwaysShowLabels.circle,
          labelStyle: this.labelStyle,
          styles: this.circleStyle,
        });
        break;
      }
      case positionComposer.PositionStructures.LINE: {
        newMarker = new MapLine({
          position,
          overlay: this.overlay,
          hoverExcludeRule: this.hoverExcludeRule.lines,
          triggeredStyles: this.triggeredStyles.lines,
          choosableStyles: this.choosableStyles.lines,
          alwaysShowLabel: this.alwaysShowLabels.line,
          labelStyle: this.labelStyle,
          styles: this.lineStyle,
        });

        break;
      }
      case positionComposer.PositionStructures.POLYGON: {
        newMarker = new MapPolygon({
          position,
          overlay: this.overlay,
          hoverExcludeRule: this.hoverExcludeRule.polygons,
          triggeredStyles: this.triggeredStyles.polygons,
          choosableStyles: this.choosableStyles.polygons,
          alwaysShowLabel: this.alwaysShowLabels.polygon,
          labelStyle: this.labelStyle,
          styles: this.polygonStyle,
        });

        break;
      }
      default: {
        newMarker = new MapMarker({
          position,
          overlay: this.overlay,
          hoverExcludeRule: this.hoverExcludeRule.markers,
          triggeredStyles: this.triggeredStyles.markers,
          choosableStyles: this.choosableStyles.markers,
          alwaysShowLabel: this.alwaysShowLabels.marker,
          labelStyle: this.labelStyle,
          styles: this.markerStyle,
        });

        break;
      }
    }

    return newMarker;
  }

  /**
   * Markers will be created for all available positions and added to the marker collection.
   */
  createMarkers() {
    const positions = positionComposer.getPositions({ positionTypes: this.positionTypes });

    positions.forEach((position) => {
      this.insertPosition({
        position,
        changeType: socketManager.ChangeTypes.CREATE,
      });
    });
  }

  /**
   * Clear and then reinsert all markers to the clusterer.
   */
  resetClusterer() {
    if (!this.clusterer) {
      return;
    }

    this.clusterer.clearMarkers();
    this.clusterer.addMarkers(Object.keys(this.markers)
      .filter((markerId) => this.markers[markerId].shouldCluster)
      .map((markerId) => this.markers[markerId].mapObject));
  }

  /**
   * Show the right click menu DOM element on the clicked position on the map.
   * @param {Object} params Parameters.
   * @param {Object} params.event Click event.
   */
  showMapRightClickBox({ event }) { // eslint-disable-line
    const {
      CreatePosition = { accessLevel: 1 },
    } = storageManager.getPermissions();
    const { x, y } = event.pixel;
    const items = [];

    /**
     * Add create position item, if the user has access to the command.
     */
    if (storageManager.getAccessLevel() >= CreatePosition.accessLevel) {
      items.push({
        elements: [elementCreator.createSpan({
          text: labelHandler.getLabel({ baseObject: 'MapObject', label: 'createPosition' }),
        })],
        clickFuncs: {
          leftFunc: () => {
            MapObject.hideRightClickBox();

            const dialog = new PositionDialog({
              latitude: event.latLng.lat(),
              longitude: event.latLng.lng(),
            });

            dialog.addToView({ element: viewSwitcher.getParentElement() });
          },
        },
      });
    }

    /**
     * Show menu, if there are any items to show.
     */
    if (items.length > 0) {
      MapObject.showRightClickBox({
        x,
        y,
        container: elementCreator.createContainer({ elements: [elementCreator.createList({ items })] }),
      });
    }
  }

  /**
   * Create the map, clusterer, markers and attach listeners.
   */
  startMap() {
    if (this.worldMap) {
      return;
    }

    if (typeof google === 'undefined' || typeof MarkerClusterer === 'undefined' || typeof MapLabel === 'undefined') {
      setTimeout(this.startMap, 1000);

      return;
    }

    const centerCoordinates = this.centerCoordinates || storageManager.getCenterCoordinates();

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
    this.clusterer = new MarkerClusterer(this.worldMap, [], this.clusterStyle);
    this.overlay = new google.maps.OverlayView();
    this.overlay.setMap(this.worldMap);

    this.createMarkers({
      worldMap: this.worldMap,
    });

    this.resetClusterer();

    this.realignMap({
      useDefaultCoordinates: true,
    });

    mouseHandler.addGMapsClickListener({
      element: this.worldMap,
      leftFunc: () => {
        MapObject.hideLeftClickBox();
        MapObject.hideRightClickBox();
      },
      right: (event) => {
        MapObject.hideLeftClickBox();
        this.showMapRightClickBox({ event });
      },
    });

    google.maps.event.addListener(this.worldMap, 'drag', () => {
      MapObject.hideLeftClickBox();
      MapObject.hideRightClickBox();
    });

    google.maps.event.addListener(this.worldMap, 'zoom_changed', () => {
      eventHandler.emitEvent({
        event: eventHandler.Events.ZOOM_WORLDMAP,
        params: {
          map: this.worldMap,
          zoomLevel: this.worldMap.getZoom() || this.minZoom,
        },
      });
    });

    eventHandler.addWatcher({
      event: eventHandler.Events.FOCUS_MAPPOSITION,
      func: ({
        showDescription,
        origin,
        position,
        zoomLevel,
      }) => {
        const marker = this.markers[position.objectId];

        if (marker && (!this.listId || this.listId === origin)) {
          this.realignMap({
            zoomLevel,
            markers: [marker],
          });
          marker.markPosition({});
        }

        if (showDescription) {
          MapObject.buildLeftClickBox({ position: positionComposer.getPosition({ positionId: position.objectId }) });
        }
      },
    });

    eventHandler.addWatcher({
      event: eventHandler.Events.POSITIONS,
      func: (data) => {
        const {
          changeType,
          positions = [],
        } = data;

        positions.forEach((position) => {
          this.insertPosition({
            position,
            changeType,
          });
        });
      },
    });

    eventHandler.addWatcher({
      event: eventHandler.Events.POSITION,
      func: (data) => {
        const { position, changeType } = data;

        this.insertPosition({
          position,
          changeType,
        });
      },
    });

    eventHandler.addWatcher({
      event: eventHandler.Events.AGED_POSITIONS,
      func: ({ positions }) => {
        positions.forEach((position) => {
          const marker = this.markers[position.objectId];

          if (marker) {
            this.clusterer.removeMarker(marker.mapObject);
            marker.setMap(null);
          }
        });
      },
    });
  }
}

export default WorldMapPage;
