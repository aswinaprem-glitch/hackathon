# SlopeWatch — Astra-style interface

This build keeps the working SlopeWatch backend and live-data architecture, but replaces the frontend visual language with an Astra-inspired operational interface:

- fixed navigation rail on desktop
- image-led mountain background
- restrained animated rain
- editorial hero
- live risk signal
- compact metrics
- live Leaflet map
- citizen reports
- nearby emergency services
- report modal and browser notifications
- responsive mobile layout

## Run

```powershell
npm install
npm start
```

Open `http://localhost:3000`.

## Important

This is an early-warning prototype, not a certified landslide forecast or official evacuation order.

Public OpenStreetMap/Nominatim/Overpass services have usage policies and rate limits. For production deployment, add HTTPS, rate limiting, authentication and a managed database.
