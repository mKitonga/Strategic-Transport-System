import React, { useEffect, useRef, useState } from 'react';
import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

const TrafficMap = ({ center = [36.8219, -1.2921], zoom = 12 }) => { // Default to Nairobi
  const mapElement = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [mapError, setMapError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

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
      marker.current?.remove();
      marker.current = null;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center[0], center[1], zoom]);

  const searchPlaces = async (event) => {
    event.preventDefault();
    const query = searchText.trim();
    const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

    if (!query) {
      setSearchError('Enter a place, address, or landmark to search.');
      setSearchResults([]);
      return;
    }

    if (!apiKey) {
      setSearchError('TomTom API key is missing. Set VITE_TOMTOM_API_KEY in frontend/.env.local.');
      return;
    }

    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const url = new URL(`https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json`);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('limit', '5');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(response.status === 403
          ? 'Place search is unavailable for this key. Enable the TomTom Search API product and check key restrictions.'
          : `TomTom place search failed (${response.status}). Check your key and internet connection.`);
      }

      const data = await response.json();
      const results = (data.results || []).filter((result) => result.position?.lon != null && result.position?.lat != null);
      setSearchResults(results);
      if (results.length === 0) setSearchError('No matching places found. Try a different search.');
    } catch (error) {
      setSearchError(error.message || 'Could not search places right now.');
    } finally {
      setSearching(false);
    }
  };

  const selectPlace = (place) => {
    if (!map.current) return;
    const coordinates = [place.position.lon, place.position.lat];
    map.current.flyTo({ center: coordinates, zoom: 15 });
    marker.current?.remove();
    marker.current = new tt.Marker({ color: '#f59e0b' })
      .setLngLat(coordinates)
      .addTo(map.current);
    setSearchText(place.poi?.name || place.address?.freeformAddress || place.address?.streetName || 'Selected place');
    setSearchResults([]);
    setSearchError('');
  };

  return (
    <div style={{ position: 'relative', isolation: 'isolate' }}>
      <form
        onSubmit={searchPlaces}
        role="search"
        aria-label="Search places on map"
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10, pointerEvents: 'auto',
          display: 'flex', width: 'min(380px, calc(100% - 32px))',
          background: 'var(--color-surface, #fff)', borderRadius: 10,
          boxShadow: '0 2px 12px rgba(0,0,0,.2)', overflow: 'hidden',
        }}
      >
        <input
          type="search"
          aria-label="Search any place"
          placeholder="Search a place or address"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          style={{ minWidth: 0, flex: 1, border: 0, outline: 0, padding: '12px 14px', fontSize: 14, background: 'transparent', color: '#172033', caretColor: '#172033' }}
        />
        <button
          type="submit"
          aria-label="Search map"
          title="Search map"
          disabled={searching}
          style={{ border: 0, padding: '0 15px', background: 'var(--color-primary, #f59e0b)', color: '#fff', cursor: searching ? 'wait' : 'pointer' }}
        >
          {searching ? '…' : <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2"/><path d="m16 16 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
        </button>
      </form>
      {(searchResults.length > 0 || searchError) && (
        <div style={{ position: 'absolute', top: 66, left: 16, zIndex: 10, pointerEvents: 'auto', width: 'min(380px, calc(100% - 32px))', background: 'var(--color-surface, #fff)', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,.2)', overflow: 'hidden', color: '#172033' }}>
          {searchResults.map((place, index) => (
            <button
              type="button"
              key={`${place.id || place.address?.freeformAddress}-${index}`}
              onClick={() => selectPlace(place)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', border: 0, borderBottom: '1px solid rgba(0,0,0,.08)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
            >
              <span style={{ display: 'block', fontWeight: 600 }}>{place.poi?.name || place.address?.freeformAddress || 'Place'}</span>
              <span style={{ display: 'block', marginTop: 3, fontSize: 12, opacity: 0.72 }}>{place.address?.freeformAddress || place.address?.municipality || ''}</span>
            </button>
          ))}
          {searchError && <p role="status" style={{ margin: 0, padding: '11px 14px', fontSize: 13 }}>{searchError}</p>}
        </div>
      )}
      <div
        ref={mapElement}
        aria-label="TomTom map with live traffic flow and incidents"
        style={{ position: 'relative', zIndex: 0, height: '100%', width: '100%', minHeight: '300px', borderRadius: '8px' }}
      />
      {mapError && <p role="alert" style={{ color: 'var(--color-danger)', marginTop: '0.75rem' }}>{mapError}</p>}
    </div>
  );
};

export default TrafficMap;
