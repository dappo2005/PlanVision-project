"""Entrypoint WSGI PlantVision.

Gunicorn, Waitress, Docker, dan script lokal tetap memakai ``app:app``.
Susunan aplikasi dapat dibaca di ``plantvision/application.py``.
"""
from plantvision.application import create_app
from plantvision import services


app = create_app()
security = app.extensions['security']
request_security = app.extensions['request_security']

# Alias kompatibilitas untuk script/test lama yang mengimpor backend.app.
mock_db = services.mock_db
get_db_connection = services.get_db_connection
MODEL = services.MODEL
np = services.np


if __name__ == '__main__':
    port = int(services.os.environ.get('PORT', 5000))
    app.run(debug=app.config['DEBUG'], host='127.0.0.1', port=port)
