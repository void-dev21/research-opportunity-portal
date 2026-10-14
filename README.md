# University Research Opportunity Portal

**Course:** CN | **Program:** BS (AI 5A) | **Semester:** Fall-2026 | **Assignment #01**
**Name:** MUNAWAR_ALI | **Reg. No:** 24P_0621

**GitHub Repository:** https://github.com/void-dev21/research-opportunity-portal  <!-- TODO: replace with your real repo link -->

A web application where faculty members can post, view, update, and manage research opportunities in one place.

- **Backend:** Node.js + Express REST API
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5 (served by the backend)

## Project structure

```
research-opportunity-portal/
├── backend/
│   ├── server.js        # Express app + CRUD routes
│   ├── db.js            # MySQL connection pool (reads .env)
│   ├── validate.js      # Input validation
│   └── setupDb.js       # Optional helper to create DB/table
├── database/
│   └── schema.sql       # Database schema
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── postman/
│   └── Research_Opportunity_Portal.postman_collection.json
├── .env.example
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- MySQL 8+ running locally

## Setup and run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the database** (either option)
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   or, after step 3, `npm run setup-db`.

3. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your MySQL password:
   ```bash
   cp .env.example .env        # Windows: copy .env.example .env
   ```
   `.env` is git-ignored; never commit it.

4. **Start the server**
   ```bash
   npm start
   ```
   Open **http://localhost:3000** for the frontend. The API is at `http://localhost:3000/api/opportunities`.

## API

| Method | Endpoint | Description | Success |
|--------|----------|-------------|---------|
| POST   | `/api/opportunities`     | Create an opportunity | 201 |
| GET    | `/api/opportunities`     | List all opportunities | 200 |
| GET    | `/api/opportunities/:id` | Get one opportunity | 200 |
| PUT    | `/api/opportunities/:id` | Update (partial updates allowed, e.g. `{"status":"Closed"}`) | 200 |
| DELETE | `/api/opportunities/:id` | Delete an opportunity | 200 |

Error codes: `400` invalid/missing data or bad ID, `404` not found, `500` server error.

### Opportunity fields

| Field | Type | Rules |
|-------|------|-------|
| `id` | integer | auto-generated |
| `title` | string | required, max 200 |
| `description` | string | required |
| `research_area` | string | required |
| `faculty_name` | string | required |
| `department` | string | required |
| `required_skills` | string | required |
| `available_positions` | integer | required, 1–1000 |
| `deadline` | date `YYYY-MM-DD` | required |
| `status` | `Open` \| `Closed` | optional on create (default `Open`) |

Example:
```json
{
  "title": "Deep Learning for Medical Image Analysis",
  "description": "Develop CNN models to detect anomalies in chest X-rays.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch",
  "available_positions": 2,
  "deadline": "2026-12-15",
  "status": "Open"
}
```

## Testing with Postman

1. Import `postman/Research_Opportunity_Portal.postman_collection.json`.
2. Make sure the server is running (the `baseUrl` variable defaults to `http://localhost:3000`).
3. Run the collection in order using the **Collection Runner** (or send each request manually). It covers: creating 3 opportunities, get all, get one, update, close, delete, a 404 on the deleted item, and a 400 validation error. IDs are stored automatically in collection variables.

## Security note

No credentials are stored in the repository. Database settings are read from `.env`, which is listed in `.gitignore`.
