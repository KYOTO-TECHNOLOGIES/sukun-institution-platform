FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home --uid 10001 sukun
COPY --chown=sukun:sukun . .
RUN mkdir -p media staticfiles && chown -R sukun:sukun media staticfiles
USER sukun
EXPOSE 8000
CMD ["gunicorn", "sukun_lms.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-"]
