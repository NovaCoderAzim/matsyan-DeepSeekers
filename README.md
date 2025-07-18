# 🎣 DeepSeek – Fishing Route Optimizer

**Team Name:** Matsyan – DeepSeekers  
**Event:** Agentic Hackathon 2025  
**Category:** Marine Navigation + AI Optimization

---

## 🧠 Problem Statement

Traditional fishing is becoming increasingly inefficient and unsustainable. Fishermen often rely on guesswork or outdated methods to decide where to cast their nets, leading to fuel wastage, lower catch rates, and ecological strain.

### ❗ The Challenge
> *"How might we help small- to mid-scale fishermen discover the most optimal fishing zones in real-time using modern weather data, marine APIs, and simple tech tools?"*

---

## 💡 Solution – What is DeepSeek?

**DeepSeek** is a lightweight, web-based **Fishing Route Optimizer** that helps fishermen:
- 🌊 Visualize their current location on a map
- 📍 Get AI-suggested fishing zones around them
- ⚡ View zone scores based on real-time weather and marine conditions
- 🧭 Navigate toward the best zones for increased fishing success

The app works on phones or desktops, with a clean, step-by-step interface — no app download required!

---

## ⚙️ Tech Stack Used

| Layer         | Tools / Libraries                                   |
|---------------|-----------------------------------------------------|
| Frontend      | HTML, CSS, JavaScript, Leaflet.js                   |
| Backend       | Python (Flask)                                      |
| Marine Data   | Storm Glass API, OpenWeatherMap API                 |
| Deployment    | GitHub Pages (Frontend), Local Flask (Backend)     |
| Other Tools   | Canva (Video), Git, GitHub                          |

---

## 🚀 Installation & Setup Instructions

### 📁 Clone the repo:
```bash
git clone https://github.com/NovaCoderAzim/matsyan-DeepSeekers.git
cd matsyan-DeepSeekers


🛠️ Backend Setup (Flask)
Navigate to the backend:

cd backend
Create a virtual environment:


python -m venv venv
venv\Scripts\activate    # Windows
Install dependencies:


pip install -r ../requirements.txt
Add your Storm Glass and OpenWeatherMap API keys in a .env file:


STORMGLASS_API_KEY=your_key_here
OPENWEATHER_API_KEY=your_key_here
Run the Flask server:

bash

python app.py


 Frontend Setup
Open frontend/index.html in your browser OR

Use Live Server in VS Code

🧭 How to Use the App
Open the app (frontend).

Click on the map to set your location.

Wait for surrounding zones to load.

View color-coded suggestions:

🟢 Green = Best zones (Score ≥ 8)

🟡 Yellow = Moderate

🔴 Red = Avoid

Hover to view weather details.


📸 Screenshots
Map View with Suggestions	        Zone Tooltip Details

<img width="1905" height="1012" alt="image" src="https://github.com/user-attachments/assets/a43a8749-4360-43d3-a919-c48deaaa9439" />

<img width="1897" height="1020" alt="image" src="https://github.com/user-attachments/assets/b28a60b9-c36f-4c21-a4de-1928b9b9de39" />

YouTube Demo Video
👉 Watch: DeepSeek – Fishing Route Optimizer Demo
(Upload your 2–5 min demo to YouTube and replace this link.)


👥 Team Members
Name	
MOHAMMED AZIM J BE CSE
MOHNISH NIRANJAN S BE CSE
MEHNAZ TAZMEEN SYED BE CSE
AKASH ANDAKUDI ARUN BE Mechatronics

📌 Folder Structure
bash
Copy
Edit
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── weather_logic.py
│   └── .env
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── screenshots/
│   └── (map.png, tooltip.png)
├── requirements.txt
├── README.md


🤝 Contributions
This project was built under the time constraints of the Agentic Hackathon 2025. Contributions or forks are welcome post-event.


License
This project is open-source and available under the MIT License.

yaml
Copy
Edit

---

### ✅ Next Steps
- Replace placeholders like:
  - YouTube video link
  - Screenshots folder content
  - Additional team members (if any)
- Once complete, commit and push:
```bash
git add README.md
git commit -m "Add complete README with hackathon details"
git push
