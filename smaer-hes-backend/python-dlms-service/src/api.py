"""
FastAPI REST API for DLMS Communication
Exposes DLMS operations via HTTP endpoints
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import logging
import os
from datetime import datetime

from dlms_client import (
    DLMSClient,
    ConnectionConfig,
    MeterBrand,
    ConnectionType,
    ObisReadRequest,
    ObisWriteRequest
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DLMS Communication Service",
    description="Python-based DLMS/COSEM communication service for HES",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections (in production, use Redis or similar)
active_connections: Dict[str, DLMSClient] = {}


# Pydantic models
class ConnectionRequest(BaseModel):
    meter_number: str = Field(..., description="Meter number/identifier")
    brand: str = Field(..., description="Meter brand: hexing or hexcell")
    connection_type: str = Field(default="tcp", description="Connection type: serial, tcp, hdlc")

    # Connection parameters
    ip_address: Optional[str] = Field(None, description="IP address for TCP connection")
    port: int = Field(default=4059, description="TCP port")
    serial_port: Optional[str] = Field(None, description="Serial port (e.g., COM1, /dev/ttyUSB0)")
    baud_rate: int = Field(default=9600, description="Baud rate for serial")

    # DLMS parameters
    server_address: int = Field(default=1, description="DLMS server address")
    client_address: int = Field(default=16, description="DLMS client address")

    # Authentication
    auth_type: str = Field(default="None", description="Authentication type")
    password: Optional[str] = Field(None, description="Authentication password")
    aes_key: Optional[str] = Field(None, description="AES encryption key")

    # Timeouts
    timeout: int = Field(default=30000, description="Timeout in milliseconds")


class ReadObisRequest(BaseModel):
    meter_number: str = Field(..., description="Meter number")
    obis_code: str = Field(..., description="OBIS code (e.g., 1-0:1.8.0.255)")
    class_id: int = Field(default=3, description="DLMS class ID")
    attribute_id: int = Field(default=2, description="DLMS attribute ID")


class ReadMultipleObisRequest(BaseModel):
    meter_number: str = Field(..., description="Meter number")
    obis_codes: List[Dict[str, Any]] = Field(..., description="List of OBIS codes with metadata")


class WriteObisRequest(BaseModel):
    meter_number: str = Field(..., description="Meter number")
    obis_code: str = Field(..., description="OBIS code")
    value: Any = Field(..., description="Value to write")
    class_id: int = Field(default=3, description="DLMS class ID")
    attribute_id: int = Field(default=2, description="DLMS attribute ID")
    data_type: Optional[int] = Field(None, description="DLMS data type")


class LoadProfileRequest(BaseModel):
    meter_number: str = Field(..., description="Meter number")
    start_date: Optional[str] = Field(None, description="Start date (ISO format)")
    end_date: Optional[str] = Field(None, description="End date (ISO format)")
    obis_code: str = Field(default="1-0:99.1.0.255", description="Load profile OBIS code")


# Helper functions
def get_or_create_connection(meter_number: str, config: ConnectionRequest) -> DLMSClient:
    """Get existing connection or create new one"""
    if meter_number in active_connections:
        client = active_connections[meter_number]
        if client.connected:
            return client
        else:
            # Connection lost, remove and recreate
            del active_connections[meter_number]

    # Create new connection
    connection_config = ConnectionConfig(
        meter_brand=MeterBrand.HEXING if config.brand.lower() == 'hexing' else MeterBrand.HEXCELL,
        connection_type=ConnectionType.TCP if config.connection_type.lower() == 'tcp' else ConnectionType.SERIAL,
        ip_address=config.ip_address,
        tcp_port=config.port,
        port=config.serial_port,
        baud_rate=config.baud_rate,
        server_address=config.server_address,
        client_address=config.client_address,
        auth_type=config.auth_type,
        password=config.password,
        aes_key=config.aes_key,
        timeout=config.timeout
    )

    client = DLMSClient(connection_config)
    client.connect()

    # Store connection
    active_connections[meter_number] = client

    return client


def cleanup_connection(meter_number: str):
    """Cleanup connection"""
    if meter_number in active_connections:
        try:
            active_connections[meter_number].disconnect()
        except Exception as e:
            logger.error(f"Error disconnecting {meter_number}: {e}")
        finally:
            del active_connections[meter_number]


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "DLMS Communication Service",
        "version": "1.0.0",
        "status": "running",
        "active_connections": len(active_connections)
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(active_connections)
    }


@app.post("/connect")
async def connect(request: ConnectionRequest):
    """Establish connection to a meter"""
    try:
        logger.info(f"Connecting to meter {request.meter_number} ({request.brand})")

        client = get_or_create_connection(request.meter_number, request)

        return {
            "success": True,
            "meterNumber": request.meter_number,
            "connected": client.connected,
            "message": "Connected successfully"
        }

    except Exception as e:
        logger.error(f"Connection error for {request.meter_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/disconnect")
async def disconnect(meter_number: str):
    """Disconnect from a meter"""
    try:
        cleanup_connection(meter_number)
        return {
            "success": True,
            "meterNumber": meter_number,
            "message": "Disconnected successfully"
        }
    except Exception as e:
        logger.error(f"Disconnect error for {meter_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/read")
async def read_obis(request: ReadObisRequest):
    """Read single OBIS code from meter"""
    try:
        logger.info(f"Reading {request.obis_code} from meter {request.meter_number}")

        # Get connection
        if request.meter_number not in active_connections:
            raise HTTPException(
                status_code=400,
                detail=f"Not connected to meter {request.meter_number}. Call /connect first."
            )

        client = active_connections[request.meter_number]

        # Read OBIS
        obis_request = ObisReadRequest(
            obis_code=request.obis_code,
            class_id=request.class_id,
            attribute_id=request.attribute_id
        )

        result = client.read_obis(obis_request)

        return {
            "success": result.get('success', False),
            "meterNumber": request.meter_number,
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read error for {request.meter_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/read-multiple")
async def read_multiple_obis(request: ReadMultipleObisRequest):
    """Read multiple OBIS codes from meter (batch read)"""
    try:
        logger.info(f"Batch reading {len(request.obis_codes)} parameters from {request.meter_number}")

        # Get connection
        if request.meter_number not in active_connections:
            raise HTTPException(
                status_code=400,
                detail=f"Not connected to meter {request.meter_number}. Call /connect first."
            )

        client = active_connections[request.meter_number]

        # Create read requests
        obis_requests = []
        for obis_data in request.obis_codes:
            obis_requests.append(ObisReadRequest(
                obis_code=obis_data.get('code', obis_data.get('obisCode')),
                class_id=obis_data.get('classId', 3),
                attribute_id=obis_data.get('attributeId', 2)
            ))

        # Batch read
        results = client.read_multiple(obis_requests)

        successful = sum(1 for r in results if r.get('success', False))

        return {
            "success": True,
            "meterNumber": request.meter_number,
            "total": len(results),
            "successful": successful,
            "failed": len(results) - successful,
            "data": {
                "readings": results
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch read error for {request.meter_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/write")
async def write_obis(request: WriteObisRequest):
    """Write value to OBIS code"""
    try:
        logger.info(f"Writing {request.value} to {request.obis_code} on meter {request.meter_number}")

        # Get connection
        if request.meter_number not in active_connections:
            raise HTTPException(
                status_code=400,
                detail=f"Not connected to meter {request.meter_number}. Call /connect first."
            )

        client = active_connections[request.meter_number]

        # Write OBIS
        write_request = ObisWriteRequest(
            obis_code=request.obis_code,
            value=request.value,
            class_id=request.class_id,
            attribute_id=request.attribute_id,
            data_type=request.data_type
        )

        result = client.write_obis(write_request)

        return {
            "success": result.get('success', False),
            "meterNumber": request.meter_number,
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Write error for {request.meter_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/load-profile")
async def read_load_profile(request: LoadProfileRequest):
    """Read load profile data from meter"""
    try:
        logger.info(f"Reading load profile from meter {request.meter_number}")

        # Get connection
        if request.meter_number not in active_connections:
            raise HTTPException(
                status_code=400,
                detail=f"Not connected to meter {request.meter_number}. Call /connect first."
            )

        client = active_connections[request.meter_number]

        # Read load profile OBIS code
        # Note: Load profile reading requires special handling
        # This is a simplified implementation
        obis_request = ObisReadRequest(
            obis_code=request.obis_code,
            class_id=7,  # Profile Generic class
            attribute_id=2  # Buffer
        )

        result = client.read_obis(obis_request)

        return {
            "success": result.get('success', False),
            "meterNumber": request.meter_number,
            "data": result,
            "message": "Load profile read (Note: parsing may require additional implementation)"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Load profile error for {request.meter_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/connections")
async def list_connections():
    """List all active connections"""
    connections = []
    for meter_number, client in active_connections.items():
        connections.append({
            "meterNumber": meter_number,
            "connected": client.connected,
            "useDLL": client.use_dll,
            "brand": client.config.meter_brand.value
        })

    return {
        "total": len(connections),
        "connections": connections
    }


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down DLMS service...")
    for meter_number in list(active_connections.keys()):
        cleanup_connection(meter_number)
    logger.info("All connections closed")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("DLMS_SERVICE_PORT", "8001"))

    logger.info(f"Starting DLMS Communication Service on port {port}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
