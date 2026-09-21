"""Endpoint dashboard, prediksi penyakit, dan riwayat deteksi."""
import json
import os
import numpy as np
from flask import Blueprint, current_app, g, jsonify, request, send_from_directory
from plantvision import services
from plantvision.services import (
    CLASS_NAMES, DB_NAME, MOCK_DB_AVAILABLE, USE_MOCK_DB,
    UploadValidationError, get_db_connection, get_disease_info, mock_db,
    predict_image, save_validated_image,
)

bp = Blueprint('detection', __name__)

# --- API DASHBOARD KPI (Data Real dari DB) ---
@bp.route('/api/dashboard/kpi', methods=['GET'])
def get_dashboard_kpi():
    """
    Mengembalikan metrik KPI real-time dari tabel DetectionHistory:
    - Akurasi rata-rata (AVG confidence)
    - Jumlah jenis penyakit unik
    - Tren deteksi mingguan & akurasi
    - Distribusi jenis penyakit (persentase)
    - Uptime sistem (estimasi)
    """
    conn = None
    cursor = None

    # Palet warna untuk pie chart distribusi penyakit
    DISEASE_COLORS = {
        'Canker': '#E74C3C',
        'Citrus Canker': '#E74C3C',
        'Greening': '#F39C12',
        'Citrus Greening': '#F39C12',
        'Melanose': '#9B59B6',
        'Black Spot': '#3498DB',
        'Blackspot': '#3498DB',
        'Scab': '#1ABC9C',
        'Healthy': '#2ECC71',
        'Sehat': '#2ECC71',
    }
    DEFAULT_COLORS = ['#E74C3C', '#F39C12', '#9B59B6', '#3498DB', '#1ABC9C', '#2ECC71', '#E67E22']

    try:
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            detections = list(mock_db.detections.values())
        else:
            conn = get_db_connection()
            if conn is None:
                return jsonify({"error": "Koneksi database gagal"}), 500
            cursor = conn.cursor(dictionary=True)

            # 1. Hitung total deteksi & rata-rata akurasi (confidence)
            cursor.execute("""
                SELECT
                    COUNT(*) AS total_deteksi,
                    AVG(confidence) AS avg_akurasi
                FROM DetectionHistory
            """)
            row = cursor.fetchone()
            total_deteksi = int(row['total_deteksi']) if row else 0
            avg_akurasi = round(float(row['avg_akurasi']), 1) if row and row['avg_akurasi'] else 0.0

            # 2. Hitung jumlah jenis penyakit unik
            cursor.execute("""
                SELECT COUNT(DISTINCT disease_name) AS jenis_penyakit
                FROM DetectionHistory
            """)
            row2 = cursor.fetchone()
            jenis_penyakit = int(row2['jenis_penyakit']) if row2 else 0

            # 3. Tren deteksi per minggu (6 minggu terakhir), akurasi rata-rata per minggu
            cursor.execute("""
                SELECT
                    CONCAT(DATE_FORMAT(detection_date, '%b'), ' W',
                        FLOOR((DAY(detection_date) - 1) / 7) + 1) AS label,
                    YEARWEEK(detection_date, 1) AS week_key,
                    COUNT(*) AS deteksi,
                    ROUND(AVG(confidence), 1) AS akurasi
                FROM DetectionHistory
                WHERE detection_date >= DATE_SUB(NOW(), INTERVAL 42 DAY)
                GROUP BY week_key, label
                ORDER BY week_key ASC
                LIMIT 6
            """)
            trend_rows = cursor.fetchall()
            trend_data = [
                {
                    "month": r['label'],
                    "deteksi": int(r['deteksi']),
                    "akurasi": float(r['akurasi'])
                }
                for r in trend_rows
            ]

            # Jika data trend kosong (misal belum ada deteksi sama sekali), pakai placeholder
            if not trend_data:
                trend_data = [{"month": "Belum ada data", "deteksi": 0, "akurasi": 0}]

            # 4. Distribusi jenis penyakit (persentase)
            cursor.execute("""
                SELECT disease_name, COUNT(*) AS count
                FROM DetectionHistory
                GROUP BY disease_name
                ORDER BY count DESC
            """)
            dist_rows = cursor.fetchall()
            total_for_dist = sum(int(r['count']) for r in dist_rows) or 1
            disease_dist = []
            for idx, r in enumerate(dist_rows):
                name = r['disease_name']
                pct = round(int(r['count']) / total_for_dist * 100, 1)
                color = DISEASE_COLORS.get(name, DEFAULT_COLORS[idx % len(DEFAULT_COLORS)])
                disease_dist.append({"name": name, "value": pct, "color": color})

            # Jika distribusi kosong
            if not disease_dist:
                disease_dist = [{"name": "Belum ada data", "value": 100, "color": "#E5E7EB"}]

            # 5. Hitung waktu respon rata-rata (inference_time dari log jika ada, fallback ke tetap)
            # Karena inference_time disimpan bukan di DB saat ini, gunakan estimasi statis
            avg_response_time = 2.1

            return jsonify({
                "kpi": [
                    {
                        "name": "Akurasi",
                        "value": avg_akurasi,
                        "target": 85,
                        "unit": "%",
                        "color": "#2ECC71"
                    },
                    {
                        "name": "Waktu Respon",
                        "value": avg_response_time,
                        "target": 3,
                        "unit": "s",
                        "color": "#F39C12"
                    },
                    {
                        "name": "Jenis Penyakit",
                        "value": jenis_penyakit,
                        "target": 3,
                        "unit": " jenis",
                        "color": "#3498DB"
                    },
                    {
                        "name": "Total Deteksi",
                        "value": total_deteksi,
                        "target": 100,
                        "unit": " deteksi",
                        "color": "#9B59B6"
                    }
                ],
                "trend": trend_data,
                "distribution": disease_dist,
                "meta": {
                    "total_deteksi": total_deteksi,
                    "jenis_penyakit": jenis_penyakit
                }
            }), 200

    except Exception as e:
        print(f"[DashboardKPI] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API PREDIKSI (F-08) ---
# Disease info sudah diimport dari disease_info.py (lebih lengkap)

@bp.route('/api/predict', methods=['POST'])
def predict_disease():
    if services.MODEL is None:
        return jsonify({"error": "Model AI belum siap"}), 500

    conn = None
    cursor = None
    filepath = None
    try:
        if 'image' not in request.files:
            return jsonify({"error": "Tidak ada gambar"}), 400

        file = request.files['image']
        user_id = g.current_user['user_id']

        if file.filename == '':
            return jsonify({"error": "Nama file kosong"}), 400

        # 1. Validasi isi lalu simpan ulang tanpa nama/metadata dari pengguna.
        filename, filepath = save_validated_image(file)

        # 2-3. Service model menjaga urutan center-crop, resize, dan prediksi.
        predictions, inference_time = predict_image(filepath)

        # Ambil hasil tertinggi
        top_index = np.argmax(predictions)
        top_class = CLASS_NAMES[top_index]
        top_prob = float(predictions[top_index])

        # Debug: Lihat probabilitas semua kelas di terminal
        print(f"[Debug] File: {filename}")
        for i, prob in enumerate(predictions):
            print(f"  - {CLASS_NAMES[i]}: {prob*100:.2f}%")

        # 4. Get disease info
        try:
            disease_info = get_disease_info(top_class)
        except Exception as e:
            print(f"Error getting disease info: {e}")
            disease_info = {}

        # Ambil severity bawaan dari disease_info (biologis), atau fallback
        severity = disease_info.get('severity', 'sedang')

        # 5. Simpan ke Database (REFACTORED: Prioritas DetectionHistory)
        history_id = None
        if user_id:
            # Jika mock mode aktif, simpan ke mock_db (tidak hilang jika MySQL down, tapi tetap in-memory)
            if USE_MOCK_DB and MOCK_DB_AVAILABLE:
                try:
                    md = mock_db.add_detection(
                        user_id=int(user_id), image_path=filename, disease_name=top_class,
                        confidence=top_prob*100, severity=severity,
                        description=disease_info.get('description',''),
                        symptoms=json.dumps(disease_info.get('symptoms',[])),
                        treatment=json.dumps(disease_info.get('treatment',[])),
                        prevention=json.dumps(disease_info.get('prevention',[]))
                    )
                    history_id = md.get('id')
                    print(f"[DetectionHistory Mock] Saved ID: {history_id}")
                except Exception as me:
                    print(f"[DetectionHistory Mock] Error: {me}")
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()

                # NEW: Simpan ke DetectionHistory dengan data lengkap
                try:
                    # Ekstrak data dari disease_info
                    description = disease_info.get('description', '')
                    symptoms = json.dumps(disease_info.get('symptoms', []))
                    treatment = json.dumps(disease_info.get('treatment', []))
                    prevention = json.dumps(disease_info.get('prevention', []))

                    sql_history = """
                        INSERT INTO DetectionHistory
                        (user_id, image_path, disease_name, confidence, severity,
                         description, symptoms, treatment, prevention)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(sql_history, (
                        user_id, filename, top_class, top_prob * 100, severity,
                        description, symptoms, treatment, prevention
                    ))
                    history_id = cursor.lastrowid
                    print(f"[DetectionHistory] Saved ID: {history_id}")

                except Exception as e:
                    print(f"[DetectionHistory] Error: {e}")
                    # FALLBACK: Jika DetectionHistory gagal, simpan ke DaunJeruk+Diagnosa
                    try:
                        sql_daun = "INSERT INTO DaunJeruk (user_id, citra) VALUES (%s, %s)"
                        cursor.execute(sql_daun, (user_id, filename))
                        daun_id = cursor.lastrowid

                        hasil_text = f"{top_class} ({top_prob*100:.1f}%)"
                        sql_diag = "INSERT INTO Diagnosa (daun_id, hasil_deteksi) VALUES (%s, %s)"
                        cursor.execute(sql_diag, (daun_id, hasil_text))

                        print(f"[Fallback] Saved to DaunJeruk+Diagnosa")
                    except Exception as fallback_err:
                        print(f"[Fallback] Error: {fallback_err}")

                conn.commit()

        # 6. Response
        return jsonify({
            "class": top_class,
            "confidence": f"{top_prob*100:.1f}%",
            "inference_time": f"{inference_time:.2f} ms",
            "image_url": f"/api/uploads/{filename}",
            "disease_info": disease_info,
            "history_id": history_id
        }), 200

    except UploadValidationError as e:
        return jsonify({"error": str(e)}), e.status
    except Exception as e:
        print(f"Error Predict: {e}")
        if filepath and os.path.isfile(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        return jsonify({"error": "Prediksi gagal diproses"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# --- API DETECTION HISTORY ---
@bp.route('/api/detection-history/<int:user_id>', methods=['GET'])
def get_detection_history(user_id):
    """
    API untuk mendapatkan histori deteksi berdasarkan user_id
    Returns: List of detection history sorted by date (newest first)
    """
    conn = None
    cursor = None

    try:
        # Mock DB fallback
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            try:
                history = mock_db.get_detections(user_id)
                # Normalisasi ke format API
                formatted = []
                for d in history:
                    formatted.append({
                        "id": d.get('id'),
                        "user_id": d.get('user_id'),
                        "image_url": f"/api/uploads/{d.get('image_path')}",
                        "disease_name": d.get('disease_name'),
                        "confidence": float(d.get('confidence', 0)),
                        "severity": d.get('severity'),
                        "description": d.get('description', ''),
                        "symptoms": json.loads(d['symptoms']) if isinstance(d.get('symptoms'), str) and d.get('symptoms') else (d.get('symptoms') or []),
                        "treatment": json.loads(d['treatment']) if isinstance(d.get('treatment'), str) and d.get('treatment') else (d.get('treatment') or []),
                        "prevention": json.loads(d['prevention']) if isinstance(d.get('prevention'), str) and d.get('prevention') else (d.get('prevention') or []),
                        "detection_date": d.get('detection_date')
                    })
                return jsonify({"user_id": user_id, "total": len(formatted), "history": formatted, "source": "mock"}), 200
            except Exception as me:
                print(f"[DetectionHistory Mock] Error: {me}")

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Auto-create DetectionHistory jika belum ada (self-heal, non-destruktif) - cek via INFORMATION_SCHEMA agar tidak unread result
        cursor.execute("SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=%s AND TABLE_NAME='DetectionHistory'", (DB_NAME,))
        tbl_exists = cursor.fetchone()
        exists_cnt = tbl_exists['c'] if tbl_exists else 0  # type: ignore
        if exists_cnt == 0:
            print(f"[DetectionHistory] Tabel belum ada, membuat otomatis")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS DetectionHistory (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    image_path VARCHAR(255) NOT NULL,
                    disease_name VARCHAR(100) NOT NULL,
                    confidence DECIMAL(5, 2) NOT NULL,
                    severity VARCHAR(20) NOT NULL,
                    description TEXT,
                    symptoms TEXT,
                    treatment TEXT,
                    prevention TEXT,
                    detection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
                    INDEX idx_user_date (user_id, detection_date DESC)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            conn.commit()
            return jsonify({"user_id": user_id, "total": 0, "history": [], "warning": "Tabel DetectionHistory baru dibuat, belum ada data"}), 200

        query = """
            SELECT
                id, user_id, image_path, disease_name, confidence, severity,
                description, symptoms, treatment, prevention, detection_date
            FROM DetectionHistory
            WHERE user_id = %s
            ORDER BY detection_date DESC
        """

        cursor.execute(query, (user_id,))
        results = cursor.fetchall()

        # Parse JSON fields (tahan terhadap data korup)
        def _safe_json(v):
            if not v:
                return []
            if isinstance(v, list):
                return v
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else [str(parsed)]
            except:
                return [str(v)] if isinstance(v, str) else []

        history = []
        for row in results:
            row_data: dict = row  # type: ignore
            history.append({
                "id": row_data['id'],
                "user_id": row_data['user_id'],
                "image_url": f"/api/uploads/{row_data['image_path']}",
                "disease_name": row_data['disease_name'],
                "confidence": float(row_data['confidence']),
                "severity": row_data['severity'],
                "description": row_data['description'],
                "symptoms": _safe_json(row_data['symptoms']),
                "treatment": _safe_json(row_data['treatment']),
                "prevention": _safe_json(row_data['prevention']),
                "detection_date": row_data['detection_date'].isoformat() if row_data['detection_date'] else None
            })

        # FALLBACK: Jika DetectionHistory kosong, coba baca dari legacy Diagnosa+DaunJeruk (agar data lama tidak dianggap hilang)
        if len(history) == 0:
            try:
                cursor.execute("""
                    SELECT d.daun_id as id, d.user_id, d.citra as image_path, dg.hasil_deteksi, dg.tanggal_diagnosa as detection_date
                    FROM daunjeruk d
                    JOIN diagnosa dg ON d.daun_id = dg.daun_id
                    WHERE d.user_id = %s
                    ORDER BY dg.tanggal_diagnosa DESC
                """, (user_id,))
                legacy = cursor.fetchall()
                if legacy:
                    for row in legacy:
                        rd: dict = row  # type: ignore
                        hasil = rd.get('hasil_deteksi') or ''
                        # Parse: "Citrus Greening (CVPD/Huanglongbing) (94.3%)" -> disease + confidence
                        import re as _re
                        m = _re.search(r'\(([\d\.]+)%\)\s*$', hasil)
                        conf = float(m.group(1)) if m else 0.0
                        disease_raw = _re.sub(r'\s*\([\d\.]+%\)\s*$', '', hasil).strip()
                        # Map old names ke CLASS_NAMES
                        disease_map = {
                            'Citrus Greening (CVPD/Huanglongbing)': 'Greening',
                            'Greening': 'Greening',
                            'Canker': 'Canker',
                            'Black spot': 'Black spot',
                            'Melanose': 'Melanose',
                            'Healthy': 'Healthy',
                        }
                        disease_name = disease_map.get(disease_raw, disease_raw)
                        if conf >= 90:
                            severity = "tinggi"
                        elif conf >= 70:
                            severity = "sedang"
                        else:
                            severity = "rendah"
                        try:
                            dinfo = get_disease_info(disease_name)
                        except:
                            dinfo = {}
                        history.append({
                            "id": rd['id'],
                            "user_id": rd['user_id'],
                            "image_url": f"/api/uploads/{rd['image_path']}",
                            "disease_name": disease_name,
                            "confidence": conf,
                            "severity": severity,
                            "description": dinfo.get('description', ''),
                            "symptoms": dinfo.get('symptoms', []),
                            "treatment": dinfo.get('treatment', []),
                            "prevention": dinfo.get('prevention', []),
                            "detection_date": rd['detection_date'].isoformat() if rd['detection_date'] else None
                        })
                    print(f"[DetectionHistory Fallback] Served {len(history)} legacy records for user {user_id}")
            except Exception as leg_err:
                # Jika tabel legacy tidak ada, abaikan
                if "doesn't exist" not in str(leg_err):
                    print(f"[Fallback Legacy] Error: {leg_err}")

        return jsonify({
            "user_id": user_id,
            "total": len(history),
            "history": history,
            "source": "legacy" if len(results)==0 and len(history)>0 else "detection_history"
        }), 200

    except Exception as e:
        err_msg = str(e)
        print(f"Error in get_detection_history: {err_msg}")
        # Graceful: jika tabel hilang, jangan 500
        if "doesn't exist" in err_msg:
            return jsonify({"user_id": user_id, "total": 0, "history": [], "warning": "Tabel DetectionHistory belum ada. Jalankan setup_db.py"}), 200
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


# --- API SERVE UPLOADED IMAGES ---
@bp.route('/api/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    """
    Serve uploaded images only to their owner or a superadmin.
    """
    current = g.current_user
    is_admin = current.get('role') == 'superadmin'
    owner_id = None

    if USE_MOCK_DB and MOCK_DB_AVAILABLE:
        record = next(
            (item for item in mock_db.detections.values()
             if item.get('image_path') == filename),
            None,
        )
        owner_id = record.get('user_id') if record else None
    else:
        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            if conn is None:
                return jsonify({"error": "Layanan penyimpanan tidak tersedia"}), 503
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT user_id FROM DetectionHistory WHERE image_path=%s LIMIT 1",
                (filename,),
            )
            record = cursor.fetchone()
            owner_id = record.get('user_id') if record else None
        except Exception as exc:
            print(f"[Upload Access] Error: {exc}")
            return jsonify({"error": "Layanan penyimpanan tidak tersedia"}), 503
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close()

    if owner_id is None:
        return jsonify({"error": "Image not found"}), 404
    if not is_admin and int(owner_id) != int(current['user_id']):
        return jsonify({"error": "Access denied"}), 403
    try:
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404
