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
import { StateService } from '../state.service';
import { of } from 'rxjs/internal/observable/of';

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
  serviceURL = 'https://btt-api.herokuapp.com/tarpons?ID=';
  infoWindow: any;
  previousMarker: any;
  emptyMarker: any;
  selectedItem: any;
  stateService: StateService;
  startMarker: any;
  endMarker: any;

  constructor(
    public platform: Platform,
    private http: HttpClient,
    private state: StateService,
  ) {
    this.height = platform.height();
    this.stateService = this.state;
  }

  ngOnInit() {
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

  onMapReady(map: any) {
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
    // this.map.mapTypeControl = true;
    this.map.zoomControl = true;
    this.map.zoomControlOptions = {
      position: google.maps.ControlPosition.RIGHT_TOP,
    };
  }

  loadLayerData(layerId: string) {
    this.http
      .get(this.serviceURL + layerId)
      .subscribe(layerData => this.loadMap(layerData as any[]));
  }

  private loadMap(points: any[]) {
    this.createRoutePath(points);
    this.setStartEndPoints(points);
    this.initRoute();
  }

  private createRoutePath(points: any[]) {
    const locationArray: any[] = [];

    // I know this can be done via pipe(map())
    points.forEach(x =>
      locationArray.push(new google.maps.LatLng(x.Latitude, x.Longitude)),
    );

    this.routePath = new google.maps.Polyline({
      strokeOpacity: 0.5,
      strokeColor: 'yellow',
      path: [],
      map: this.map,
    });
    locationArray.forEach(l => this.routePath.getPath().push(l));
  }

  private setStartEndPoints(points: any[]) {
    const initialPoint = new google.maps.LatLng(
      points[0].Latitude,
      points[0].Longitude,
    );
    const endPoint = new google.maps.LatLng(
      points[points.length - 1].Latitude,
      points[points.length - 1].Longitude,
    );

    this.startMarker = new google.maps.Marker({
      position: initialPoint,
      map: this.map,
      label: 'Initial Location',
    });
    this.endMarker = new google.maps.Marker({
      position: endPoint,
      map: this.map,
      label: 'Last Location',
    });
  }

  private initRoute() {
    const routePoints = this.routePath.getPath().j;

    // options
    const travelMarkerOptions: TravelMarkerOptions = {
      map: this.map,
      speed: 1000, // default 10 , animation speed
      interval: 10,
      speedMultiplier: this.speedMultiplier,
      markerOptions: {
        title: 'Travel Marker',
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

    this.travelRoute = new TravelMarker(travelMarkerOptions);

    this.travelRoute.addListener('click', e => {
      console.log(e);
      this.placeMarkerAndPanTo(e.latLng, this.map, this.travelRoute);
    });

    this.travelRoute.addLocation(routePoints);

    setTimeout(() => this.play(), 2000);
  }

  placeMarkerAndPanTo = (latLng, map, markerToAttach: TravelMarker) => {
    const infoContent =
      '<div id="content">' + markerToAttach.getPosition() + '</div>';

    this.emptyMarker = new google.maps.Marker({
      position: latLng,
      map,
      // options:{
      //   vi
      // }
    });

    // google.maps.event.addListener(this.map, 'bounds_changed', () => {
    //   window.setTimeout(() => {
    //     map.panTo(emptyMarker.getPosition());
    //   }, 1000);
    // });

    google.maps.event.addListener(this.emptyMarker, 'click', () => {
      this.removeMarkers();

      const infowindow = new google.maps.InfoWindow();
      infowindow.setContent(infoContent);
      infowindow.open(map, this.emptyMarker);

      this.previousMarker = this.emptyMarker;
    });

    google.maps.event.trigger(this.emptyMarker, 'click');

    map.panTo(latLng);
  };

  private removeMarkers() {
    if (this.previousMarker && this.previousMarker.setMap) {
      this.previousMarker.setMap(null);
    }
  }

  play() {
    this.removeMarkers();
    this.travelRoute.play();
  }

  pause() {
    this.travelRoute.pause();
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
