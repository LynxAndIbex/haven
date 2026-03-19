import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';

const DEFAULT_SENSORS = {
  radon: { value: 0.8, unit: 'pCi/L', statusText: 'Normal', max: 4 },
  co: { value: 0, unit: 'ppm', statusText: 'None detected', max: 9 },
  humidity: { value: 45, unit: '%', statusText: 'Ideal', max: 100 },
  methane: { value: 0, unit: 'ppb', statusText: 'None detected', max: 1000 },
  vocs: { value: 120, unit: 'ppb', statusText: 'Low', max: 1000 },
  co2: { value: 650, unit: 'ppm', statusText: 'Good', max: 2000 },
  pm25: { value: 5, unit: 'µg/m³', statusText: 'Excellent', max: 35 },
  temp: { value: 71, unit: '°F', statusText: 'Comfortable', max: 100 }
};

const ROOMS = [
  { id: 'kitchen', name: 'Kitchen', iconType: 'pan' },
  { id: 'bedroom', name: 'Bedroom', iconType: 'bed' },
  { id: 'basement', name: 'Basement', iconType: 'stairs' },
  { id: 'attic', name: 'Attic', iconType: 'triangle' },
  { id: 'garage', name: 'Garage', iconType: 'car' },
  { id: 'living', name: 'Living Room', iconType: 'sofa' }
];

function App() {
  const [activeRoom, setActiveRoom] = useState(ROOMS[4]); // Default to Garage
  const [roomData, setRoomData] = useState(() => {
    // Initialize state for each room with deep copies
    const data = {};
    ROOMS.forEach(r => {
      data[r.id] = JSON.parse(JSON.stringify(DEFAULT_SENSORS));
    });
    return data;
  });

  const handleUpdateSensor = (roomId, sensorKey, newValue) => {
    setRoomData(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [sensorKey]: {
          ...prev[roomId][sensorKey],
          value: newValue
        }
      }
    }));
  };

  return (
    <div className="app-container">
      <Sidebar
        rooms={ROOMS}
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
      />
      <MainPanel
        activeRoom={activeRoom}
        sensors={roomData[activeRoom.id]}
        onUpdateSensor={(key, val) => handleUpdateSensor(activeRoom.id, key, val)}
      />
    </div>
  );
}

export default App;
