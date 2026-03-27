# Academic AdvAIsor
**Interactive Visual Analytics for Exploring Student Burnout and Productivity**

**2AMV10 – Visual Analytics**  
**Group 7 – Eindhoven University of Technology**  
**Haneul Choi (1773895)**  
**Sofie van Engelen (2224402)**

---

## Overview

**Academic AdvAIsor** is an interactive visual analytics dashboard designed to support **academic advisors** in understanding and exploring student wellbeing and performance risks.

The system combines:

- **Machine Learning predictions**
- **Explainable AI (LIME)**
- **Counterfactual explanations (DiCE)**
- **Interactive visual analytics techniques**

to help advisors answer questions such as:

- **Why** is this student predicted to struggle?
- **Which factors** are driving this outcome?
- **How does this student compare** to similar students?
- **What realistic changes** could improve their predicted outcome?

Rather than giving generic advice, Academic AdvAIsor helps uncover **personalized behavioural patterns and intervention opportunities** in a transparent, explainable, and interactive way.

---

## Key Features

### Strategy Atlas
An interactive **2D behavioural map** of students using **Parametric UMAP**.  
Students are positioned based on **similarity in how the model reasons about them**, rather than raw feature similarity alone.

Supports exploration across multiple target variables:

- Burnout Level
- Exam Score
- Focus Index
- Mental Health Score
- Productivity Score

### Cluster Analysis
Explore behavioural clusters and compare different student groups to identify shared patterns and risk factors.

### Feature Importance & Local Explanations
Inspect which features are globally important for the model and which factors are driving an individual student's prediction using **LIME**.

### Counterfactual What-If Analysis
Generate actionable “what-if” scenarios that suggest realistic changes a student could make to improve a target outcome.

---

## Why This Project?

Academic advising often relies on broad, one-size-fits-all recommendations. However, students can underperform for very different reasons:

- one student may be **burning out**,
- another may be **struggling with focus**,
- another may be **highly distracted despite effort**.

This project aims to make these differences visible and understandable through an interactive visual analytics workflow.

---

## Tech Stack

### Frontend
- **React**
- **TypeScript**
- **Vite**
- **CSS**

### Backend
- **Python**
- **FastAPI**
- **Scikit-learn**
- **LIME**
- **DiCE**
- **UMAP / Parametric UMAP**

### Data / Model Artifacts
- Precomputed JSON exports
- Saved embedding/model files
- Notebook-based preprocessing and export pipeline

---

## Project Structure

```bash
2AMV10_Project/
├── backend/
│   ├── data/
│   │   └── StrategyAtlas/
│   │       ├── atlas_points.json
│   │       ├── atlas_grid.json
│   │       ├── lime_contributions.json
│   │       └── strategy_umap_model/
│   ├── app.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── App.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── notebooks/
│   └── final version (hopefully).ipynb
│
├── README.md
└── ...
```

> **Note:** Some filenames or folders may differ slightly depending on your local setup.

---

## Installation & Setup

## Prerequisites

Make sure you have the following installed:

- **Python 3.9+**
- **Node.js 18+**
- **npm**

You can check versions with:

```bash
python --version
node --version
npm --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/SofievanEngelen/2AMV10_Project.git
cd 2AMV10_Project
```

---

## 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

### macOS / Linux
```bash
python -m venv .venv
source .venv/bin/activate
```

### Windows
```bash
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
python app.py
```

> The backend should now be running locally (typically on `http://127.0.0.1:8000`).

---

## 3. Frontend Setup

Open a **new terminal**, then navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

> The frontend should now be available locally (typically on `http://localhost:5173`).

---

## Running the Full Application

To run the full system:

1. Start the **backend**
2. Start the **frontend**
3. Open the local frontend URL in your browser

Make sure **both servers are running at the same time**.

---

## Notebook / Precomputed Exports

The Strategy Atlas and explanation files are **precomputed** and loaded from saved artifacts for speed and consistency.

### To regenerate the exports:

Open the notebook:

```bash
jupyter notebook "final version (hopefully).ipynb"
```

Run the notebook and execute the **final export cell**.

This generates the following files:

- `atlas_points.json`
- `atlas_grid.json`
- `lime_contributions.json`
- `strategy_umap_model`

These should be copied into:

```bash
backend/data/StrategyAtlas/
```

---

## Important Note on Reproducibility

The **Strategy Atlas layout is stochastic**, because **Parametric UMAP uses a neural network** whose learned projection can vary between runs.

This means:

- the exact 2D layout may change if you retrain or rerun the notebook,
- exported files must always remain consistent with each other.

### If you regenerate the atlas:
You must regenerate **all** of the following together:

- `atlas_points.json`
- `atlas_grid.json`
- `lime_contributions.json`
- `strategy_umap_model`

Do **not** mix old and new exports.

---

## Example Workflow

A typical advisor workflow in the system is:

1. **Explore the Strategy Atlas** to identify student regions and clusters
2. **Select a student** or subgroup of interest
3. **Inspect feature importance** and local explanations
4. **Compare to similar students**
5. **Generate counterfactual suggestions** for improvement

This supports both **global pattern discovery** and **individual-level reasoning**.

---

## Educational Context

This project was developed for:

**2AMV10 – Visual Analytics**  
**Eindhoven University of Technology**

The project focuses on combining:

- **Visualization**
- **Automated analysis**
- **Interaction**

into a coherent **Visual Analytics (VA)** workflow.

---

## Authors

- **Haneul Choi**
- **Sofie van Engelen**

---

## Acknowledgements

For this project, we made use of generative AI to help polish code and fix bugs. This was mainly ChatGPT and Claude.

---

## Repository

GitHub Repository:  
[2AMV10_Project](https://github.com/SofievanEngelen/2AMV10_Project)
