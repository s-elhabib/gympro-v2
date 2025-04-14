# Gym Management System

A modern, full-featured gym management system built with React, Supabase, and TypeScript. This application helps gym owners and staff manage members, track attendance, process payments, and monitor overall gym performance.

![Gym Management Dashboard](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200)

## Features

- 🏃‍♂️ Member Management
- 💰 Payment Processing & Tracking
- 📊 Attendance Monitoring
- 📈 Analytics Dashboard
- 👥 Staff Management
- 📱 Responsive Design
- 🔐 Role-based Access Control
- 📅 Class Scheduling

## Tech Stack

- Frontend:

  - React 18
  - TypeScript
  - Tailwind CSS
  - Lucide Icons
  - Chart.js
  - React Hook Form
  - Zod Validation
  - Radix UI Components

- Backend:
  - Supabase (PostgreSQL)
  - Row Level Security
  - Real-time Subscriptions

## Prerequisites

Before you begin, ensure you have installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)

## Local Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/gym-management-spa.git
   cd gym-management-spa
   ```

2. Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Create a `docker-compose.yml` file:

   ```yaml
   version: "3.8"
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "5173:5173"
       volumes:
         - .:/app
         - /app/node_modules
       environment:
         - NODE_ENV=development
         - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
         - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
       command: npm run dev
   ```

4. Create a `Dockerfile`:

   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   # Copy package files
   COPY package*.json ./

   # Install dependencies
   RUN npm install

   # Copy project files
   COPY . .

   # Expose port
   EXPOSE 5173

   # Start development server
   CMD ["npm", "run", "dev"]
   ```

5. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

The application will be available at `http://localhost:5173`

## Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Run the database migrations:

   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your-project-ref

   # Run migrations
   supabase db push
   ```

3. (Optional) Seed the database with sample data:
   ```bash
   supabase db reset
   ```

## Development Workflow

1. Start the development server:

   ```bash
   docker-compose up
   ```

2. Make your changes and see them live-reload

3. Run tests:

   ```bash
   docker-compose exec app npm test
   ```

4. Build for production:
   ```bash
   docker-compose exec app npm run build
   ```

## Environment Variables

Required environment variables:

| Variable               | Description                 |
| ---------------------- | --------------------------- |
| VITE_SUPABASE_URL      | Your Supabase project URL   |
| VITE_SUPABASE_ANON_KEY | Your Supabase anonymous key |

## Project Structure

```
gym-management-spa/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/       # React context providers
│   ├── lib/           # Utility functions and configurations
│   ├── pages/         # Page components
│   └── types/         # TypeScript type definitions
├── supabase/
│   └── migrations/    # Database migrations
├── public/           # Static assets
└── docker-compose.yml
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Deployment to Vercel

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. Your project pushed to a GitHub repository

### Steps

1. Connect your GitHub repository to Vercel:

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Select your GitHub repository

2. Configure the project:

   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. Add Environment Variables:

   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. Click "Deploy"

### Troubleshooting

If you encounter routing issues, make sure the `vercel.json` file is properly configured with the following content:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or join our Slack channel.
