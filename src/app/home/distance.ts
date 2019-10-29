declare var google: any;

// tslint:disable-next-line: class-name
class cSnapToRoute {
  private routePoints = [];
  private routePixels = [];
  // tslint:disable-next-line: variable-name
  private _oMap = null;
  // tslint:disable-next-line: variable-name
  private _oPolyline = null;

  constructor(oMap, oPolyline) {
    this._oMap = oMap;
    this._oPolyline = oPolyline;

    this.loadRouteData(); // Load needed data for point calculations
  }

  loadRouteData = function() {
    this.routePixels = [];
    const proj = this._oMap.getProjection();
    for (let i = 0; i < this._oPolyline.getPath().getLength(); i++) {
      const Px = proj.fromLatLngToPoint(this._oPolyline.getPath().getAt(i));
      this.routePixels.push(Px);
    }
  };

  getClosestLatLng = function(latlng) {
    const r = this.distanceToLines(latlng);
    const proj = this._oMap.getProjection();
    return proj.fromPointToLatLng(new google.maps.Point(r.x, r.y));
  };

  getDistAlongRoute = function(latlng) {
    const r = this.distanceToLines(latlng);
    return this.getDistToLine(r.i, r.fTo);
  };

  distanceToLines = function(thisLatLng) {
    const tm = this._oMap;
    const proj = this._oMap.getProjection();
    const thisPx = proj.fromLatLngToPoint(thisLatLng);
    const routePixels = this.routePixels;
    return getClosestPointOnLines(thisPx, routePixels);
  };

  getDistToLine = function(iLine, fTo) {
    const routeOverlay = this._oPolyline;
    let d = 0;
    for (let n = 1; n < iLine; n++) {
      d += routeOverlay
        .getPath()
        .getAt(n - 1)
        .distanceFrom(routeOverlay.getPath().getAt(n));
    }
    d +=
      routeOverlay
        .getPath()
        .getAt(iLine - 1)
        .distanceFrom(routeOverlay.getPath().getAt(iLine)) * fTo;

    return d;
  };
}

export { cSnapToRoute };

function getClosestPointOnLines(pXy, aXys) {
  let minDist;
  let fTo;
  let fFrom;
  let x;
  let y;
  let i;
  let dist;

  if (aXys.length > 1) {
    for (let n = 1; n < aXys.length; n++) {
      if (aXys[n].x !== aXys[n - 1].x) {
        const a = (aXys[n].y - aXys[n - 1].y) / (aXys[n].x - aXys[n - 1].x);
        const b = aXys[n].y - a * aXys[n].x;
        dist = Math.abs(a * pXy.x + b - pXy.y) / Math.sqrt(a * a + 1);
      } else {
        dist = Math.abs(pXy.x - aXys[n].x);
      }

      // length^2 of line segment
      const rl2 =
        Math.pow(aXys[n].y - aXys[n - 1].y, 2) +
        Math.pow(aXys[n].x - aXys[n - 1].x, 2);

      // distance^2 of pt to end line segment
      const ln2 =
        Math.pow(aXys[n].y - pXy.y, 2) + Math.pow(aXys[n].x - pXy.x, 2);

      // distance^2 of pt to begin line segment
      const lnm12 =
        Math.pow(aXys[n - 1].y - pXy.y, 2) + Math.pow(aXys[n - 1].x - pXy.x, 2);

      // minimum distance^2 of pt to infinite line
      const dist2 = Math.pow(dist, 2);

      // calculated length^2 of line segment
      const calcrl2 = ln2 - dist2 + lnm12 - dist2;

      // redefine minimum distance to line segment (not infinite line) if necessary
      if (calcrl2 > rl2) {
        dist = Math.sqrt(Math.min(ln2, lnm12));
      }

      if (minDist == null || minDist > dist) {
        if (calcrl2 > rl2) {
          if (lnm12 < ln2) {
            fTo = 0; // nearer to previous point
            fFrom = 1;
          } else {
            fFrom = 0; // nearer to current point
            fTo = 1;
          }
        } else {
          // perpendicular from point intersects line segment
          fTo = Math.sqrt(lnm12 - dist2) / Math.sqrt(rl2);
          fFrom = Math.sqrt(ln2 - dist2) / Math.sqrt(rl2);
        }
        minDist = dist;
        i = n;
      }
    }

    const dx = aXys[i - 1].x - aXys[i].x;
    const dy = aXys[i - 1].y - aXys[i].y;

    x = aXys[i - 1].x - dx * fTo;
    y = aXys[i - 1].y - dy * fTo;
  }

  return { x, y, i, fTo, fFrom };
}
