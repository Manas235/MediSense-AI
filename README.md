# MediSense AI – Smart Health Monitoring System

## Overview

MediSense AI is a smart health monitoring system that tracks vital parameters in real time and analyzes them using personalized baseline, deviation, and trend-based logic. The system focuses on detecting abnormal health patterns early and providing intelligent alerts for timely intervention.

---

## Key Idea

Most health monitoring systems rely on fixed thresholds, which are not personalized.

MediSense AI improves this by:

* Learning the user’s baseline (normal pattern)
* Detecting deviation from the baseline
* Analyzing trends over time

This approach reduces false alerts and improves accuracy.

---

## Features

* Real-time monitoring of:

  * Heart Rate (BPM)
  * SpO₂ (Oxygen Level)
  * Body Temperature
* Personalized baseline calculation (moving average)
* Deviation-based anomaly detection
* Trend analysis (Increasing / Stable / Decreasing)
* Activity-aware logic (Resting vs Active)
* Health status classification:

  * Normal
  * Warning
  * Critical
* Emergency contact system (user input and storage)
* Alert triggering during critical conditions

---

## Core Logic

### Baseline

Average of recent values (sliding window)

Baseline = Average(last N readings)

### Deviation

Deviation = Current Value – Baseline

### Trend

Detected using recent data patterns:

* Increasing → rising values
* Decreasing → falling values
* Stable → minimal variation

The system combines baseline, deviation, and trend for decision making.

---

## How It Works

1. Simulates real-time health data
2. Stores recent values
3. Calculates baseline dynamically
4. Computes deviation
5. Detects trend
6. Classifies condition (Normal / Warning / Critical)
7. Triggers alerts and emergency response


## Simulated Data Approach

The system uses controlled variation and trend-based simulation instead of pure random values. This ensures realistic behavior similar to real physiological data.


## Tech Stack

* HTML
* CSS
* JavaScript
* LocalStorage


## Getting Started

Clone the repository:
git clone https://github.com/Manas235/MediSense-AI.git

Open the project folder and run:
Open index.html in your browser


## Demo Flow

* Stable values → Normal
* Increasing trend → Warning
* High deviation → Critical


## Limitations

* Uses simulated data
* No real sensor integration
* Not a medical diagnostic tool


## Future Scope

* Integration with wearable devices
* Real-time APIs
* Machine learning-based prediction
* Mobile application development


## Author

Manas
