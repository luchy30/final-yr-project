from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="Gas Reserves Estimation API",
    description="Backend API for Z-factor prediction and reserves calculation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VolumetricInput(BaseModel):
    area_acres: float
    net_pay_feet: float
    porosity: float
    water_saturation: float
    gas_formation_volume_factor: float

class VolumetricOutput(BaseModel):
    giip_bscf: float
    recoverable_reserves_1p_bscf: float
    recoverable_reserves_2p_bscf: float
    recoverable_reserves_3p_bscf: float

class ZFactorInput(BaseModel):
    pressure_psia: float
    temperature_rankine: float
    gas_gravity: float

class ZFactorOutput(BaseModel):
    z_factor_predicted: float
    method: str

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Gas Reserves Estimation API",
        "version": "1.0.0"
    }

@app.post("/api/reserves/volumetric", response_model=VolumetricOutput)
def calculate_volumetric(data: VolumetricInput):
    # Standard engineering equation: GIIP = 43560 * A * h * phi * (1 - Sw) / Bgi
    # Returns GIIP in Standard Cubic Feet (converted to Billion Standard Cubic Feet)
    phi = data.porosity
    sw = data.water_saturation
    bg = data.gas_formation_volume_factor
    
    giip_scf = (43560.0 * data.area_acres * data.net_pay_feet * phi * (1.0 - sw)) / bg
    giip_bscf = giip_scf / 1e9

    # Standard recovery factor scenarios for 1P, 2P, 3P
    return VolumetricOutput(
        giip_bscf=round(giip_bscf, 4),
        recoverable_reserves_1p_bscf=round(giip_bscf * 0.65, 4),
        recoverable_reserves_2p_bscf=round(giip_bscf * 0.75, 4),
        recoverable_reserves_3p_bscf=round(giip_bscf * 0.85, 4),
    )

@app.post("/api/z-factor/predict", response_model=ZFactorOutput)
def predict_z_factor(data: ZFactorInput):
    # Placeholder for ML model inference
    # Will be loaded from trained model in ml/models/
    return ZFactorOutput(
        z_factor_predicted=0.88,
        method="Machine Learning Model"
    )

