# Smart Meter Simulator

This simulator generates realistic smart meter data for testing the HES system.

## Features

- ✅ Simulates DLMS/COSEM OBIS codes
- ✅ Realistic energy consumption patterns
- ✅ Voltage and current variations
- ✅ MQTT communication with HES backend
- ✅ Responds to commands (READ_ALL, CONNECT, DISCONNECT)
- ✅ Occasional tamper alerts
- ✅ Simulates multiple meters simultaneously

## Installation

```bash
cd meter-simulator
npm install
```

## Usage

### Single Meter
```bash
node simulator.js
```

### Multiple Meters
```bash
METER_COUNT=10 node simulator.js
```

### Custom Configuration
```bash
MQTT_BROKER=mqtt://your-broker:1883 METER_COUNT=5 SEND_INTERVAL=15000 node simulator.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MQTT_BROKER` | `mqtt://localhost:1883` | MQTT broker URL |
| `METER_COUNT` | `1` | Number of meters to simulate |
| `SEND_INTERVAL` | `30000` | Data send interval (milliseconds) |

## Generated OBIS Codes

The simulator generates the following OBIS parameters:

| OBIS Code | Description | Sample Value |
|-----------|-------------|--------------|
| 1-0:1.8.0.255 | Cumulative Active Energy | 5234.56 kWh |
| 1-0:3.8.0.255 | Cumulative Reactive Energy | 523.46 kVArh |
| 1-0:1.7.0.255 | Instantaneous Power | 2.45 kW |
| 1-0:32.7.0.255 | Voltage (Phase A) | 230.5 V |
| 1-0:31.7.0.255 | Current (Phase A) | 10.6 A |
| 1-0:13.7.0.255 | Power Factor | 0.97 |
| 0-0:96.5.5.255 | Connection Status | connected |

## MQTT Topics

### Published by Meter:
- `meter/{meterId}/data` - Meter readings
- `meter/{meterId}/status` - Status updates
- `meter/{meterId}/alert` - Tamper/alert events

### Subscribed by Meter:
- `meter/{meterId}/command` - Commands from HES

## Commands

The simulator responds to these commands:

- `READ_ALL` - Send immediate meter reading
- `CONNECT` - Enable power supply
- `DISCONNECT` - Disable power supply

## Testing

1. Start Mosquitto MQTT broker:
```bash
mosquitto -v
```

2. Start the simulator:
```bash
node simulator.js
```

3. In another terminal, monitor the data:
```bash
mosquitto_sub -t 'meter/#' -v
```

4. Send a command to a meter:
```bash
mosquitto_pub -t 'meter/TEST_METER_001/command' -m '{"command":"READ_ALL","timestamp":1234567890}'
```

## Integration with HES

1. Ensure MQTT broker is running
2. Configure backend `.env`:
```
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
METER_READ_INTERVAL=30
```

3. Start HES backend
4. Start simulator
5. Add meters to HES with IDs: `TEST_METER_001`, `TEST_METER_002`, etc.

## Notes

- Meters automatically respond to READ_ALL commands
- Energy values accumulate realistically over time
- Voltage stays within ±5% of 230V (typical grid variance)
- Power consumption varies randomly between 0.5-10 kW
- Tamper events trigger randomly (1% chance per reading)
- Signal quality varies between -80 to -50 dBm
