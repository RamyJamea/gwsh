FROM python:3.13-slim

WORKDIR /monoapp

RUN pip install --no-cache-dir uv

# Copy dependency files first (better layer caching)
COPY server/pyproject.toml server/uv.lock ./server/

# Install dependencies
WORKDIR /monoapp/server
RUN uv sync --frozen --no-dev

# Copy application code
WORKDIR /monoapp
COPY server ./server
COPY gui ./gui

ENV VIRTUAL_ENV="/monoapp/server/.venv"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Run app
EXPOSE 8000
CMD ["python", "-m", "server.main"]