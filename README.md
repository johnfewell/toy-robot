# Toy Robot Simulator

Monorepo with Angular frontend and NestJS backend.

## Setup

```bash
cd toy-robot-frontend && npm install
cd ../toy-robot-backend && npm install
```

## Run

```bash
# Frontend: http://localhost:4200
cd toy-robot-frontend && npm start

# Backend: http://localhost:3000
cd toy-robot-backend && npm run start:dev
```

## Deviations from the original requirements

I used the robot emoji for the robot icon since it's a common representation of a robot and I didn't want to spend time on a custom SVG.

## Testing improvements

Could have added integration tests between frontend/backend, visual component tests, and edge case coverage for boundary conditions.
