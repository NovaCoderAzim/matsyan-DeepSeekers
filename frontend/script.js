// Initialize Map
const map = L.map('map').setView([10.2, 79.3], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// State Management
let currentZones = [];
let currentMarkers = [];
let userLocation = null;
let selectedZone = null;
let navRoute = null;
let userMarker = null;

// DOM Elements
const loader = document.getElementById('loader');
const zoneDetails = document.getElementById('zone-details');
const setLocationBtn = document.getElementById('set-location-btn');
const gpsBtn = document.getElementById('gps-btn');
const navControls = document.getElementById('nav-controls');
const confirmNavBtn = document.getElementById('confirm-nav');
const cancelNavBtn = document.getElementById('cancel-nav');

// Add Legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.innerHTML = `
    <div class="legend-title">Zone Quality</div>
    <div class="legend-item">
      <span class="legend-color color-excellent"></span>
      Excellent (8-10)
    </div>
    <div class="legend-item">
      <span class="legend-color color-decent"></span>
      Decent (5-7)
    </div>
    <div class="legend-item">
      <span class="legend-color color-poor"></span>
      Poor (&lt;5)
    </div>
  `;
  return div;
};
legend.addTo(map);

// LOCATION SETUP ==============================================
let isSettingLocation = false;

setLocationBtn.addEventListener('click', () => {
  isSettingLocation = true;
  alert("Please click on the map to set your location");
});

gpsBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        alert("Location set! Now click on the sea to find fishing zones");
      },
      (err) => {
        alert("Please enable location permissions in your browser settings");
        console.error("GPS Error:", err);
      },
      { enableHighAccuracy: true }
    );
  } else {
    alert("Geolocation not supported by your browser");
  }
});

function setUserLocation(coords) {
  userLocation = coords;
  isSettingLocation = false;

  if (userMarker) map.removeLayer(userMarker);

  userMarker = L.marker(userLocation, {
    icon: L.divIcon({
      className: 'user-location-pin',
      html: '<i class="fas fa-ship"></i>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }).addTo(map).bindPopup("Your Location").openPopup();

  map.setView(userLocation, 10);
}

// ZONE ANALYSIS ==============================================
map.on('click', async function (e) {
  if (isSettingLocation) {
    setUserLocation([e.latlng.lat, e.latlng.lng]);
    return;
  }

  if (e.originalEvent.target.classList.contains('leaflet-interactive')) return;

  if (!userLocation) {
    alert("Please set your location first using the GPS or map marker button");
    return;
  }

  clearExistingMarkers();
  hideNavControls();
  clearRouteInfo();
  loader.style.display = 'flex';

  try {
    const response = await fetch(`http://127.0.0.1:5000/api/fishing_zones?lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
    if (!response.ok) throw new Error('API request failed');

    const zones = await response.json();
    currentZones = processZoneData(zones);
    renderZones(currentZones);

  } catch (err) {
    console.error("Error:", err);
    showErrorState();
  } finally {
    loader.style.display = 'none';
  }
});

// NAVIGATION ==============================================
confirmNavBtn.addEventListener('click', () => {
  if (userLocation && selectedZone) {
    drawNavigationRoute();
    hideNavControls();
  }
});

cancelNavBtn.addEventListener('click', hideNavControls);

function drawNavigationRoute() {
  if (navRoute) map.removeLayer(navRoute);

  const zoneCoords = [selectedZone.lat, selectedZone.lon];
  navRoute = L.polyline([userLocation, zoneCoords], {
    color: '#3b82f6',
    dashArray: '5, 5',
    weight: 3
  }).addTo(map);

  map.fitBounds([userLocation, zoneCoords]);

  const routeInfo = calculateRouteInfo(userLocation, zoneCoords);
  displayRouteInfo(routeInfo);
}

function calculateRouteInfo(from, to, speedKnots = 10) {
  const toRad = deg => deg * Math.PI / 180;
  const toDeg = rad => rad * 180 / Math.PI;

  const [lat1, lon1] = from;
  const [lat2, lon2] = to;

  const R = 6371;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceKm = R * c;
  const distanceNm = distanceKm * 0.539957;
  const timeHrs = distanceNm / speedKnots;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

  return {
    distance_km: distanceKm.toFixed(1),
    distance_nm: distanceNm.toFixed(2),
    time_hrs: timeHrs.toFixed(2),
    bearing_deg: bearing.toFixed(1)
  };
}

function displayRouteInfo(info) {
  const html = `
    <div class="route-info">
      <h4>📍 Route Info</h4>
      <p>📏 <strong>Distance:</strong> ${info.distance_km} km <small>(${info.distance_nm} NM)</small></p>
      <p>⏱️ <strong>ETA:</strong> ${info.time_hrs} hours <small>(@ 10 knots)</small></p>
      <p>🧭 <strong>Bearing:</strong> ${info.bearing_deg}°</p>
    </div>
  `;
  zoneDetails.insertAdjacentHTML('beforeend', html);
}


function clearRouteInfo() {
  const routeInfo = document.querySelector('.route-info');
  if (routeInfo) routeInfo.remove();
}

// HELPERS ==============================================
function renderZones(zones) {
  let bestZone = null;

  zones.forEach(zone => {
    const marker = L.circle([zone.lat, zone.lon], {
      radius: 5000,
      fillColor: zone.color,
      color: '#1f2937',
      weight: 1,
      fillOpacity: 0.7
    }).addTo(map);

    marker.on('click', function (e) {
      e.originalEvent.stopPropagation();
      selectedZone = zone;
      updateZoneDetails(zone);
      clearRouteInfo();

      const point = map.latLngToContainerPoint(e.latlng);
      navControls.style.top = `${point.y}px`;
      navControls.style.left = `${point.x}px`;
      navControls.style.display = 'flex';
    });

    currentMarkers.push(marker);
    if (!bestZone || zone.score > bestZone.score) bestZone = zone;
  });

  if (bestZone) {
    map.flyTo([bestZone.lat, bestZone.lon], 10);
    updateZoneDetails(bestZone);
  }
}

function clearExistingMarkers() {
  currentMarkers.forEach(marker => map.removeLayer(marker));
  currentMarkers = [];
}

function hideNavControls() {
  navControls.style.display = 'none';
}

function processZoneData(zones) {
  return zones.map(zone => ({
    ...zone,
    ...getZoneProperties(zone),
    weather: {
      temp: zone.seaTemperature ? `${zone.seaTemperature.toFixed(1)}°C` : 'N/A',
      wind: zone.windSpeed ? `${(zone.windSpeed * 3.6).toFixed(1)} km/h` : 'N/A',
      waves: zone.waveHeight ? `${zone.waveHeight.toFixed(1)} m` : 'N/A',
      clouds: zone.cloudCover ? `${zone.cloudCover}%` : 'N/A'
    }
  }));
}

function getZoneProperties(zone) {
  if (zone.score >= 8) {
    return {
      color: '#10b981',
      status: 'excellent',
      icon: 'fa-solid fa-fish'
    };
  } else if (zone.score >= 5) {
    return {
      color: '#f59e0b',
      status: 'decent',
      icon: 'fa-solid fa-fish'
    };
  } else {
    return {
      color: '#ef4444',
      status: 'poor',
      icon: 'fa-solid fa-triangle-exclamation'
    };
  }
}

function updateZoneDetails(zone) {
  const formatValue = (val) => typeof val === 'number' ? val.toFixed(1) : (val || 'N/A');

  zoneDetails.innerHTML = `
    <div class="zone-card">
      <div class="zone-header">
        <i class="${zone.icon}"></i>
        <div class="zone-rating rating-${zone.status}">
          ${zone.status.toUpperCase()}
        </div>
      </div>
      <div class="zone-score">Score: ${zone.score}/10</div>
      <div class="zone-reasons">
        <h4>Analysis:</h4>
        <ul>${zone.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
      <div class="weather-details">
        <h4>Weather Conditions:</h4>
        <div class="weather-row">
          <span class="weather-label">Sea Temperature:</span>
          <span class="weather-value">${formatValue(zone.seaTemperature)}°C</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Wind Speed:</span>
          <span class="weather-value">${formatValue(zone.windSpeed)} km/h</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Wave Height:</span>
          <span class="weather-value">${formatValue(zone.waveHeight)} m</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Cloud Cover:</span>
          <span class="weather-value">${formatValue(zone.cloudCover)}%</span>
        </div>
      </div>
    </div>
  `;
}

function showErrorState() {
  zoneDetails.innerHTML = `
    <div class="zone-card">
      <div class="zone-header">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="zone-rating rating-poor">Error</div>
      </div>
      <p>Failed to load zone data. Please try again.</p>
    </div>
  `;
}
