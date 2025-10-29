'use client';

import { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Slider,
  Badge,
  Separator,
  Input,
} from '@hyperlocal/ui';
import { MapPin, Clock, ExternalLink, Loader2, Navigation } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  type: 'event' | 'place';
  venue?: { name: string; lat: number; lon: number };
  durationMinutes: number;
  distanceMeters: number;
  score: number;
  url?: string;
}

export default function Home() {
  const [lat, setLat] = useState(37.7749);
  const [lon, setLon] = useState(-122.4194);
  const [minutesAvailable, setMinutesAvailable] = useState(120);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLon(pos.coords.longitude);
        },
        (err) => console.error('Location error:', err)
      );
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const addInterest = () => {
    if (interestInput && !interests.includes(interestInput)) {
      setInterests([...interests, interestInput]);
      setInterestInput('');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/v1/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lon,
          minutesAvailable,
          interests: interests.length > 0 ? interests : undefined,
          radiusMeters: radiusKm * 1000,
        }),
      });
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-96 border-r overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Hyperlocal Events</h1>
            <p className="text-muted-foreground mt-1">Discover nearby events</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                placeholder="Lat"
              />
              <Input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(parseFloat(e.target.value))}
                placeholder="Lon"
              />
            </div>
            <Button variant="outline" size="sm" onClick={getUserLocation} className="w-full">
              <Navigation className="w-4 h-4 mr-2" />
              Use My Location
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time Available: {minutesAvailable} min</label>
            <Slider
              value={[minutesAvailable]}
              onValueChange={(v) => setMinutesAvailable(v[0])}
              min={15}
              max={240}
              step={15}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Radius: {radiusKm} km</label>
            <Slider
              value={[radiusKm]}
              onValueChange={(v) => setRadiusKm(v[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Interests</label>
            <div className="flex gap-2">
              <Input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                placeholder="Add interest..."
              />
              <Button onClick={addInterest} size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setInterests(interests.filter((x) => x !== i))}
                >
                  {i} ×
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>

          <Separator />

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {suggestions.length > 0 && `${suggestions.length} Results`}
            </h2>
            {suggestions.map((s) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition ${
                  selected === s.id ? 'border-primary' : 'hover:border-primary/50'
                }`}
                onClick={() => setSelected(s.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <Badge variant="outline">{(s.score * 100).toFixed(0)}%</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <MapPin className="w-3 h-3" />
                    {(s.distanceMeters / 1000).toFixed(1)} km
                    <Clock className="w-3 h-3 ml-2" />
                    {s.durationMinutes} min
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {s.venue && <p className="text-sm text-muted-foreground">{s.venue.name}</p>}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Details
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <Map
          initialViewState={{ longitude: lon, latitude: lat, zoom: 12 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        >
          <Marker longitude={lon} latitude={lat} color="blue" />
          {suggestions.map((s) =>
            s.venue ? (
              <Marker
                key={s.id}
                longitude={s.venue.lon}
                latitude={s.venue.lat}
                color={selected === s.id ? 'red' : 'green'}
              />
            ) : null
          )}
        </Map>
      </div>
    </div>
  );
}
