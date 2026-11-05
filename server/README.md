# Backend API

FastAPI service for gas reserves estimation calculations and machine learning Z-factor predictions.

## Setup Instructions

1. Create a Python virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- On Windows:
```bash
.\venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the development server:
```bash
uvicorn main:app --reload
```

The API will be available at http://127.0.0.1:8000 and interactive documentation at http://127.0.0.1:8000/docs.

