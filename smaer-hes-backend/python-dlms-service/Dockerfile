FROM python:3.9-slim

LABEL maintainer="New Hampshire Capital HES Team"
LABEL description="Python DLMS Communication Service for Smart HES"

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY .env.example .env

# Create non-root user
RUN useradd -m -u 1000 dlmsuser && \
    chown -R dlmsuser:dlmsuser /app

USER dlmsuser

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/health')"

# Run the application
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
