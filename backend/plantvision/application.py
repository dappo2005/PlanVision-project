"""Application factory PlantVision.

File ini adalah peta utama backend: konfigurasi, layanan, keamanan, lalu route.
Logika bisnis berada pada modul route dan services agar urutan startup mudah dibaca.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from auth_security import Security
from request_security import RequestSecurity
from runtime_config import load_runtime_config
from plantvision import services


def create_app(config_overrides=None):
    """Buat dan rakit satu instance Flask PlantVision."""
    if os.getenv('PYTHON_DOTENV_DISABLED') != '1':
        load_dotenv(Path(__file__).resolve().parents[1] / '.env')

    config = load_runtime_config()
    if config_overrides:
        config.update(config_overrides)

    app = Flask(__name__)
    app.config.update(config)
    app.secret_key = app.config['SECRET_KEY']

    upload_folder = Path(__file__).resolve().parents[1] / 'uploads'
    upload_folder.mkdir(parents=True, exist_ok=True)
    app.config.setdefault('UPLOAD_FOLDER', str(upload_folder))

    if app.config['APP_ENV'] in {'development', 'test'}:
        CORS(app, resources={
            r'/api/*': {'origins': app.config['ALLOWED_ORIGINS']},
            r'/auth/*': {'origins': app.config['ALLOWED_ORIGINS']},
        })

    services.configure(app.config)

    # Import setelah configure() agar konstanta route berasal dari konfigurasi
    # tervalidasi, bukan langsung dari environment.
    from plantvision.routes.admin import bp as admin_bp
    from plantvision.routes.auth import bp as auth_bp
    from plantvision.routes.detection import bp as detection_bp
    from plantvision.routes.feedback import bp as feedback_bp
    from plantvision.routes.news import bp as news_bp
    from plantvision.routes.system import bp as system_bp

    for blueprint in (auth_bp, detection_bp, feedback_bp, admin_bp, news_bp, system_bp):
        app.register_blueprint(blueprint)

    security = Security(app, services)
    request_security = RequestSecurity(app)
    app.extensions['security'] = security
    app.extensions['request_security'] = request_security

    @app.errorhandler(413)
    def request_too_large(_error):
        return jsonify({'error': 'Ukuran upload melebihi batas'}), 413

    return app
