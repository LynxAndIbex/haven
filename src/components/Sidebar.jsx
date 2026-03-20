import React from 'react';
import { ChefHat, BedDouble, ArrowDownToLine, Triangle, CarFront, Sofa } from 'lucide-react';

const iconMap = {
    pan: ChefHat,
    bed: BedDouble,
    stairs: ArrowDownToLine,
    triangle: Triangle,
    car: CarFront,
    sofa: Sofa
};

export default function Sidebar({ rooms, activeRoom, setActiveRoom }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-title">Rooms</div>
            <div className="room-nav">
                {rooms.map(room => {
                    const Icon = iconMap[room.iconType];
                    const isActive = activeRoom.id === room.id;
                    return (
                        <button
                            key={room.id}
                            className={`room-btn ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveRoom(room)}
                        >
                            <div className="room-info">
                                <div className="icon-wrapper">
                                    <Icon size={18} color={isActive ? '#fff' : '#6B7280'} />
                                </div>
                                <span>{room.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="sensor-count">8 sensors</span>
                                <div className="status-dot"></div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </aside>
    );
}
