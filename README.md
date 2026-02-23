# Celestis-Website

A modern, animated website for the Celestis CanSat project built with Next.js, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- **Modern Design**: Clean and professional interface with a blue color scheme
- **Smooth Animations**: Powered by Framer Motion for engaging user experience
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Interactive Data Visualization**: View atmospheric data collected during missions

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ImJustMario/Celestis-Website.git
cd Celestis-Website
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

- `/app` - Next.js 14+ app directory with pages and layouts
- `/app/page.tsx` - Landing page with Hero, Team, Description, and Mission sections
- `/app/data/page.tsx` - Data visualization page
- `/app/globals.css` - Global styles with Tailwind CSS
- `/components` - Reusable React components (if added)

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React 19** - UI library

## Sections

### Landing Page
- **Hero**: Animated logo placeholder and mission tagline
- **Project Description**: Overview of the Celestis CanSat project
- **Mission Goals**: Four key objectives with icons and descriptions
- **Team**: Six team member roles

### Data Page
- Interactive metric selector (Temperature, Pressure, Humidity)
- Data table showing altitude vs selected metric
- Statistics cards for each metric
- Mission status dashboard

## Customization

### Logo
Replace the logo placeholder in `/app/page.tsx` with your actual Celestis logo image.

### Data
Update the sample data in `/app/data/page.tsx` with actual collected data from your CanSat missions.

### Colors
The blue color scheme can be customized in `/tailwind.config.js` under the `celestis-blue` color definitions.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
