from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List

# Initialize the core FastAPI instance with Layout3D descriptive metadata
app = FastAPI(
    title="Layout3D Computer Vision Engine",
    description="Backend microservice handling document perspective alignment, structural extraction, and layout OCR text parsing.",
    version="1.0.0"
)

# 1. CORS MIDDLEWARE CONFIGURATION
# Allows your Next.js application (typically running on http://localhost:3000)
# to securely transmit file payloads across local network boundaries.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows standard GET, POST, OPTIONS requests
    allow_headers=["*"],
)

# 2. PYDANTIC DATA VALIDATION SCHEMAS
# Strictly enforces the strict layout boundaries expected by the React client.
class RoomData(BaseModel):
    label: str = Field(..., description="The classified architectural name of the room", example="Living Room")
    dimensions: str = Field(..., description="The parsed textual size boundaries from OCR tracking", example="4.5m x 5.0m")
    confidence: float = Field(..., description="The computer vision or OCR match accuracy score", example=0.92)

class AnalysisResponse(BaseModel):
    rooms: List[RoomData] = Field(..., description="The array of successfully mapped layout assets extracted from the image")


# 3. BASE ROUTE FOR SERVICE HEALTH CHECKS
@app.get("/", status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "online",
        "service": "Layout3D CV Engine",
        "documentation": "/docs"
    }


# 4. COMPUTER VISION ANALYSIS ENDPOINT
# Multi-part file upload receiving endpoint that handles raw stream objects.
@app.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_blueprint(file: UploadFile = File(..., description="The high-resolution PNG or JPEG blueprint layout")):
    
    # Validation step: Protect the server from non-image file transmissions
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Layout3D only accepts high-resolution PNG or JPEG blueprint configurations."
        )

    try:
        # Read the file data payload stream
        contents = await file.read()
        
        # TODO: Phase 3 will replace this mock block with the live OpenCV transformation matrix pipelines,
        # line trace segmentation filters, and Tesseract character recognition configurations.
        
        mock_parsed_layout = {
            "rooms": [
                {"label": "Master Bedroom", "dimensions": "4.5m x 5.0m", "confidence": 0.94},
                {"label": "Living Room", "dimensions": "6.0m x 4.5m", "confidence": 0.91},
                {"label": "Kitchen & Dining", "dimensions": "4.0m x 3.5m", "confidence": 0.88},
                {"label": "Guest Bathroom", "dimensions": "2.5m x 2.0m", "confidence": 0.95}
            ]
        }
        
        return mock_parsed_layout

    except Exception as e:
        # Gracefully log internal processing errors to standard trace channels
        print(f"Internal Pipeline Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while running structural matrix transformations on the design document."
        )