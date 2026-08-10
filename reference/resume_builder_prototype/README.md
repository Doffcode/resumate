# NIT Trichy Resume Builder & Editor

An interactive, premium web application built with **React** and **Vite** designed to manage your resume data and generate a pixel-perfect, two-page A4 PDF matching the strict NIT Trichy placement format.

---

## Features
- **Accurate Heading Layouts**: Section red lines are visually aligned and centered relative to uppercase titles without wrapping.
- **Consistent Right-Aligned Dates**: Dates align perfectly on the same line as the items, preventing word wrapping.
- **Split Page Footer**: Pushed to the bottom of both pages with a blue-bordered split design.
- **Interactive Editing Sidebar**: Customize header details, upload custom logos/photos, modify qualifications rows, and add/delete/reorder internships, projects, and positions.
- **Automatic Auto-Save**: Your edits are preserved in browser `localStorage` so they survive page refreshes.
- **Text Scale Adjustment**: Change the font size (and spacing) of the entire resume proportionally from the sidebar settings.

---

## How to Install and Run

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher) and `npm` installed.

### Steps
1. **Unzip the Project**: Extract the folder `resume_builder.zip` to a location of your choice.
2. **Open Terminal**: Navigate into the extracted directory:
   ```bash
   cd resume_builder
   ```
3. **Install Dependencies**: Run the npm installation command to install React and Vite packages:
   ```bash
   npm install
   ```
4. **Start Development Server**: Spin up the local Vite server:
   ```bash
   npm run dev
   ```
5. **Open in Browser**: Open your browser and navigate to:
   **[http://localhost:5173/](http://localhost:5173/)**

---

## Production Build
To build and bundle the optimized static assets for production deployment:
```bash
npm run build
```
This generates the HTML, CSS, and JS bundles inside the `dist/` directory.

---

## How to Export a Perfect PDF
To export your formatted resume directly to a pixel-perfect PDF:
1. Open the application in your browser (`http://localhost:5173/`).
2. Click the blue **Export to PDF** button in the header (or press `Ctrl + P`).
3. In the browser print dialog, configure the following settings:
   - **Destination**: Save as PDF
   - **Pages**: All
   - **Layout**: Portrait
   - **Paper Size**: **A4**
   - **Margins**: **None** (crucial, as the stylesheet implements the exact margin boundaries)
   - **Options**: Enable **Background graphics** (crucial, to print the red/blue lines and table background colors)
4. Click **Save** to generate your PDF.
