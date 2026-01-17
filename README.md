# XpenseAI

XpenseAI is a full-stack expense tracking application with AI-powered receipt scanning and intelligent categorization. It combines a Spring Boot backend with a React frontend to provide secure budgeting, expense management, and rich visual insights.

## Features

- AI-powered receipt scanning using Tesseract.js OCR
- Automatic extraction of line items, totals, and merchant information
- Category prediction and description cleanup using OpenAI GPT-4 API
- Secure user authentication and authorization with JWT
- Budget creation, updates, and history tracking
- Expense CRUD operations with category and budget linkage
- Interactive dashboard with Recharts visualizations for:
  - Monthly/period budget vs. actual
  - Category breakdowns
  - Trends over time

## Tech Stack

- **Frontend**: React, JavaScript, Create React App, Recharts
- **Backend**: Spring Boot, Spring Security, Spring Data JPA (Hibernate)
- **Database**: (Configurable via Spring, e.g. PostgreSQL/MySQL/H2)
- **Auth**: JWT-based authentication
- **AI / OCR**: Tesseract.js for OCR, OpenAI GPT-4 API for categorization

## Architecture

- `frontend/`: React SPA that handles authentication, dashboard, expense & budget screens, and receipt scanning UI.
- `backend/`: Spring Boot REST API providing authentication, budget, and expense endpoints.
  - `auth/`: login, registration, JWT token issuing
  - `budget/`: budget entities, history tracking, controllers & services
  - `expense/`: expense entities, controllers & services
  - `config/`: Spring Security, JWT filter, and application configuration

The frontend communicates with the backend via JSON REST endpoints and stores the JWT token client-side for authenticated requests.

## Getting Started

### Prerequisites

- Node.js (LTS)
- Java 17+
- Maven
- An OpenAI API key (for GPT-4 categorization)

### Backend Setup (Spring Boot)

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Configure database and OpenAI API settings in `src/main/resources/application.yml`.
   - Set your datasource (or use the existing one)
   - Add your OpenAI API key if used server-side
3. Run the backend:
   ```bash
   ./mvnw spring-boot:run
   ```
4. The API will typically be available at `http://localhost:8080`.

### Frontend Setup (React)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (e.g. `REACT_APP_API_BASE_URL`, OpenAI key if used client-side) in a `.env` file.
4. Start the development server:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000` in your browser.

## Key Modules

- **Authentication**
  - JWT-based login and registration (`auth/` in backend)
  - React auth forms and token storage (`src/components/auth` and `src/services/authService.js`)
- **Budget Management**
  - Budget entities, repositories, services, and controllers in the backend
  - React components for budget creation, listing, and history (`src/components/budget`)
- **Expense Tracking**
  - Expense entities and REST endpoints in the backend
  - React forms and lists for managing expenses (`src/components/expense`)
- **Receipt Scanning & AI Categorization**
  - Tesseract.js integration for OCR (`src/components/scanner/ScanReceipt.js`)
  - OpenAI GPT-4 API calls for categorizing and cleaning extracted text (`src/services/aiService.js`)

## Running Tests

- **Frontend**: from `frontend/`:
  ```bash
  npm test
  ```
- **Backend**: from `backend/`:
  ```bash
  ./mvnw test
  ```

## Future Improvements

- More granular spending insights and anomaly detection
- Shared budgets and multi-user households
- Export to CSV/Excel and integration with bank APIs

## License

This project is for personal/educational use and is not licensed for commercial distribution.
