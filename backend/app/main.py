from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List

# Import our new Layout3D computer vision pipeline engine
from app.vision.pipeline import LayoutProcessor

app = FastAPI(
    title="Layout3D Computer Vision Engine",
    description="Backend microservice handling document perspective alignment, structural extraction, and layout OCR text parsing.",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoomData(BaseModel):
    label: str = Field(..., description="The classified architectural name of the room")
    dimensions: str = Field(..., description="The parsed textual size boundaries from OCR tracking")
    confidence: float = Field(..., description="The computer vision or OCR match accuracy score")

class AnalysisResponse(BaseModel):
    rooms: List[RoomData] = Field(..., description="The array of successfully mapped layout assets extracted from image")

# Instantiate processor once globally to keep memory overhead lean
processor = LayoutProcessor()

@app.get("/", status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "online",
        "service": "Layout3D CV Engine",
        "documentation": "/docs"
    }

@app.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_blueprint(file: UploadFile = File(..., description="The high-resolution PNG or JPEG blueprint layout")):
    
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Layout3D only accepts high-resolution PNG or JPEG blueprint configurations."
        )

    try:
        # Read the binary multi-part stream upload
        contents = await file.read()
        
        # Inject file data matrix straight into our OpenCV/OCR transform pipeline
        parsed_rooms = processor.process_image_bytes(contents)
        
        return {"rooms": parsed_rooms}

    except Exception as e:
        print(f"Internal Pipeline Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while running structural matrix transformations: {str(e)}"
        )