import React, { useEffect, useRef, useState } from 'react';
import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

const TrafficMap = ({ center = [36.8219, -1.2921], zoom = 12 }) => { // Default to Nairobi
  const mapElement = useRef(null);
  const map = useRef(null);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
    if (!apiKey) {
      setMapError('TomTom map key is missing. Set VITE_TOMTOM_API_KEY in frontend/.env.local and restart Vite.');
      return;
    }

    setMapError('');
    try {
      map.current = tt.map({
        key: apiKey,
        container: mapElement.current,
        center,
        zoom,
      });

      map.current.on('load', () => {
        map.current?.showTrafficFlow();
        map.current?.showTrafficIncidents();
      });
      map.current.on('error', (event) => {
        setMapError(event?.error?.message || 'TomTom could not load map or traffic data. Check the key products and domain restrictions.');
      });
      map.current.addControl(new tt.NavigationControl());
    } catch (error) {
      setMapError(error.message || 'TomTom map could not be initialized.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center[0], center[1], zoom]);

  return (
    <div>
      <div
        ref={mapElement}
        aria-label="TomTom map with live traffic flow and incidents"
        style={{ height: '100%', width: '100%', minHeight: '300px', borderRadius: '8px' }}
      />
      {mapError && <p role="alert" style={{ color: 'var(--color-danger)', marginTop: '0.75rem' }}>{mapError}</p>}
    </div>
  );
};

export default TrafficMap;
