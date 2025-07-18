import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
import random




load_dotenv()
app = Flask(__name__)
CORS(app)

STORMGLASS_API_KEY = os.getenv("STORMGLASS_API_KEY")

def score_zone(data):
    temp = data.get("seaTemperature", {}).get("noaa")
    wind = data.get("windSpeed", {}).get("noaa")
    wave = data.get("waveHeight", {}).get("noaa")
    clouds = data.get("cloudCover", {}).get("noaa")

    score = 0
    reasons = []

    # Sea Temperature (ideal: 24–28°C, acceptable: 22–30°C)
    if temp is not None:
        if 24 <= temp <= 28:
            score += 3
            reasons.append("Ideal sea temp")
        elif 22 <= temp <= 30:
            score += 1
            reasons.append("Acceptable sea temp")
        else:
            reasons.append("Poor sea temp")

    # Wind Speed (m/s to km/h; ideal 5–18 km/h)
    if wind is not None:
        wind_kmh = wind * 3.6
        if 5 <= wind_kmh <= 18:
            score += 2
            reasons.append("Ideal wind")
        elif wind_kmh <= 25:
            score += 1
            reasons.append("Tolerable wind")
        else:
            reasons.append("High wind")

    # Wave Height
    if wave is not None:
        if wave < 1.2:
            score += 2
            reasons.append("Very calm waves")
        elif wave < 2.0:
            score += 1
            reasons.append("Moderate waves")
        else:
            reasons.append("High waves")

    # Cloud Cover
    if clouds is not None:
        if clouds <= 60:
            score += 1
            reasons.append("Good visibility")
        else:
            reasons.append("Cloudy")

    return score, reasons

@app.route("/api/fishing_zones")
def get_fishing_zones():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
        zones = []

        for _ in range(5):  # Reduced from 10 to conserve API calls
            # Generate nearby point
            lat_offset = random.uniform(-0.3, 0.3)  # Smaller offset
            lon_offset = random.uniform(-0.3, 0.3)
            point_lat = round(lat + lat_offset, 4)
            point_lon = round(lon + lon_offset, 4)

            # StormGlass API Call with DEBUGGING
            try:
                params = {
                    "lat": point_lat,
                    "lng": point_lon,
                    "params": "seaTemperature,windSpeed,waveHeight,cloudCover",
                    "source": "noaa",
                    "start": datetime.utcnow().isoformat(),
                    "end": datetime.utcnow().isoformat()
                }
                headers = {"Authorization": os.getenv("STORMGLASS_API_KEY")}
                
                print(f"Requesting StormGlass for: {point_lat},{point_lon}")  # Debug log
                
                response = requests.get(
                    "https://api.stormglass.io/v2/weather/point",
                    params=params,
                    headers=headers
                )
                response.raise_for_status()  # Raises HTTPError for bad responses
                data = response.json()

                if not data.get('hours'):
                    raise ValueError("Empty data from StormGlass")

                weather = data['hours'][0]
                print("Received data:", weather)  # Debug log

            except Exception as api_err:
                print(f"API Error: {api_err}")
                weather = {
                    "seaTemperature": {"noaa": round(random.uniform(22, 30), 1)},
                    "windSpeed": {"noaa": round(random.uniform(3, 20), 1)},
                    "waveHeight": {"noaa": round(random.uniform(0.5, 3.0), 1)},
                    "cloudCover": {"noaa": random.randint(0, 100)}
                }

            # Score calculation (unchanged)
            score, reasons = score_zone(weather)

            zones.append({
                "lat": point_lat,
                "lon": point_lon,
                "score": score,
                "reasons": reasons,
                "seaTemperature": weather.get("seaTemperature", {}).get("noaa"),
                "windSpeed": weather.get("windSpeed", {}).get("noaa"),
                "waveHeight": weather.get("waveHeight", {}).get("noaa"),
                "cloudCover": weather.get("cloudCover", {}).get("noaa")
            })

        return jsonify(zones)

    except Exception as e:
        print(f"Endpoint error: {e}")
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True)
