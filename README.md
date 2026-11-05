# final-yr-project

Software for Estimating Gas Reserves using conventional reservoir engineering methods and machine learning Z-factor prediction.

## Repository Structure

```text
final-yr-project/
  client/               React, Vite, Tailwind CSS, TanStack, Recharts, Chart.js
  server/               Python FastAPI backend for calculations and ML inference
  ml/                   Data preparation, notebooks, and trained models
  README.md
```

## Quick Start

### 1. Frontend Setup (Client)

Run the web application directly from the root:
```bash
npm run dev
```

Or navigate to the client folder:
```bash
cd client
npm run dev
```

Build for production:
```bash
npm run build
```

### 2. Backend Setup (Server)

1. Navigate to the server folder:
```bash
cd server
```

2. Create and activate a Python virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate
```

3. Install requirements and run the API:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Interactive API documentation will be available at http://127.0.0.1:8000/docs.

### 3. Machine Learning (ML)

The `ml/` directory contains:
- `data/`: Published PVT datasets.
- `notebooks/`: Data exploration and model training notebooks.
- `models/`: Saved model files for deployment.
