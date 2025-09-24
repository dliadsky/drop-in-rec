# Toronto Drop-in Recreation Search

A web application that allows users to search for drop-in recreation services in Toronto by date, time of day, and location. The app fetches real-time data from the City of Toronto's open data portal.

## Features

- **Course Title Search**: Filter by specific recreation programs (e.g., "Lane Swim", "Basketball")
- **Date Picker**: Select a specific date to find programs running on that day
- **Time Picker**: Choose a time to find programs running at that time
- **Location Filter**: Search by specific recreation facilities
- **Real-time Data**: Fetches daily updates from Toronto's open data API
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Select a Program Type**: Choose from the dropdown of available course titles
2. **Pick a Date**: Use the date picker to select when you want to find programs
3. **Choose a Time**: Select a specific time to find programs running at that time
4. **Filter by Location**: Optionally select a specific location
5. **Search**: Click the "Search Programs" button to find matching results

## Example Usage

To find lane swim programs on Tuesday at 5pm:
1. Select "Lane Swim" from the Course Title dropdown
2. Pick any Tuesday from the date picker
3. Select "17:00" from the time picker
4. Click "Search Programs"

## Technical Details

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Data Source**: City of Toronto Open Data API
- **API Endpoint**: `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/`

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Data Structure

The application fetches data from two main resources:
- **Locations**: Recreation facility information
- **Drop-in Programs**: Schedule data including course titles, times, and locations

The data is updated daily by the City of Toronto.