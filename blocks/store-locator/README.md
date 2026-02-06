# Store Locator Block

A Places‑powered store finder with an interactive map, rich info windows, and a configurable results list. It supports Google Places (New) enrichment, open/closed status in the store’s local timezone, and configurable filters/sorting.

## What this block does

- **Search & filters:** Address search, service filters, and “Open Now”
- **Map + info windows:** Google map with Advanced Markers and rich info windows
- **Store cards:** Name, hours, distance, phone, services, and directions
- **Sorting:** Distance, Name (A‑Z), Recently Added
- **Geolocation:** Optional auto‑detect location on load
- **Timezone‑accurate status:** Uses Places `utcOffsetMinutes` for open/closed

## Setup (Google)

1. Create a Google Cloud project.
2. Enable **Maps JavaScript API** and **Places API (New)**.
3. Create an API key and restrict it to your domains (include `http://localhost:3000/*` for local).
4. Add the API key to DA.live config (`Google Maps API Key`).

## DA.live configuration

### Config rows (top of table)

Top row should be the block name only:

```
store-locator
```

Example DA.live table (config + Place IDs):

```
store-locator
Google Maps API Key | YOUR_API_KEY
Default View | split
Search Radius | 0
Max Results | 10
Auto Detect Location | true
Default Location | 
Experience Mode | fast
Radius Presets | 0,5,10,25,50
Units | miles
No Results Message | No stores found matching your criteria.
Max Reviews Per Store | 5
Map Style | default
Primary CTA Label | Get Directions
Store Card Density | comfortable
Places ID | Featured | Custom Services | Display Order | Override Name
ChIJ... | true | pickup, deli, delivery | 1 | Downtown Market
ChIJ... | true | pickup, click&collect | 2 |
ChIJ... | true | pickup, click&collect, pharmacy | 3 |
```

| Row label | Type | Default | Description |
|---|---|---|---|
| Google Maps API Key | text | empty | Required for map + Places enrichment |
| Default View | select | `split` | `split`, `map`, `list` |
| Search Radius | number | `0` | Default selected radius (`0` = All stores) |
| Max Results | number | `10` | Max stores shown |
| Auto Detect Location | boolean | `true` | Use browser geolocation |
| Default Location | text | `Portland, OR` | Geocoded fallback when geolocation is unavailable |
| Services Filter | text/multiselect | defaults | Optional allowlist for filter chips |
| Experience Mode | select | `fast` | `fast` (lighter data) or `rich` (photos/reviews) |
| Radius Presets | text | `0,5,10,25,50` | Comma-separated radius options for selector |
| Units | select | `miles` | `miles` or `km` for display + radius filtering |
| No Results Message | text | default text | Custom empty-state message |
| Max Reviews Per Store | number | `5` | Max review cards shown in rich details |
| Map Style | select | `default` | `default`, `muted`, `minimal` (mapId-backed) |
| Primary CTA Label | text | `Get Directions` | CTA label on cards/info window |
| Store Card Density | select | `comfortable` | `comfortable` or `compact` spacing |
| Zoom Level | number | `11` | Optional legacy override |

> Row label parsing is tolerant, but keep labels close to the table above for consistency.

### Store rows (Place ID format)

Header row (required):

```
Places ID | Featured | Custom Services | Display Order | Override Name
```

Row example:

```
ChIJ... | true | pickup, deli, delivery | 1 | Downtown Market
```

**Field details:**
- **Places ID** (required): Google Place ID for the store.
- **Featured**: `true/false` (used for display and optional styling).
- **Custom Services**: Comma‑separated tags (used in filters).
- **Display Order**: Parsed, but **not applied** in sorting yet.
- **Override Name**: Overrides Google’s display name.

## Autocomplete behavior

- Uses Google Places Autocomplete when Maps JS is available.
- Falls back to Nominatim when Google is unavailable.
- Autocomplete initializes **after** Maps JS loads to avoid fallbacks.

## Open/closed status

Open status uses the store’s **local timezone**:
- Places `regularOpeningHours` + `utcOffsetMinutes`
- Computed in the browser so a UK user sees accurate California hours.

## What data comes from Places

When Place ID enrichment runs, the block requests:
- Name, address, location
- Phone, website
- Regular opening hours
- Rating + review count
- Photos + reviews (rich mode only; can be loaded lazily)
- `utcOffsetMinutes` for timezone‑correct status

## Performance mode (Phase 2)

- `Experience Mode = fast` loads lighter data first.
- Rich details (photos/reviews) are loaded on demand when a marker is opened.
- Place responses are cached in memory + session storage (TTL configurable).
- Enrichment requests are concurrency-limited to reduce API bursts.

## Troubleshooting

### Autocomplete fallback warning
- Ensure **Maps JS API** + **Places API (New)** are enabled.
- Confirm `Google Maps API Key` row is present.
- Check key restrictions allow your domain.

### Map not displaying
- Verify API key and API enablement.
- Check console for “Maps JS API error”.

### Open/closed looks wrong
- Confirm Places enrichment is running (Place IDs present).
- Ensure `utcOffsetMinutes` is returned (Places API enabled).

## Notes

- The map runs via **Maps JavaScript API**.
- Place details are fetched via **Places API (New)**.
- Directions links open Google Maps web URLs.
