// Initialize Map
const map = L.map('map').setView([10.2, 79.3], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// State Management
let allZones = [];          // Stores all generated zones
let currentZoneGroup = [];  // Stores zones from most recent click
let zoneGroups = [];        // Tracks zone groups separately
let currentMarkers = [];    // All markers currently on map
let userLocation = null;
let selectedZone = null;
let navRoute = null;
let userMarker = null;
let isSettingLocation = false;
let hasShownLocationAlert = false;

// Color schemes for different zone groups
const GROUP_COLORS = [
  { excellent: '#10b981', decent: '#f59e0b', poor: '#ef4444' },  // Green group
  { excellent: '#0ee957ff', decent: '#f69a45ff', poor: '#fb3545ff' },  // Blue group
  { excellent: '#14b8a6', decent: '#f97316', poor: '#f72525ff' }   // Teal group
];

// DOM Elements
const loader = document.getElementById('loader');
const zoneDetails = document.getElementById('zone-details');
const setLocationBtn = document.getElementById('set-location-btn');
const gpsBtn = document.getElementById('gps-btn');
const navControls = document.getElementById('nav-controls');
const confirmNavBtn = document.getElementById('confirm-nav');
const cancelNavBtn = document.getElementById('cancel-nav');
const clearZonesBtn = document.getElementById('clear-zones-btn');
const toggleZonesBtn = document.getElementById('toggle-zones-btn');

// Add Legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function() {
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
function handleSetLocation() {
  isSettingLocation = true;
  hasShownLocationAlert = false;
  if (!hasShownLocationAlert) {
    alert("Please click on the map to set your location");
    hasShownLocationAlert = true;
  }
}

function handleGPSLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        if (!hasShownLocationAlert) {
          alert("Location set! Now click on the sea to find fishing zones");
          hasShownLocationAlert = true;
        }
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
}

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
map.on('click', async function(e) {
  if (isSettingLocation) {
    setUserLocation([e.latlng.lat, e.latlng.lng]);
    return;
  }

  if (e.originalEvent.target.classList.contains('leaflet-interactive')) return;

  if (!userLocation) {
    if (!hasShownLocationAlert) {
      alert("Please set your location first using the GPS or map marker button");
      hasShownLocationAlert = true;
    }
    return;
  }

  hideNavControls();
  clearRouteInfo();
  loader.style.display = 'flex';

  try {
    const response = await fetch(`http://127.0.0.1:5000/api/fishing_zones?lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
    if (!response.ok) throw new Error('API request failed');

    const zones = await response.json();
    const processedZones = processZoneData(zones);
    
    // Store new zones
    currentZoneGroup = processedZones;
    allZones = [...allZones, ...processedZones];
    zoneGroups.push(processedZones);
    
    // Render all zones (new and existing)
    renderAllZones();

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
  displayRouteInfo(routeInfo, selectedZone);
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
    bearing_deg: bearing.toFixed(1),
    speed_knots: speedKnots
  };
}

function displayRouteInfo(info, zone) {
  const suggestion = generateRouteSuggestion(info, zone);
  
  const html = `
    <div class="route-info">
      <div class="route-header">
        <i class="fas fa-route"></i>
        <h4>Navigation Guide</h4>
      </div>
      
      <div class="route-suggestion animated-3d">
        <div class="compass-icon">
          <i class="fas fa-compass spinning"></i>
          <span class="bearing">${info.bearing_deg}°</span>
        </div>
        <p class="suggestion-text">${suggestion}</p>
      </div>
      
      <div class="route-stats">
        <div class="stat-card">
          <i class="fas fa-ruler-combined"></i>
          <div>
            <span class="stat-value">${info.distance_km} km</span>
            <span class="stat-label">Distance</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-clock"></i>
          <div>
            <span class="stat-value">${info.time_hrs} hrs</span>
            <span class="stat-label">ETA @ ${info.speed_knots}kt</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-anchor"></i>
          <div>
            <span class="stat-value">${zone.score}/10</span>
            <span class="stat-label">Zone Score</span>
          </div>
        </div>
      </div>
      
      <div class="weather-tip">
        <i class="fas fa-lightbulb"></i>
        <p>${generateWeatherTip(zone)}</p>
      </div>
    </div>
  `;
  
  zoneDetails.insertAdjacentHTML('beforeend', html);
  
  // Add animation to the suggestion
  const suggestionElement = document.querySelector('.route-suggestion');
  if (suggestionElement) {
    suggestionElement.style.animation = 'floatUp 1.5s ease-out';
  }
}

function generateRouteSuggestion(routeInfo, zone) {
  const distance = parseFloat(routeInfo.distance_km);
  const time = parseFloat(routeInfo.time_hrs);
  const bearing = parseFloat(routeInfo.bearing_deg);
  const direction = getDirectionFromBearing(bearing);
  const roundedScore = Math.round(zone.score);

  // Distance-based categories
  const distanceCategory = 
    distance < 3 ? 'very_near' :
    distance < 8 ? 'near' :
    distance < 15 ? 'medium' :
    distance < 30 ? 'far' : 'very_far';

  // Different advice for each distance category
  const distanceAdvice = {
    very_near: [
      "Just a short hop away - perfect for quick fishing trips",
      "Within sight of your location - easy navigation",
      "Close enough for multiple trips today",
      "Ideal for testing new spots quickly"
    ],
    near: [
      "A comfortable distance for half-day fishing",
      "Good range for exploring nearby productive waters",
      "Close enough to return quickly if conditions change",
      "Excellent distance for morning or evening trips"
    ],
    medium: [
      "A solid fishing expedition distance",
      "Far enough for serious fishing, close enough for day trips",
      "Good range to reach productive offshore grounds",
      "Prepare for a full day of fishing"
    ],
    far: [
      "A substantial journey - plan accordingly",
      "Distant fishing grounds that may require extra preparation",
      "Far enough that weather changes become more important",
      "Consider overnight provisions for this distance"
    ],
    very_far: [
      "Long-range fishing expedition - ensure full preparation",
      "Distant waters that may hold bigger fish but require caution",
      "Only attempt with proper vessel and equipment",
      "Extreme range fishing - monitor fuel carefully"
    ]
  };

  // Fishing quality advice
  const scoreAdvice = {
    10: "Exceptional fishing! Fish are extremely active and feeding aggressively",
    9: "Excellent conditions with active fish throughout the water column",
    8: "Great fishing - fish are responding well to most techniques",
    7: "Good activity - focus on structure and current edges",
    6: "Moderate fishing - may need to work different depths",
    5: "Fair conditions - fish may be selective in their feeding",
    4: "Slow fishing - try scent-enhanced baits and precise presentations",
    3: "Difficult conditions - fish deep and be patient",
    2: "Very tough fishing - consider moving to another location",
    1: "Extremely poor conditions - not recommended for fishing"
  };

  // Weather-specific advice
  const weatherAdvice = [];
  if (zone.windSpeed > 15) weatherAdvice.push("Strong winds expected - secure loose items");
  if (zone.waveHeight > 1.5) weatherAdvice.push("Choppy seas predicted - use caution");
  if (zone.cloudCover > 70) weatherAdvice.push("Overcast conditions may affect light-sensitive species");
  if (zone.seaTemperature < 24 || zone.seaTemperature > 30) {
    weatherAdvice.push("Water temperature may affect fish activity patterns");
  }

  // Randomly select from appropriate advice arrays
  const randomDistanceTip = distanceAdvice[distanceCategory][
    Math.floor(Math.random() * distanceAdvice[distanceCategory].length)
  ];
  
  // Build the complete suggestion
  let suggestion = `${randomDistanceTip}. ${scoreAdvice[roundedScore]}. `;
  
  if (weatherAdvice.length > 0) {
    suggestion += weatherAdvice.join('. ') + '. ';
  }

  if (time > 2) {
    suggestion += "Bring extra provisions and fuel. ";
  } else if (time > 1) {
    suggestion += "Pack water and snacks. ";
  }

  suggestion += `Navigate ${direction} (${bearing.toFixed(1)}°) for best route.`;

  return suggestion;
}

function getRegionFromCoordinates(lat, lng) {
  // More precise regional boundaries
  const regions = {
    'north_coast': [9.0, 10.5, 79.5, 82.0],  // Jaffna to Mullaitivu
    'south_coast': [5.5, 8.0, 79.5, 82.0],   // Galle to Hambantota
    'east_coast': [7.5, 9.5, 81.0, 83.0],    // Trincomalee to Batticaloa
    'west_coast': [6.5, 8.5, 79.0, 80.5],    // Negombo to Kalpitiya
    'central_waters': [7.0, 9.0, 79.5, 81.5] // Between regions
  };

  for (const [region, bounds] of Object.entries(regions)) {
    if (lat >= bounds[0] && lat <= bounds[1] && 
        lng >= bounds[2] && lng <= bounds[3]) {
      return region;
    }
  }
  return 'general';
}

function generateWeatherTip(zone) {
  const wind = zone.windSpeed || 0;
  const waves = zone.waveHeight || 0;
  
  if (wind > 15 || waves > 2) {
    return "Caution: Higher winds/waves expected. Consider waiting for calmer conditions if possible.";
  } else if (wind > 10 || waves > 1.5) {
    return "Moderate conditions - ensure your gear is secured properly.";
  } else {
    return "Ideal conditions for fishing - smooth seas expected!";
  }
}

function getDirectionFromBearing(bearing) {
  if (bearing >= 337.5 || bearing < 22.5) return 'north';
  if (bearing >= 22.5 && bearing < 67.5) return 'northeast';
  if (bearing >= 67.5 && bearing < 112.5) return 'east';
  if (bearing >= 112.5 && bearing < 157.5) return 'southeast';
  if (bearing >= 157.5 && bearing < 202.5) return 'south';
  if (bearing >= 202.5 && bearing < 247.5) return 'southwest';
  if (bearing >= 247.5 && bearing < 292.5) return 'west';
  return 'northwest';
}

function clearRouteInfo() {
  const routeInfo = document.querySelector('.route-info');
  if (routeInfo) routeInfo.remove();
}

// ZONE RENDERING ==============================================
function renderAllZones() {
  // Clear existing markers but keep them in memory
  currentMarkers.forEach(marker => map.removeLayer(marker));
  currentMarkers = [];
  
  // Render all zone groups with their respective colors
  zoneGroups.forEach((group, groupIndex) => {
    renderZoneGroup(group, groupIndex);
  });
  
  // Auto-zoom to best zone in the most recent group
  if (currentZoneGroup.length > 0) {
    const bestZone = currentZoneGroup.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    map.flyTo([bestZone.lat, bestZone.lon], 10);
    updateZoneDetails(bestZone);
  }
}

function renderZoneGroup(zones, groupIndex) {
  const colors = GROUP_COLORS[groupIndex % GROUP_COLORS.length];
  
  zones.forEach(zone => {
    const zoneColor = zone.score >= 8 ? colors.excellent :
                     zone.score >= 5 ? colors.decent : colors.poor;

    const marker = L.circle([zone.lat, zone.lon], {
      radius: 5000,
      fillColor: zoneColor,
      color: '#1f2937',
      weight: 1,
      fillOpacity: 0.7,
      pane: `zoneGroup${groupIndex}`
    }).addTo(map);

    marker.on('click', function(e) {
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
  });
}

// ZONE MANAGEMENT ==============================================
function clearAllZones() {
  allZones = [];
  currentZoneGroup = [];
  zoneGroups = [];
  clearExistingMarkers();
}

function toggleZonesVisibility() {
  currentMarkers.forEach(marker => {
    if (map.hasLayer(marker)) {
      map.removeLayer(marker);
    } else {
      marker.addTo(map);
    }
  });
}

function clearExistingMarkers() {
  currentMarkers.forEach(marker => map.removeLayer(marker));
  currentMarkers = [];
}

function hideNavControls() {
  navControls.style.display = 'none';
}

// ZONE PROCESSING ==============================================
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

// UI UPDATES ==============================================
function updateZoneDetails(zone) {
  const formatValue = (val) => typeof val === 'number' ? val.toFixed(1) : (val || 'N/A');
  
  let scoreColor;
  if (zone.score >= 8) scoreColor = '#10b981';
  else if (zone.score >= 5) scoreColor = '#f59e0b';
  else scoreColor = '#ef4444';

  zoneDetails.innerHTML = `
    <div class="zone-card">
      <div class="zone-header">
        <i class="${zone.icon}" style="color: ${scoreColor}; font-size: 1.5rem;"></i>
        <div class="zone-rating rating-${zone.status}">
          ${zone.status.toUpperCase()}
        </div>
      </div>
      
      <div class="zone-score" style="color: ${scoreColor}">
        Score: ${zone.score}/10
      </div>
      
      <div class="zone-reasons">
        <h4>Analysis:</h4>
        <ul>${zone.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
      
      <div class="weather-details">
        <div class="weather-card">
          <div class="weather-label">Sea Temperature</div>
          <div class="weather-value">${formatValue(zone.seaTemperature)}°C</div>
        </div>
        <div class="weather-card">
          <div class="weather-label">Wind Speed</div>
          <div class="weather-value">${formatValue(zone.windSpeed)} km/h</div>
        </div>
        <div class="weather-card">
          <div class="weather-label">Wave Height</div>
          <div class="weather-value">${formatValue(zone.waveHeight)} m</div>
        </div>
        <div class="weather-card">
          <div class="weather-label">Cloud Cover</div>
          <div class="weather-value">${formatValue(zone.cloudCover)}%</div>
        </div>
      </div>
    </div>
  `;
  
  const routeInfo = document.querySelector('.route-info');
  if (routeInfo) {
    zoneDetails.appendChild(routeInfo);
  }
  
  updateZoneGroupLegend();
}

function updateZoneGroupLegend() {
  const legendContainer = document.createElement('div');
  legendContainer.className = 'zone-group-legend';
  
  zoneGroups.forEach((group, i) => {
    const colors = GROUP_COLORS[i % GROUP_COLORS.length];
    legendContainer.innerHTML += `
      <div class="zone-group-label">
        <span style="color:${colors.excellent}">■</span>
        <span>Zone Group ${i+1}</span>
      </div>
    `;
  });
  
  // Remove existing legend if present
  const existingLegend = document.querySelector('.zone-group-legend');
  if (existingLegend) existingLegend.remove();
  
  zoneDetails.appendChild(legendContainer);
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



function updateZoneDetails(zone) {
  const formatValue = (val) => typeof val === 'number' ? val.toFixed(1) : (val || 'N/A');
  
  let scoreColor;
  if (zone.score >= 8) scoreColor = '#10b981';
  else if (zone.score >= 5) scoreColor = '#f59e0b';
  else scoreColor = '#ef4444';

  zoneDetails.innerHTML = `
    <div class="zone-card">
      <div class="zone-header">
        <i class="${zone.icon}" style="color: ${scoreColor}; font-size: 1.5rem;"></i>
        <div class="zone-rating rating-${zone.status}">
          ${zone.status.toUpperCase()}
        </div>
      </div>
      
      <div class="zone-score" style="color: ${scoreColor}">
        Score: ${zone.score}/10
      </div>
      
      <div class="weather-grid">
        <div class="weather-item">
          <div class="weather-label">Wind Speed</div>
          <div class="weather-value">${formatValue(zone.windSpeed)} km/h</div>
        </div>
        <div class="weather-item">
          <div class="weather-label">Wave Height</div>
          <div class="weather-value">${formatValue(zone.waveHeight)} m</div>
        </div>
        <div class="weather-item">
          <div class="weather-label">Cloud Cover</div>
          <div class="weather-value">${formatValue(zone.cloudCover)}%</div>
        </div>
        <div class="weather-item">
          <div class="weather-label">Sea Temp</div>
          <div class="weather-value">${formatValue(zone.seaTemperature)}°C</div>
        </div>
      </div>
    </div>
  `;
}
// INITIALIZATION ==============================================
document.addEventListener('DOMContentLoaded', () => {
  if (setLocationBtn) setLocationBtn.addEventListener('click', handleSetLocation);
  if (gpsBtn) gpsBtn.addEventListener('click', handleGPSLocation);
  if (clearZonesBtn) clearZonesBtn.addEventListener('click', clearAllZones);
  if (toggleZonesBtn) toggleZonesBtn.addEventListener('click', toggleZonesVisibility);
  
  // Create map panes for each potential zone group
  for (let i = 0; i < GROUP_COLORS.length; i++) {
    map.createPane(`zoneGroup${i}`);
  }
});