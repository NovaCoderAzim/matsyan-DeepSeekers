# 🎣 Fishing Route Optimizer – DeepSeekers

> A smart, rule-based web application that helps coastal and deep-sea fishermen locate optimal fishing zones in real-time — using marine weather data and zone scoring logic.

---

## 🚩 Problem Statement

Fishermen often rely on instinct or outdated information to choose fishing zones. This leads to:

- ❌ Wasted fuel and time
- ❌ Low catch yield due to unsuitable sea conditions
- ❌ Exposure to unsafe weather
- ❌ Lack of real-time guidance or decision-making tools

---

## ✅ Our Solution

Fishing Route Optimizer solves these issues by:
- 📍 Letting the fisherman pick a target area
- 🧠 Analyzing live marine data for 5 surrounding sea zones
- 🔢 Scoring each zone (0–10) based on sea temperature, wind speed, wave height, and cloud cover
- 🟩🟧🟥 Visualizing each zone with color-coded markers (Green = Best)
- 🧭 Providing direct navigation from the fisherman’s current location to the best zone (distance, ETA, direction)
- 🧾 Showing smart fishing advice based on trip distance and conditions

---

## 🌐 Live Preview (Optional)



---

## 🧠 Key Features

- 📍 Click-based location selection on interactive sea map
- ⚙️ Rule-based scoring system (No AI required)
- 🌊 Real-time weather data via StormGlass API
- 🔄 Fallback scoring if API limit is reached (ensures usability)
- 🗺️ Dynamic map visualization using Leaflet.js
- 🚦 Color-coded fishing zones (Red, Orange, Green)
- 🧭 Route guidance with bearing, distance, and ETA
- 🧾 Tooltip with full weather + zone data
- 🖥️ Polished frontend UI with CSS animations and responsiveness

---

## 📊 Zone Scoring Logic

| Parameter         | Ideal Condition     | Score Contribution |
|------------------|---------------------|--------------------|
| Sea Temperature  | 24–28°C             | +3 (ideal), +1 (acceptable) |
| Wind Speed       | 5–18 km/h           | +2 (ideal), +1 (tolerable) |
| Wave Height      | < 1.2 m             | +2 (very calm), +1 (moderate) |
| Cloud Cover      | < 60%               | +1 (good visibility) |
| **Total Score**  |                     | Max = 10 |

---

## 💡 Uniqueness

> “While other tools show data, we give **direction**.”

- ✅ We convert weather into **scored fishing zones**
- ✅ No hardware (sonar/radar) required
- ✅ Lightweight, web-based and offline-friendly
- ✅ Instant route drawing to best zone
- ✅ Works even when API fails (fallback data)

---

## 📦 Tech Stack

| Category       | Technology            |
|----------------|------------------------|
| Frontend       | HTML, CSS, JavaScript  |
| Map            | Leaflet.js             |
| Icons/UI       | Font Awesome, Google Fonts |
| Backend        | Python (Flask)         |
| Weather API    | StormGlass API (live marine data) |
| Fallback API   | OpenWeatherMap (optional) |
| Deployment     | GitHub / Localhost     |

---

## 🧪 How It Works

1. User selects a location in the sea on the map
2. App generates 5 nearby zones
3. Fetches real-time data from StormGlass API
4. Scores each zone using rule-based logic
5. Displays colored markers with popups for score + details
6. Auto-zooms to best zone and shows route from user’s location

---

## 🌍 Fields of Application

- 🧑‍🌾 Coastal fishing communities
- 🛥️ Deep-sea commercial fleets
- 🎣 Fishing tour operators
- 🏛 Fisheries & maritime departments
- 📡 Marine research institutes

---

## 📈 Business Value

- 💰 Save fuel and resources by targeting productive zones
- 🎣 Increase catch efficiency
- ⏱ Reduce scouting time
- 🌊 Improve safety with weather-based planning
- 💻 Digitize decision-making without sonar or GPS tools

---

## 🚧 Known Limitations

- ⚠️ Free API has rate limits (10 calls/day for StormGlass)
- 📡 Data availability may vary in remote zones
- 📱 Mobile UI needs refinement (currently PC-optimized)

---

## 🔮 Future Enhancements (Optional)



- Add catch logging module
- Real-time weather refresh
- Tide/Moon phase integration
- Offline mode with cached zones
- Mobile-first redesign

---

## 🧑‍💻 Local Setup Instructions

```bash
# Clone the repo
git clone https://github.com/NovaCoderAzim/matsyan-DeepSeekers.git

# Navigate to backend
cd backend

# Create .env file and add your StormGlass API key:
# STORMGLASS_API_KEY=your_api_key_here

# Install dependencies
pip install -r requirements.txt

# Run the Flask backend
python app.py

