import React, { useEffect, useRef } from 'react';
import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

const TrafficMap = ({ center = [36.8219, -1.2921], zoom = 12 }) => { // Default to Nairobi
  const mapElement = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
    if (!apiKey) {
      console.error('TomTom API key is missing');
      return;
    }

    if (map.current) return; // Initialize map only once

    map.current = tt.map({
      key: apiKey,
      container: mapElement.current,
      center: center,
      zoom: zoom,
    });

    map.current.on('load', () => {
      // Enable traffic flow and incidents by default to give real-time feedback
      map.current.showTrafficFlow();
      // To show traffic incidents, you would need the services SDK as well, 
      // but flow is enough for real-time visual feedback of traffic jams.
    });

    // Add navigation controls
    map.current.addControl(new tt.NavigationControl());

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);

  return (
    <div 
      ref={mapElement} 
      style={{ height: '100%', width: '100%', minHeight: '300px', borderRadius: '8px' }} 
    />
  );
};

export default TrafficMap;
