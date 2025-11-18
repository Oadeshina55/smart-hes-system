"""
DLMS Client Wrapper
Interfaces with vendor DLLs or uses Gurux DLMS library for meter communication
"""

import os
import sys
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MeterBrand(Enum):
    HEXING = "hexing"
    HEXCELL = "hexcell"


class ConnectionType(Enum):
    SERIAL = "serial"
    TCP = "tcp"
    HDLC = "hdlc"


@dataclass
class ConnectionConfig:
    """Connection configuration for DLMS communication"""
    meter_brand: MeterBrand
    connection_type: ConnectionType

    # Serial connection parameters
    port: Optional[str] = None
    baud_rate: int = 9600
    data_bits: int = 8
    stop_bits: int = 1
    parity: int = 0  # 0=None, 1=Odd, 2=Even

    # TCP/IP connection parameters
    ip_address: Optional[str] = None
    tcp_port: int = 4059

    # DLMS parameters
    server_address: int = 1
    client_address: int = 16
    logical_address: int = 0
    physical_address: int = 0

    # Authentication
    auth_type: str = "None"  # None, Low, High, HighGMAC
    password: Optional[str] = None
    aes_key: Optional[str] = None

    # Timeouts
    timeout: int = 30000  # milliseconds


@dataclass
class ObisReadRequest:
    """OBIS code read request"""
    obis_code: str
    class_id: int = 3
    attribute_id: int = 2
    data_index: int = 0


@dataclass
class ObisWriteRequest:
    """OBIS code write request"""
    obis_code: str
    value: Any
    class_id: int = 3
    attribute_id: int = 2
    data_type: Optional[int] = None


class DLMSClient:
    """
    DLMS Client wrapper that can use either:
    1. Vendor DLLs (WinDLMSClientDLL.dll for Hexcell)
    2. Gurux DLMS library (cross-platform fallback)
    """

    def __init__(self, config: ConnectionConfig):
        self.config = config
        self.connected = False
        self.client = None
        self.use_dll = False

        # Determine which implementation to use
        if sys.platform == 'win32' and config.meter_brand == MeterBrand.HEXCELL:
            try:
                self._init_hexcell_dll()
                self.use_dll = True
                logger.info("Using Hexcell WinDLMSClientDLL.dll")
            except Exception as e:
                logger.warning(f"Failed to load Hexcell DLL: {e}. Falling back to Gurux.")
                self._init_gurux_client()
        else:
            self._init_gurux_client()

    def _init_hexcell_dll(self):
        """Initialize Hexcell DLL-based client (Windows only)"""
        import ctypes
        import ctypes.wintypes

        dll_path = os.path.join(
            os.path.dirname(__file__),
            '../../uploads/DLMS MD/WinDLMSClientDLL.dll'
        )

        if not os.path.exists(dll_path):
            raise FileNotFoundError(f"Hexcell DLL not found at {dll_path}")

        # Load the DLL
        self.dll = ctypes.WinDLL(dll_path)

        # Define function signatures (based on common DLMS DLL patterns)
        # These may need adjustment based on actual DLL documentation

        # int Connect(char* ipAddress, int port, int timeout)
        self.dll.Connect.argtypes = [ctypes.c_char_p, ctypes.c_int, ctypes.c_int]
        self.dll.Connect.restype = ctypes.c_int

        # int ReadOBIS(char* obisCode, char* result, int maxLen)
        self.dll.ReadOBIS.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_int]
        self.dll.ReadOBIS.restype = ctypes.c_int

        # int WriteOBIS(char* obisCode, char* value)
        self.dll.WriteOBIS.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
        self.dll.WriteOBIS.restype = ctypes.c_int

        # int Disconnect()
        self.dll.Disconnect.argtypes = []
        self.dll.Disconnect.restype = ctypes.c_int

        logger.info("Hexcell DLL initialized successfully")

    def _init_gurux_client(self):
        """Initialize Gurux DLMS client (cross-platform)"""
        try:
            from gurux_dlms import GXDLMSClient
            from gurux_dlms.enums import Authentication, InterfaceType
            from gurux_serial import GXSerial
            from gurux_net import GXNet

            # Create DLMS client
            self.client = GXDLMSClient()

            # Configure client
            self.client.clientAddress = self.config.client_address
            self.client.serverAddress = self.config.server_address

            # Set authentication
            if self.config.auth_type.lower() == 'low':
                self.client.authentication = Authentication.LOW
                if self.config.password:
                    self.client.password = self.config.password.encode()
            elif self.config.auth_type.lower() == 'high':
                self.client.authentication = Authentication.HIGH
                if self.config.password:
                    self.client.password = self.config.password.encode()
            else:
                self.client.authentication = Authentication.NONE

            # Set interface type
            if self.config.connection_type == ConnectionType.TCP:
                self.client.interfaceType = InterfaceType.WRAPPER
                self.media = GXNet(
                    self.config.ip_address,
                    self.config.tcp_port
                )
            else:
                self.client.interfaceType = InterfaceType.HDLC
                self.media = GXSerial(
                    self.config.port,
                    self.config.baud_rate,
                    self.config.data_bits,
                    self.config.parity,
                    self.config.stop_bits
                )

            logger.info("Gurux DLMS client initialized successfully")

        except ImportError as e:
            logger.error(f"Failed to import Gurux DLMS: {e}")
            raise RuntimeError("DLMS library not available. Install with: pip install gurux-dlms")

    def connect(self) -> bool:
        """Establish connection to the meter"""
        try:
            if self.use_dll:
                return self._connect_dll()
            else:
                return self._connect_gurux()
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            raise

    def _connect_dll(self) -> bool:
        """Connect using Hexcell DLL"""
        result = self.dll.Connect(
            self.config.ip_address.encode('utf-8'),
            self.config.tcp_port,
            self.config.timeout
        )

        if result == 0:  # Assuming 0 = success
            self.connected = True
            logger.info(f"Connected to meter at {self.config.ip_address}:{self.config.tcp_port}")
            return True
        else:
            logger.error(f"DLL Connect failed with code: {result}")
            return False

    def _connect_gurux(self) -> bool:
        """Connect using Gurux library"""
        # Open media
        self.media.open()

        # Send SNRM/AARQ requests to establish connection
        reply = self.client.snrmRequest()
        self.media.send(reply)

        # Receive response
        response = self.media.receive(self.config.timeout)
        self.client.parseUAResponse(response)

        # Send AARQ
        reply = self.client.aarqRequest()
        self.media.send(reply)

        # Receive AARE
        response = self.media.receive(self.config.timeout)
        self.client.parseAAREResponse(response)

        self.connected = True
        logger.info("Gurux client connected successfully")
        return True

    def disconnect(self):
        """Close connection to the meter"""
        try:
            if self.use_dll and self.connected:
                self.dll.Disconnect()
            elif self.connected:
                # Send disconnect request
                reply = self.client.disconnectRequest()
                self.media.send(reply)
                self.media.close()

            self.connected = False
            logger.info("Disconnected from meter")
        except Exception as e:
            logger.error(f"Disconnect error: {e}")

    def read_obis(self, request: ObisReadRequest) -> Dict[str, Any]:
        """
        Read OBIS code from meter

        Returns:
            {
                'success': bool,
                'obisCode': str,
                'value': any,
                'unit': str,
                'scaler': int,
                'error': str (if failed)
            }
        """
        if not self.connected:
            raise RuntimeError("Not connected to meter")

        try:
            if self.use_dll:
                return self._read_obis_dll(request)
            else:
                return self._read_obis_gurux(request)
        except Exception as e:
            logger.error(f"Read OBIS failed: {e}")
            return {
                'success': False,
                'obisCode': request.obis_code,
                'error': str(e)
            }

    def _read_obis_dll(self, request: ObisReadRequest) -> Dict[str, Any]:
        """Read OBIS using Hexcell DLL"""
        import ctypes

        # Allocate buffer for result
        buffer = ctypes.create_string_buffer(4096)

        result = self.dll.ReadOBIS(
            request.obis_code.encode('utf-8'),
            buffer,
            4096
        )

        if result == 0:
            value_str = buffer.value.decode('utf-8')
            return {
                'success': True,
                'obisCode': request.obis_code,
                'value': value_str,
                'raw': value_str
            }
        else:
            return {
                'success': False,
                'obisCode': request.obis_code,
                'error': f'DLL ReadOBIS failed with code: {result}'
            }

    def _read_obis_gurux(self, request: ObisReadRequest) -> Dict[str, Any]:
        """Read OBIS using Gurux library"""
        from gurux_dlms.objects import GXDLMSObject, GXDLMSObjectCollection
        from gurux_dlms import GXDLMSConverter

        # Parse OBIS code (format: A-B:C.D.E.F)
        obis_parts = self._parse_obis_code(request.obis_code)

        # Create DLMS object
        obj = GXDLMSObject()
        obj.logicalName = request.obis_code
        obj.objectType = request.class_id

        # Read attribute
        data = self.client.read(obj, request.attribute_id)

        # Send read request
        reply = self.media.send(data[0])

        # Receive response
        response = self.media.receive(self.config.timeout)

        # Parse response
        value = self.client.updateValue(obj, request.attribute_id, response)

        return {
            'success': True,
            'obisCode': request.obis_code,
            'value': value,
            'classId': request.class_id,
            'attributeId': request.attribute_id
        }

    def read_multiple(self, requests: List[ObisReadRequest]) -> List[Dict[str, Any]]:
        """Read multiple OBIS codes (batch read)"""
        results = []

        for req in requests:
            result = self.read_obis(req)
            results.append(result)

        return results

    def write_obis(self, request: ObisWriteRequest) -> Dict[str, Any]:
        """Write value to OBIS code"""
        if not self.connected:
            raise RuntimeError("Not connected to meter")

        try:
            if self.use_dll:
                return self._write_obis_dll(request)
            else:
                return self._write_obis_gurux(request)
        except Exception as e:
            logger.error(f"Write OBIS failed: {e}")
            return {
                'success': False,
                'obisCode': request.obis_code,
                'error': str(e)
            }

    def _write_obis_dll(self, request: ObisWriteRequest) -> Dict[str, Any]:
        """Write OBIS using Hexcell DLL"""
        value_str = str(request.value)

        result = self.dll.WriteOBIS(
            request.obis_code.encode('utf-8'),
            value_str.encode('utf-8')
        )

        if result == 0:
            return {
                'success': True,
                'obisCode': request.obis_code,
                'value': request.value
            }
        else:
            return {
                'success': False,
                'obisCode': request.obis_code,
                'error': f'DLL WriteOBIS failed with code: {result}'
            }

    def _write_obis_gurux(self, request: ObisWriteRequest) -> Dict[str, Any]:
        """Write OBIS using Gurux library"""
        from gurux_dlms.objects import GXDLMSObject

        # Create DLMS object
        obj = GXDLMSObject()
        obj.logicalName = request.obis_code
        obj.objectType = request.class_id

        # Write attribute
        data = self.client.write(obj, request.attribute_id, request.value)

        # Send write request
        self.media.send(data[0])

        # Receive response
        response = self.media.receive(self.config.timeout)

        # Check result
        # TODO: Parse response to verify write success

        return {
            'success': True,
            'obisCode': request.obis_code,
            'value': request.value
        }

    @staticmethod
    def _parse_obis_code(obis_code: str) -> tuple:
        """
        Parse OBIS code from string format (A-B:C.D.E.F)
        Returns: (A, B, C, D, E, F)
        """
        try:
            # Format: A-B:C.D.E.F
            parts = obis_code.replace('-', '.').replace(':', '.').split('.')
            return tuple(int(p) for p in parts)
        except Exception as e:
            logger.error(f"Failed to parse OBIS code {obis_code}: {e}")
            return (0, 0, 0, 0, 0, 0)

    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()
