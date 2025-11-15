import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ObisParameters.css';

interface ObisFunction {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  scaler?: number;
  dataType?: string;
  classId?: string;
  attributeId?: number;
  group?: string;
  brand?: string;
  accessRight?: string;
}

interface ObisReading {
  obisCode: string;
  name?: string;
  value: any;
  unit?: string;
  scaler?: number;
  actualValue?: number;
  dataType?: string;
  quality?: string;
}

interface Meter {
  _id: string;
  meterNumber: string;
  brand?: string;
  model?: string;
  status: string;
}

const ObisParameters: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<string>('');
  const [allObisFunctions, setAllObisFunctions] = useState<ObisFunction[]>([]);
  const [filteredFunctions, setFilteredFunctions] = useState<ObisFunction[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [currentReadings, setCurrentReadings] = useState<Map<string, ObisReading>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'read' | 'write'>('read');
  const [writeValue, setWriteValue] = useState<string>('');
  const [writeCode, setWriteCode] = useState<string>('');

  // Fetch meters on mount
  useEffect(() => {
    fetchMeters();
    fetchObisFunctions();
  }, []);

  // Filter functions when search/filters change
  useEffect(() => {
    filterObisFunctions();
  }, [searchTerm, filterBrand, filterGroup, allObisFunctions]);

  const fetchMeters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/meters`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      if (response.data.success) {
        setMeters(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching meters:', error);
      setError('Failed to load meters');
    }
  };

  const fetchObisFunctions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/obis/functions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAllObisFunctions(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching OBIS functions:', error);
      setError('Failed to load OBIS functions');
    }
  };

  const filterObisFunctions = () => {
    let filtered = [...allObisFunctions];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (func) =>
          func.code.toLowerCase().includes(term) ||
          func.name?.toLowerCase().includes(term) ||
          func.description?.toLowerCase().includes(term)
      );
    }

    // Filter by brand
    if (filterBrand !== 'all') {
      filtered = filtered.filter((func) => func.brand === filterBrand);
    }

    // Filter by group
    if (filterGroup !== 'all') {
      filtered = filtered.filter((func) => func.group === filterGroup);
    }

    setFilteredFunctions(filtered);
  };

  const toggleSelection = (code: string) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedCodes(newSelected);
  };

  const selectAll = () => {
    const allCodes = new Set(filteredFunctions.map((func) => func.code));
    setSelectedCodes(allCodes);
  };

  const clearSelection = () => {
    setSelectedCodes(new Set());
  };

  const readSelectedParameters = async () => {
    if (!selectedMeter) {
      setError('Please select a meter');
      return;
    }

    if (selectedCodes.size === 0) {
      setError('Please select at least one OBIS parameter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/meters/${selectedMeter}/read-obis`,
        { obisCodes: Array.from(selectedCodes) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const readingsMap = new Map<string, ObisReading>();
        response.data.data.readings.forEach((reading: ObisReading) => {
          readingsMap.set(reading.obisCode, reading);
        });
        setCurrentReadings(readingsMap);
        setError('');
      }
    } catch (error: any) {
      console.error('Error reading OBIS parameters:', error);
      setError(error.response?.data?.message || 'Failed to read OBIS parameters');
    } finally {
      setLoading(false);
    }
  };

  const writeParameter = async () => {
    if (!selectedMeter) {
      setError('Please select a meter');
      return;
    }

    if (!writeCode || writeValue === '') {
      setError('Please enter OBIS code and value');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/meters/${selectedMeter}/write-obis`,
        { obisCode: writeCode, value: writeValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`Successfully wrote ${writeCode}=${writeValue}`);
        setWriteCode('');
        setWriteValue('');
      }
    } catch (error: any) {
      console.error('Error writing OBIS parameter:', error);
      setError(error.response?.data?.message || 'Failed to write OBIS parameter');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueGroups = (): string[] => {
    const groups = new Set<string>();
    allObisFunctions.forEach((func) => {
      if (func.group) groups.add(func.group);
    });
    return Array.from(groups).sort();
  };

  const getUniqueBrands = (): string[] => {
    const brands = new Set<string>();
    allObisFunctions.forEach((func) => {
      if (func.brand) brands.add(func.brand);
    });
    return Array.from(brands).sort();
  };

  const formatValue = (reading: ObisReading): string => {
    if (reading.actualValue !== undefined) {
      return `${reading.actualValue} ${reading.unit || ''}`;
    }
    return `${reading.value} ${reading.unit || ''}`;
  };

  return (
    <div className="obis-parameters-container">
      <div className="page-header">
        <h1>OBIS Parameter Management</h1>
        <p>Read and write individual OBIS parameters from meters</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {/* Meter Selection */}
      <div className="section">
        <h3>Select Meter</h3>
        <select
          value={selectedMeter}
          onChange={(e) => setSelectedMeter(e.target.value)}
          className="form-control"
        >
          <option value="">-- Select a meter --</option>
          {meters.map((meter) => (
            <option key={meter._id} value={meter._id}>
              {meter.meterNumber} - {meter.brand} {meter.model} ({meter.status})
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'read' ? 'active' : ''}`}
          onClick={() => setActiveTab('read')}
        >
          Read Parameters
        </button>
        <button
          className={`tab ${activeTab === 'write' ? 'active' : ''}`}
          onClick={() => setActiveTab('write')}
        >
          Write Parameters
        </button>
      </div>

      {/* Read Parameters Tab */}
      {activeTab === 'read' && (
        <>
          {/* Filters */}
          <div className="section filters">
            <h3>Filters</h3>
            <div className="filter-row">
              <div className="filter-item">
                <label>Search:</label>
                <input
                  type="text"
                  placeholder="Search code, name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="filter-item">
                <label>Brand:</label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="form-control"
                >
                  <option value="all">All Brands</option>
                  {getUniqueBrands().map((brand) => (
                    <option key={brand} value={brand}>
                      {brand.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label>Group:</label>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="form-control"
                >
                  <option value="all">All Groups</option>
                  {getUniqueGroups().map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Selection Actions */}
          <div className="section actions">
            <div className="selection-info">
              <span>
                {selectedCodes.size} of {filteredFunctions.length} selected
              </span>
            </div>
            <div className="action-buttons">
              <button onClick={selectAll} className="btn btn-secondary">
                Select All
              </button>
              <button onClick={clearSelection} className="btn btn-secondary">
                Clear Selection
              </button>
              <button
                onClick={readSelectedParameters}
                className="btn btn-primary"
                disabled={loading || selectedCodes.size === 0 || !selectedMeter}
              >
                {loading ? 'Reading...' : `Read ${selectedCodes.size} Parameters`}
              </button>
            </div>
          </div>

          {/* OBIS Functions Table */}
          <div className="section">
            <h3>Available OBIS Parameters ({filteredFunctions.length})</h3>
            <div className="table-container">
              <table className="obis-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>OBIS Code</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Data Type</th>
                    <th>Access</th>
                    <th>Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFunctions.map((func) => {
                    const reading = currentReadings.get(func.code);
                    const isSelected = selectedCodes.has(func.code);
                    return (
                      <tr
                        key={func.code}
                        className={`${isSelected ? 'selected' : ''} ${reading ? 'has-reading' : ''}`}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(func.code)}
                          />
                        </td>
                        <td className="code">{func.code}</td>
                        <td>{func.name || '-'}</td>
                        <td className="description">{func.description || '-'}</td>
                        <td>{func.unit || '-'}</td>
                        <td>{func.dataType || '-'}</td>
                        <td>
                          <span className={`access-badge ${func.accessRight}`}>
                            {func.accessRight || 'R'}
                          </span>
                        </td>
                        <td className="value">
                          {reading ? (
                            <span className={`reading-value ${reading.quality}`}>
                              {formatValue(reading)}
                            </span>
                          ) : (
                            <span className="no-value">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Write Parameters Tab */}
      {activeTab === 'write' && (
        <div className="section write-section">
          <h3>Write OBIS Parameter</h3>
          <div className="write-form">
            <div className="form-group">
              <label>OBIS Code:</label>
              <input
                type="text"
                placeholder="e.g., 0-0:1.0.0.255"
                value={writeCode}
                onChange={(e) => setWriteCode(e.target.value)}
                className="form-control"
                list="obis-codes-list"
              />
              <datalist id="obis-codes-list">
                {allObisFunctions
                  .filter((f) => f.accessRight === 'RW' || f.accessRight === 'W')
                  .map((func) => (
                    <option key={func.code} value={func.code}>
                      {func.name}
                    </option>
                  ))}
              </datalist>
            </div>

            <div className="form-group">
              <label>Value:</label>
              <input
                type="text"
                placeholder="Enter value"
                value={writeValue}
                onChange={(e) => setWriteValue(e.target.value)}
                className="form-control"
              />
            </div>

            <button
              onClick={writeParameter}
              className="btn btn-primary"
              disabled={loading || !selectedMeter || !writeCode || writeValue === ''}
            >
              {loading ? 'Writing...' : 'Write Parameter'}
            </button>
          </div>

          {/* Writable Parameters List */}
          <div className="writable-parameters">
            <h4>Writable Parameters</h4>
            <div className="table-container">
              <table className="obis-table">
                <thead>
                  <tr>
                    <th>OBIS Code</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Data Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allObisFunctions
                    .filter((f) => f.accessRight === 'RW' || f.accessRight === 'W')
                    .map((func) => (
                      <tr key={func.code}>
                        <td className="code">{func.code}</td>
                        <td>{func.name || '-'}</td>
                        <td className="description">{func.description || '-'}</td>
                        <td>{func.unit || '-'}</td>
                        <td>{func.dataType || '-'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setWriteCode(func.code);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObisParameters;
