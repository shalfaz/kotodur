
# KotoDur (কতদূর) — Dynamic Bus Headway & Bunching Control Simulator

**KotoDur** is an interactive, real-time traffic engineering and control system simulation engine designed to visualize and solve the **Bus Bunching** phenomenon on congested urban transit corridors—modeled specifically after Dhaka's busy **Mirpur-10 ⇄ Motijheel** route.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-06B6D4?style=for-the-badge&logo=vercel)](https://kotodur.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15%2F16-0F172A?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🎯 The Real-World Problem: Bus Bunching

Anyone commuting in Dhaka has experienced waiting 30 minutes for a bus, only for three or four buses on the exact same route to arrive bumper-to-bumper at once. 

In traffic engineering, **Bus Bunching** is a classic positive-feedback instability:
1. A lead bus encounters a minor delay (e.g., traffic signal or bottleneck at Farmgate).
2. Because it is late, more passengers accumulate at downstream stops.
3. Higher passenger volume increases boarding dwell time, slowing the lead bus down further.
4. Meanwhile, the trailing bus encounters empty stops, boards fewer passengers, and speeds up—eventually catching up to the lead bus and destroying schedule regularity.

---

## 🧠 The Engineering Solution: Dynamic Headway Equalization

Rather than telling drivers to simply "drive faster," **KotoDur** implements a closed-loop **Micro-Holding Control Algorithm** that equalizes forward and backward headways ($H_{\text{front}}$ and $H_{\text{back}}$) at stops:

$$\text{Hold Time} = \alpha \times \left(\frac{H_{\text{front}} + H_{\text{back}}}{2} - H_{\text{front}}\right)$$

* **$H_{\text{front}}$ (Forward Headway):** Time/distance gap to the preceding bus.
* **$H_{\text{back}}$ (Backward Headway):** Time/distance gap to the following bus.
* **$\alpha$ (Control Aggressiveness):** Tunable damping factor ($0.30$ to $1.00$) controlling how strictly the system enforces spacing.

When a bus finishes boarding and is too close to the bus ahead ($H_{\text{front}} < H_{\text{back}}$), the system instructs the driver via the **Driver HUD** to hold at the stop for a calculated number of seconds—allowing the lead bus to pull away while absorbing passengers for the trailing bus.

---

## ✨ Key Features

* **60fps Time-Step Physics Engine (`dt`):** Custom HTML5 Canvas simulation loop modeling stochastic passenger arrivals (Poisson-like distribution), boarding dwell times, safe following distances, and a **Farmgate–Shahbag Traffic Bottleneck Zone (-60% speed)**.
* **Uncontrolled vs. AI Control Mode:** Instant toggle comparing chaotic uncoordinated operations against real-time headway equalization.
* **Dhaka Scenario Presets:** One-click simulation profiles for **Office Rush (9 AM)**, **Rainy Dhaka**, and **Midnight Free Flow**.
* **Chaos Disruption Injector:** Manually stall any active bus for 8 seconds (`Inject Traffic Jam`) to trigger a bunching chain reaction and observe how the control algorithm self-heals the corridor.
* **Real-Time Engineering Telemetry:**
  * **Headway Variance ($\sigma^2$) Chart:** Tracks spacing instability over a rolling 60-second window.
  * **Time-Space Trajectory Diagram:** Plots vehicle trajectories across stops over time—visually demonstrating overlapping paths converging into parallel trajectories under AI control.
  * **AI Impact Benchmark:** Live A/B comparison measuring reductions in Average Passenger Wait Time and Bunched Pairs.
* **Live Driver HUD Preview:** Interactive mobile cab interface simulating what individual Dhaka bus operators (*Bikolpo*, *Shikhor*, *BRTC*) see in real time (`PROCEED` vs. `HOLD AT STOP` countdown).
* **Adaptive Day & Dark Modes:** High-contrast Light Mode default with full Dark Mode engineering theme support.

---

## 🏗️ Real-World Deployment Architecture

While **KotoDur** runs as a client-side simulation engine for interactive experimentation, the underlying control logic maps directly to a lightweight production transit architecture:
1. **Driver Mobile Client:** Bus operators run a lightweight GPS telemetry app transmitting vehicle ID and coordinates every 3 seconds.
2. **Central Headway Engine:** A backend state processor computes real-time $H_{\text{front}}$ and $H_{\text{back}}$ along the corridor.
3. **Actionable Cab Signals:** Instead of complex schedules, drivers receive simple **Green (`PROCEED`)** or **Amber (`HOLD 15s`)** cues at stops—eliminating dangerous street racing and maximizing fleet passenger distribution.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router) & React
* **Language:** TypeScript
* **Graphics & Visualization:** HTML5 Canvas API (2D Vector Rendering) & Custom SVG Telemetry Charts
* **Styling:** Tailwind CSS & Lucide Icons

---

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/shohanalfaz/kotodur.git](https://github.com/shohanalfaz/kotodur.git)
   cd kotodur

