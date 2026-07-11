# Stage 1: Build the frontend client
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install

# Copy the rest of the client code and build
COPY client/ ./
# Vite config sets outDir to '../gui', so this will output to /app/gui
RUN npm run build


# Stage 2: Build the backend and serve the application
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

# Set up the Python environment using uv
COPY server/pyproject.toml server/uv.lock ./server/
WORKDIR /app/server
RUN uv sync --frozen --no-dev

# Copy the server code
COPY server/ ./

# Copy the built frontend from the previous stage
# The python server expects the 'gui' directory to be at the root of its working directory
COPY --from=frontend-builder /app/gui /app/gui

# Ensure the virtual environment is in the PATH
ENV PATH="/app/server/.venv/bin:$PATH"

# Set working directory to the project root so 'server.main' can be imported
WORKDIR /app

# Expose the port the app runs on
EXPOSE 8000

# Start the application
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
