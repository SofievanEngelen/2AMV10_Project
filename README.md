# Academic AdvAIsor -- Interactive Visual Analytics for Exploring Student Burnout and Productivity
2AMV10 – Visual Analytics | Group 7 | Eindhoven University of Technology Haneul Choi – 1773895 | Sofie van Engelen – 2224402
# Overview
Academic AdvAIsor is an interactive visual analytics dashboard designed for academic advisors. It combines machine learning, local explainability (LIME), and counterfactual analysis (DiCE) to help advisors understand why a student is predicted to underperform — and what specific, realistic lifestyle changes would improve their outcome. The system addresses a core gap in academic advising: generic advice cannot serve all students equally, because different students fail for different reasons. One student burns out, another loses focus, another is simply distracted. This tool makes the model's reasoning transparent and actionable without requiring any machine learning expertise from the advisor.

# Strategy Atlas implementation
- UMAP-based 2D embedding of high-dimensional data -
- Cluster exploration across multiple target variables:
  - Burnout level
  - Exam score
  - Focus index
  - Mental health score
  - Productivity score

# Installation & Setup
# Prerequisites
Python 3.9+
Node.js 18+

# Backend setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend
```bash
cd frontend
npm install
npm run dev

# Notebook (one-time export)
To regenerate the pre-computed JSON exports:
```bash
jupyter notebook "final version (hopefully).ipynb"
The final export cell will generate 'atlas_points.json', 'atlas_grid.json', 'lime_contributions.json', and 'strategy_umap_model'. Copy these to the appropriate location in backend/data/StrategyAtlas. 

Note: Re-running the notebook will produce a different StrategyAtlas layout due to ParametricUMAP's stochastic neural network training. If you regenerate the exports, all JSON files and the saved model must be regenerated together to remain consistent.
