FROM python:3.11

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
