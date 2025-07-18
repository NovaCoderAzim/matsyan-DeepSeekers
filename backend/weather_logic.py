def score_zone(data, lat, lon):
    score = 0
    reasons = []

    temp = data.get("seaTemperature", {}).get("noaa")
    wind = data.get("windSpeed", {}).get("noaa")
    wave = data.get("waveHeight", {}).get("noaa")
    cloud = data.get("cloudCover", {}).get("noaa")

    # Temperature scoring
    if temp is not None:
        if 24 <= temp <= 28:
            score += 3
            reasons.append("Ideal sea temperature (+3)")
        elif 22 <= temp <= 30:
            score += 2
            reasons.append("Acceptable sea temperature (+2)")
        else:
            reasons.append("Unfavorable temperature")

    # Wind speed scoring
    if wind is not None:
        if 5 <= wind <= 15:
            score += 2
            reasons.append("Ideal wind speed (+2)")
        else:
            reasons.append("Unfavorable wind speed")

    # Wave height scoring
    if wave is not None:
        if wave < 1.5:
            score += 2
            reasons.append("Calm wave height (+2)")
        else:
            reasons.append("High waves")

    # Cloud cover scoring (weather condition)
    if cloud is not None:
        if cloud <= 50:
            score += 1
            reasons.append("Favorable sky conditions (+1)")
        else:
            reasons.append("Cloudy skies")

    # Assume always near coast since we're generating nearby zones
    score += 1
    reasons.append("Assumed near coast (+1)")

    return score, reasons
