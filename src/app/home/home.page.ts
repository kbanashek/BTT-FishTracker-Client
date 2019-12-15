import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TravelMarker, TravelMarkerOptions } from 'travel-marker';
import { HttpClient } from '@angular/common/http';
import { StateService, RepeatingServiceCall } from '../state.service';
import { of } from 'rxjs/internal/observable/of';
import { serviceURL } from '../app.component';
import { takeUntil } from 'rxjs/operators';
import { timer } from 'rxjs/internal/observable/timer';
import { Subject } from 'rxjs';
import { cSnapToRoute } from './distance';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  currentRecordID: any;
  currentLatLong: string;

  constructor(
    public platform: Platform,
    private http: HttpClient,
    private state: StateService,
  ) {
    this.height = platform.height();
    this.stateService = this.state;
  }
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
  markerDates: any[] = [];
  subject = new Subject();
  caller = new RepeatingServiceCall<any>(2000);
  sub: any;
  timer: any;
  markerDate = '';
  hexColor = '#000000';
  selectItem = '';

  async ngOnInit() {
    this.timer = timer(1000, 1000);

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
    this.map = map;
    this.map.mapTypeId = google.maps.MapTypeId.HYBRID;
    this.map.zoomControl = true;
    this.map.zoomControlOptions = {
      position: google.maps.ControlPosition.RIGHT_TOP,
    };

    this.map.addListener('dragend', () => {
      if (this.travelRoute) {
        this.activeNow('pause');
        this.travelRoute.pause();
        this.subject.next();
      }
    });
  };

  toggleBackgroundColor(): void {
    if (this.hexColor === '#000000') {
      this.hexColor = '#dddddd';
    } else {
      this.hexColor = '#000000';
    }
  }

  loadLayerData = (layerId: string) => {
    this.http
      .get(serviceURL + '?ID=' + layerId)
      .subscribe(layerData => this.loadMap(layerData as any[])); // TODO: Error handling
  };

  loadMap = (points: any[]) => {
    this.clearMapLayerData();
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

    layerPoints.forEach(x =>
      this.routePath
        .getPath()
        .push(new google.maps.LatLng(x.Latitude, x.Longitude), x.ID),
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
      'General Location',
      100,
    );
    this.endMarker = this.getRouteStartStopMarker(endPoint, 'Last Location');

    this.map.panTo(initialPoint);

    this.map.setZoom(12);

    // const maxZoomService = new google.maps.MaxZoomService();
    // this.map.addListener('click', showMaxZoom);
  };

  initRoute = () => {
    const routePoints = this.routePath.getPath().g;

    const travelMarkerOptions: TravelMarkerOptions = this.getTravelMarkers();
    this.travelRoute = new TravelMarker(travelMarkerOptions);
    this.travelRoute.addListener('click', e => {
      this.placeMarkerAndPanTo(e.latLng, this.map);
    });

    this.travelRoute.addLocation(routePoints);
    this.travelRoute.setSpeedMultiplier(1); // reset to initial play time upon selection of new layer source
    this.timer
      .pipe(takeUntil(this.subject))
      .subscribe(() => this.onMapUpdate());

    setTimeout(() => this.play(), 2000);
  };

  closest = (latLong, listData) => {
    const arr = listData;
    const pnt = latLong;
    const distArr = [];
    const dist = google.maps.geometry.spherical.computeDistanceBetween;

    // tslint:disable-next-line: forin
    for (const index in arr) {
      const currentPoint = new google.maps.LatLng(
        arr[index].Latitude,
        arr[index].Longitude,
      );
      distArr.push([arr[index], dist(pnt, currentPoint)]);
    }

    return distArr.sort((a, b) => {
      return a[1] - b[1];
    })[0][0];
  };

  findClosestMarker = latLng => {
    const distances = [];
    let closest = -1;

    // const filteredPointData = this.pointData.filter(
    //   x => x.RecordID >= this.currentRecordID,
    // );

    this.pointData.forEach((point, i) => {
      if (point.Latitude && point.Longitude) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(point.Latitude, point.Longitude),
          latLng,
        );

        distances[i] = distance;

        if (closest === -1 || distance < distances[closest]) {
          closest = i;
        }
      }
    });

    if (this.pointData[closest].RecordID === 894) {
      console.log(distances);
    }

    return this.pointData[closest] ? this.pointData[closest] : null;
  };

  clearMapLayerData = () => {
    this.markerDate = '';
    this.currentRecordID = null;
    this.currentLatLong = null;
    this.markerDates = [];
  };

  inRange(x, min, max) {
    return (x - min) * (x - max) <= 0;
  }

  onMapUpdate() {
    const currentMarker = this.travelRoute.marker;
    const closestMarkerIndex = currentMarker.index;
    console.log(closestMarkerIndex);

    if (
      !this.markerDates.some(
        x => x.Display_Date === this.pointData[closestMarkerIndex].Display_Date,
      )
    ) {
      this.markerDates.push(this.pointData[closestMarkerIndex]);
    }

    this.currentRecordID = currentMarker.RecordID;
    this.markerDate = this.pointData[closestMarkerIndex].Display_Date;

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

  getRouteStartStopMarker = (
    initialPoint: any,
    labelText: string,
    scale: number = 14,
  ) => {
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
        scale,
        path: google.maps.SymbolPath.CIRCLE,

        fillColor: 'silver',
        fillOpacity: 0.65,
        strokeWeight: 0.5,
        scaledSize: {
          width: 60,
          height: 60,
        },
        color: 'black',
        fontFamily: '',
        fontSize: '18px',
        fontWeight: 'normal',
      },
    });
  };

  getInfoWindowContent = (closestMarker: any): string => {
    let contentWindowContent =
      '<div>' +
      '<div style="padding:5px"><strong>Fish ID:</strong> ' +
      closestMarker.ID +
      '</div>' +
      '<div style="padding:5px"><strong>Area Caught: </strong>' +
      closestMarker['General.Location'] +
      '</div>' +
      '<div style="padding:5px"><strong>Fork Length:</strong> ' +
      closestMarker['FL.in'] +
      '</div>' +
      '<div style="padding:5px" ><strong>Weight:</strong> ' +
      closestMarker['WT.lb'] +
      'lbs</div>';

    if (closestMarker.Guide !== '') {
      const guideInfo =
        '<div style="padding:5px"><strong>Guide:</strong> ' +
        closestMarker.Guide +
        '</div>';
      contentWindowContent += guideInfo;
    }

    return contentWindowContent + '</div>';
  };

  getTravelMarkers = (): TravelMarkerOptions => {
    return {
      map: this.map,
      speed: 1000,
      interval: 10,
      speedMultiplier: 1,
      markerOptions: {
        title: this.pointData[0].Fish,
        clickable: true,
        map: this.map,
        animation: google.maps.Animation.DROP,
        icon: {
          url: 'assets/tarpon.png',
          animation: google.maps.Animation.DROP,
          scaledSize: new google.maps.Size(94, 47),
          // origin: new google.maps.Point(0, 0),
          // rotation: 33.25,
          // anchor: new google.maps.Point(10, 5),
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
    this.activeNow('pause');
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

  activeNow(item: string) {
    this.selectItem = item;
  }

  play() {
    this.activeNow('play');
    this.removeMarkers();
    this.travelRoute.play();
    this.timer
      .pipe(
        takeUntil(this.subject),
        // tap(() => console.log('x')),
      )
      .subscribe(() => this.onMapUpdate());
  }

  pause = () => {
    this.activeNow('pause');
    of(
      this.placeMarkerAndPanTo(this.travelRoute.getPosition(), this.map),
    ).subscribe(() => {
      this.caller.stop();
      this.subject.next();
    });
  };

  reset() {
    this.clearMapLayerData();
    this.removeMarkers();
    this.travelRoute.reset();
  }

  next() {
    this.travelRoute.pause();
    this.travelRoute.next();
    console.log(this.travelRoute.getPosition().toString()); // TODO USE THIS TO LOOK UP POINTDATE.DATETIME
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
