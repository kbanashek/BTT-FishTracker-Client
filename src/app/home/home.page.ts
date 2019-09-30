import { Component, Input, EventEmitter, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import {
  TravelMarker,
  TravelMarkerOptions,
  TravelData,
  TravelEvents,
  EventType,
} from 'travel-marker';

import { HttpClient } from '@angular/common/http';
import { StateService, RepeatingServiceCall } from '../state.service';
import { of } from 'rxjs/internal/observable/of';
import { serviceURL } from '../app.component';
import { fromEvent } from 'rxjs/internal/observable/fromEvent';
import { tap, takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs/internal/Observable';

import { timer } from 'rxjs/internal/observable/timer';
import { Subject } from 'rxjs';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  title = 'BTT - FishTracker';
  height = 0;
  zoom = 9;
  lat = 25;
  lng = -80.627836399999983;
  map: any;
  routePath: any;
  directionsService: any;
  travelRoute: TravelMarker = null;
  speedMultiplier = 1;
  infoWindow: any;
  previousMarker: any;
  emptyMarker: any;
  selectedItem: any;
  stateService: StateService;
  startMarker: any;
  endMarker: any;
  pointData: any[];
  subject = new Subject();
  caller = new RepeatingServiceCall<any>(2000);
  sub: any;
  timer: any;

  constructor(
    public platform: Platform,
    private http: HttpClient,
    private state: StateService,
  ) {
    this.height = platform.height();
    this.stateService = this.state;
  }

  ngOnInit() {
    this.timer = timer(2000, 3000);
    this.stateService.getSelectedLayer.subscribe(selectedLayer => {
      if (selectedLayer) {
        if (this.routePath) {
          this.clearMap();
        }
        this.loadLayerData(selectedLayer.ID);
      }
    });
  }

  clearMap = (): void => {
    this.routePath.setMap(null);
    this.startMarker.setMap(null);
    this.endMarker.setMap(null);
    this.travelRoute.setMap(null);
  };

  onMapReady = (map: any): void => {
    const mapOptions = {
      panControl: true,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      overviewMapControl: true,
      rotateControl: true,
    };

    this.map = map;
    this.map.mapTypeId = google.maps.MapTypeId.HYBRID;
    this.map.zoomControl = true;
    this.map.zoomControlOptions = {
      position: google.maps.ControlPosition.RIGHT_TOP,
    };
  };

  loadLayerData = (layerId: string) => {
    this.http
      .get(serviceURL + '?ID=' + layerId)
      .subscribe(layerData => this.loadMap(layerData as any[])); // TODO: Error handling
  };

  loadMap = (points: any[]) => {
    this.pointData = points;
    this.createRoutePath(points);
    this.setStartEndPoints(points);
    this.initRoute();
  };

  createRoutePath = (layerPoints: any[]) => {
    this.routePath = new google.maps.Polyline({
      strokeOpacity: 0.5,
      strokeColor: 'yellow',
      path: [],
      map: this.map,
    });

    this.addRoutePoints(layerPoints);
  };

  addRoutePoints = (layerPoints: any[]) => {
    layerPoints.forEach(x =>
      this.routePath
        .getPath()
        .push(new google.maps.LatLng(x.Latitude, x.Longitude)),
    );
  };

  setStartEndPoints = (points: any[]) => {
    const initialPoint = new google.maps.LatLng(
      points[0].Latitude,
      points[0].Longitude,
    );
    const endPoint = new google.maps.LatLng(
      points[points.length - 1].Latitude,
      points[points.length - 1].Longitude,
    );

    this.startMarker = this.getRouteStartStopMarker(
      initialPoint,
      'Initial Point',
    );
    this.endMarker = this.getRouteStartStopMarker(endPoint, 'Last Location');

    this.map.panTo(initialPoint);
    this.map.setZoom(12);
  };

  initRoute = () => {
    const routePoints = this.routePath.getPath().j;

    const travelMarkerOptions: TravelMarkerOptions = this.getTravelMarkers();

    this.travelRoute = new TravelMarker(travelMarkerOptions);

    this.travelRoute.addListener('click', e => {
      this.placeMarkerAndPanTo(e.latLng, this.map);
    });

    this.travelRoute.addLocation(routePoints);

    this.timer.pipe(takeUntil(this.subject)).subscribe(t => this.onTimeOut());

    setTimeout(() => this.play(), 2000);
  };

  findClosestMarker = latLng => {
    const distances = [];
    let closest = -1;

    this.pointData.forEach((point, i) => {
      if (this.pointData[i].Latitude && this.pointData[i].Longitude) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(
            this.pointData[i].Latitude,
            this.pointData[i].Longitude,
          ),
          latLng,
        );
        distances[i] = distance;
        if (closest === -1 || distance < distances[closest]) {
          closest = i;
        }
      }
    });

    return this.pointData[closest] ? this.pointData[closest] : null;
  };

  onTimeOut() {
    //console.log('panning:' + this.travelRoute.getPosition());
    this.map.panTo(this.travelRoute.getPosition());
  }

  placeMarkerAndPanTo = (latLng, map) => {
    this.getEmptyMarker(latLng, map);

    google.maps.event.addListener(this.emptyMarker, 'click', () => {
      this.pauseAndShowInfoWindow(latLng, map);
    });

    google.maps.event.trigger(this.emptyMarker, 'click');

    map.panTo(latLng);
  };

  getRouteStartStopMarker = (initialPoint: any, labelText: string) => {
    return new google.maps.Marker({
      position: initialPoint,
      map: this.map,
      label: labelText,
      labelOptions: {
        color: 'white',
        fontFamily: '',
        fontSize: '18px',
        fontWeight: 'normal',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 16,
        fillColor: 'silver',
        fillOpacity: 0.65,
        strokeWeight: 0.5,
        scaledSize: {
          width: 20,
          height: 20,
        },
        color: 'white',
        fontFamily: '',
        fontSize: '18px',
        fontWeight: 'normal',
      },
    });
  };

  getInfoWindowContent = (closestMarker: any): string => {
    return (
      '<div>' +
      // '<div id="content" style="font-size:15pt"><b>' +
      // closestMarker.Fish +
      // '</b></div>' +
      '<div><strong>Fish ID:</strong> ' +
      closestMarker.ID +
      '</div>' +
      '<div><strong>Area Caught: </strong>' +
      closestMarker.GeneralLocation +
      '</div>' +
      '<div><strong>Fork Length:</strong> ' +
      closestMarker.FLin +
      '</div>' +
      '<div><strong>Weight:</strong> ' +
      closestMarker.WTlb +
      'lbs</div>' +
      '</div>'
    );
  };

  getTravelMarkers = (): TravelMarkerOptions => {
    return {
      map: this.map,
      speed: 1000,
      interval: 10,
      speedMultiplier: this.speedMultiplier,
      markerOptions: {
        title: this.pointData[0].Fish,
        clickable: true,
        map: this.map,
        animation: google.maps.Animation.DROP,
        icon: {
          url:
            'https://greyghostcharters.com/wp-content/uploads/2014/04/tarpon-species.png',
          animation: google.maps.Animation.DROP,
          scaledSize: new google.maps.Size(94, 47),
          origin: new google.maps.Point(0, 0),
          rotation: 33.25,
          anchor: new google.maps.Point(10, 5),
        },
      },
    };
  };

  removeMarkers = (): void => {
    if (this.previousMarker && this.previousMarker.setMap) {
      this.previousMarker.setMap(null);
    }
  };

  private getEmptyMarker(latLng: any, map: any) {
    this.emptyMarker = new google.maps.Marker({
      position: latLng,
      map,
    });
    this.emptyMarker.setVisible(false);
  }

  private pauseAndShowInfoWindow(latLng: any, map: any) {
    this.travelRoute.pause();
    this.removeMarkers();
    const closestMarker = this.findClosestMarker(latLng);
    const infoWindowContent = this.getInfoWindowContent(closestMarker);
    const infoWindow = new google.maps.InfoWindow();
    google.maps.event.addListener(infoWindow, 'closeclick', () => {
      this.emptyMarker.setMap(null);
      this.play();
    });
    infoWindow.setContent(infoWindowContent);
    infoWindow.open(map, this.emptyMarker);
    this.previousMarker = this.emptyMarker;
  }

  play() {
    this.removeMarkers();
    this.travelRoute.play();
    this.timer.pipe(takeUntil(this.subject)).subscribe(t => this.onTimeOut());
    // of(this.travelRoute.play())
    //   .pipe(
    //     tap(() => {
    //       console.log('PLAYING');
    //     }),
    //   )
    //   .subscribe(() => this.caller.start());
  }

  pause() {
    of(this.placeMarkerAndPanTo(this.travelRoute.getPosition(), this.map))
      // .pipe(tap(() => this.timer.unsubscribe()))
      .subscribe(() => {
        this.caller.stop();
        this.subject.next();
      });
  }

  reset() {
    this.travelRoute.reset();
    this.removeMarkers();
  }

  next() {
    this.travelRoute.pause();
    this.travelRoute.next();
    this.removeMarkers();
  }

  prev() {
    this.travelRoute.pause();
    this.travelRoute.prev();
    this.removeMarkers();
  }

  fast() {
    this.speedMultiplier *= 2;
    this.travelRoute.setSpeedMultiplier(this.speedMultiplier);
    this.removeMarkers();
  }

  slow() {
    this.speedMultiplier /= 2;
    this.travelRoute.setSpeedMultiplier(this.speedMultiplier);
    this.removeMarkers();
  }

  initEvents() {
    // if (this.marker) {
    //   this.marker.event.onEvent((event: EventType, data: TravelData) => {
    //     console.log(event, data);
    //   });
    // }
  }
}
