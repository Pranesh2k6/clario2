# Clario Analytics Engine — Python FastAPI
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY analytics/ ./analytics/
COPY training_data/ ./training_data/

# Expose FastAPI port
EXPOSE 8000

# Run the API
CMD ["python", "-m", "analytics.api"]
