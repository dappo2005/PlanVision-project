"""Endpoint administrasi pengguna, statistik, deteksi, dan aktivitas."""
import json

import bcrypt
from flask import Blueprint, jsonify, request

from plantvision.services import get_db_connection

bp = Blueprint('admin', __name__)

# ===================================================================
# ADMIN USER MANAGEMENT API
# ===================================================================

@bp.route('/api/admin/users/stats', methods=['GET'])
def get_users_stats():
    """
    API untuk mendapatkan statistik user
    Returns: {total, active, by_role}
    """
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Total users
        cursor.execute("SELECT COUNT(*) as total FROM User")
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore

        # Active users (status_akun = 'aktif')
        cursor.execute("SELECT COUNT(*) as active FROM User WHERE status_akun = 'aktif'")
        active_result = cursor.fetchone()
        active: int = active_result['active'] if active_result else 0  # type: ignore

        # By role
        cursor.execute("SELECT role, COUNT(*) as count FROM User GROUP BY role")
        by_role = {row['role']: row['count'] for row in cursor.fetchall()}  # type: ignore

        return jsonify({
            "total": total,
            "active": active,
            "by_role": by_role
        }), 200

    except Exception as e:
        print(f"[Users Stats] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """
    API untuk mendapatkan semua user dengan pagination dan filter
    Query params: ?page=1&limit=20&search=keyword&role=user&status=aktif
    Returns: {total, page, limit, users[]}
    """
    conn = None
    cursor = None

    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role', None)
        status_filter = request.args.get('status', None)

        offset = (page - 1) * limit

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Build query with filters
        where_clauses = []
        params = []

        if search:
            where_clauses.append("(nama LIKE %s OR email LIKE %s OR username LIKE %s)")
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern, search_pattern])

        if role_filter:
            where_clauses.append("role = %s")
            params.append(role_filter)

        if status_filter:
            where_clauses.append("status_akun = %s")
            params.append(status_filter)

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Count total
        count_query = f"SELECT COUNT(*) as total FROM User {where_sql}"
        cursor.execute(count_query, params)
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore

        # Get users
        query = f"""
            SELECT
                user_id, nama, email, username, phone, role, status_akun,
                tanggal_daftar as created_at
            FROM User
            {where_sql}
            ORDER BY tanggal_daftar DESC
            LIMIT %s OFFSET %s
        """

        cursor.execute(query, params + [limit, offset])
        users = cursor.fetchall()

        # Format response
        result = []
        for user in users:
            user_data: dict = user  # type: ignore
            result.append({
                "user_id": user_data['user_id'],
                "nama": user_data['nama'],
                "email": user_data['email'],
                "username": user_data['username'],
                "phone": user_data['phone'],
                "role": user_data['role'],
                "status": user_data['status_akun'],
                "created_at": user_data['created_at'].isoformat() if user_data['created_at'] else None
            })

        return jsonify({
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit,
            "users": result
        }), 200

    except Exception as e:
        print(f"[Get Users] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/admin/users', methods=['POST'])
def create_user_by_admin():
    """API untuk admin membuat user baru"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        nama = data.get('nama', '').strip()
        email = data.get('email', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        phone = data.get('phone', None)
        role = data.get('role', 'user')
        status_akun = data.get('status', 'aktif')

        if not nama or not email or not username or not password:
            return jsonify({"error": "Nama, email, username, dan password wajib diisi"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        # Check existing email / username
        cursor.execute("SELECT user_id FROM User WHERE email = %s OR username = %s", (email, username))
        if cursor.fetchone():
            return jsonify({"error": "Email atau username sudah terdaftar"}), 400

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        query = """
            INSERT INTO User (nama, email, username, phone, password, role, status_akun, accept_terms)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
        """
        cursor.execute(query, (nama, email, username, phone, hashed_password, role, status_akun))
        conn.commit()

        new_id = cursor.lastrowid
        return jsonify({"message": "User berhasil dibuat", "user_id": new_id}), 201

    except Exception as e:
        print(f"[Create User Admin] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/admin/users/<int:target_id>', methods=['PUT'])
def update_user_by_admin(target_id):
    """API untuk admin mengubah data user"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        nama = data.get('nama', '').strip()
        email = data.get('email', '').strip()
        username = data.get('username', '').strip()
        phone = data.get('phone', None)
        role = data.get('role', 'user')
        status_akun = data.get('status', 'aktif')

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT user_id FROM User WHERE user_id = %s", (target_id,))
        if not cursor.fetchone():
            return jsonify({"error": "User tidak ditemukan"}), 404

        query = """
            UPDATE User
            SET nama = %s, email = %s, username = %s, phone = %s, role = %s, status_akun = %s
            WHERE user_id = %s
        """
        cursor.execute(query, (nama, email, username, phone, role, status_akun, target_id))
        conn.commit()

        return jsonify({"message": "Data user berhasil diperbarui"}), 200

    except Exception as e:
        print(f"[Update User Admin] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/admin/users/<int:target_id>', methods=['DELETE'])
def delete_user_by_admin(target_id):
    """API untuk admin menghapus user"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT user_id, role FROM User WHERE user_id = %s", (target_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User tidak ditemukan"}), 404

        cursor.execute("DELETE FROM User WHERE user_id = %s", (target_id,))
        conn.commit()

        return jsonify({"message": "User berhasil dihapus"}), 200

    except Exception as e:
        print(f"[Delete User Admin] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()



@bp.route('/api/admin/detections/stats', methods=['GET'])
def get_detections_stats():
    """
    API untuk mendapatkan statistik deteksi
    Primary: DetectionHistory, fallback ke Diagnosa (legacy) jika tabel belum ada
    Returns: {total, by_disease, recent_count}
    """
    conn = None
    cursor = None

    def _query_count(table: str, where_clause: str = "") -> int:
        try:
            q = f"SELECT COUNT(*) as cnt FROM {table} {where_clause}"
            cursor.execute(q)
            r = cursor.fetchone()
            return int(r['cnt']) if r and 'cnt' in r else 0  # type: ignore
        except Exception as ex:
            # Tabel tidak ada atau kolom berbeda -> 0
            if "doesn't exist" in str(ex) or "Unknown column" in str(ex):
                return -1
            raise

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Primary: DetectionHistory
        total = _query_count("DetectionHistory")
        recent = _query_count("DetectionHistory", "WHERE detection_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
        by_disease = {}
        try:
            if total != -1:
                cursor.execute("SELECT disease_name, COUNT(*) as cnt FROM DetectionHistory GROUP BY disease_name")
                by_disease = {row['disease_name']: row['cnt'] for row in cursor.fetchall()}  # type: ignore
        except Exception:
            by_disease = {}

        # Fallback ke Diagnosa jika DetectionHistory belum ada / kosong dan Diagnosa ada
        if total == -1:
            total = _query_count("Diagnosa")
            recent = _query_count("Diagnosa", "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
            if total == -1:
                total = 0
            if recent == -1:
                recent = 0
        else:
            # Jika DetectionHistory ada, tambahkan count legacy Diagnosa sebagai info tambahan (tidak double hitung primary)
            legacy_total = _query_count("Diagnosa")
            if legacy_total > 0:
                # Simpan sebagai field terpisah agar tidak membingungkan
                by_disease["_legacy_Diagnosa"] = legacy_total

        if total == -1:
            total = 0
        if recent == -1:
            recent = 0

        return jsonify({
            "total": total,
            "recent_count": recent,
            "by_disease": by_disease
        }), 200

    except Exception as e:
        print(f"[Detections Stats] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# ===================================================================
# NEWS API (Berita/Artikel)
# ===================================================================

@bp.route('/api/admin/news/stats', methods=['GET'])
def get_news_stats():
    """
    API untuk mendapatkan statistik berita
    Returns: {total, published, draft, by_category}
    """
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Total news
        cursor.execute("SELECT COUNT(*) as total FROM News")
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore

        # Published news
        cursor.execute("SELECT COUNT(*) as published FROM News WHERE is_published = 1")
        published_result = cursor.fetchone()
        published: int = published_result['published'] if published_result else 0  # type: ignore

        # Draft news
        cursor.execute("SELECT COUNT(*) as draft FROM News WHERE is_published = 0")
        draft_result = cursor.fetchone()
        draft: int = draft_result['draft'] if draft_result else 0  # type: ignore

        # By category
        cursor.execute("SELECT category, COUNT(*) as count FROM News GROUP BY category")
        by_category = {row['category']: row['count'] for row in cursor.fetchall()}  # type: ignore

        return jsonify({
            "total": total,
            "published": published,
            "draft": draft,
            "by_category": by_category
        }), 200

    except Exception as e:
        print(f"[News Stats] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/admin/detections', methods=['GET'])
def get_admin_all_detections():
    """
    API untuk Superadmin: Mengambil SEMUA riwayat deteksi dari seluruh pengguna.
    Dilengkapi JOIN ke tabel User untuk mendapatkan nama & email pengunggah.
    Mendukung filter: severity, disease, search (nama/email/penyakit), page, limit.
    Returns: { detections: [...], total, page, total_pages, stats }
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        # Query params
        severity_filter = request.args.get('severity', '').strip().lower()
        disease_filter = request.args.get('disease', '').strip()
        search_query = request.args.get('search', '').strip()
        page = max(1, int(request.args.get('page', 1)))
        limit = min(50, max(1, int(request.args.get('limit', 20))))
        offset = (page - 1) * limit

        # Build WHERE clauses
        conditions = []
        params = []

        if severity_filter and severity_filter != 'all':
            conditions.append("dh.severity = %s")
            params.append(severity_filter)

        if disease_filter and disease_filter.lower() != 'all':
            conditions.append("dh.disease_name = %s")
            params.append(disease_filter)

        if search_query:
            conditions.append("(u.nama LIKE %s OR u.email LIKE %s OR dh.disease_name LIKE %s)")
            like_val = f"%{search_query}%"
            params.extend([like_val, like_val, like_val])

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        # Count total
        count_q = f"""
            SELECT COUNT(*) as total
            FROM DetectionHistory dh
            LEFT JOIN User u ON dh.user_id = u.user_id
            {where_clause}
        """
        cursor.execute(count_q, params)
        count_row = cursor.fetchone()
        total = count_row['total'] if count_row else 0  # type: ignore
        total_pages = max(1, (total + limit - 1) // limit)

        # Main query with JOIN
        main_q = f"""
            SELECT
                dh.id,
                dh.user_id,
                u.nama AS user_nama,
                u.email AS user_email,
                dh.image_path,
                dh.disease_name,
                dh.confidence,
                dh.severity,
                dh.description,
                dh.symptoms,
                dh.treatment,
                dh.prevention,
                dh.detection_date
            FROM DetectionHistory dh
            LEFT JOIN User u ON dh.user_id = u.user_id
            {where_clause}
            ORDER BY dh.detection_date DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(main_q, params + [limit, offset])
        rows = cursor.fetchall()

        detections = []
        for row in rows:  # type: ignore
            detections.append({
                "id": row['id'],
                "user_id": row['user_id'],
                "user_nama": row['user_nama'] or "Pengguna Tidak Dikenal",
                "user_email": row['user_email'] or "-",
                "image_url": f"/api/uploads/{row['image_path']}",
                "disease_name": row['disease_name'],
                "confidence": float(row['confidence'] or 0),
                "severity": row['severity'],
                "description": row['description'] or "",
                "symptoms": json.loads(row['symptoms']) if isinstance(row.get('symptoms'), str) and row['symptoms'] else (row.get('symptoms') or []),
                "treatment": json.loads(row['treatment']) if isinstance(row.get('treatment'), str) and row['treatment'] else (row.get('treatment') or []),
                "prevention": json.loads(row['prevention']) if isinstance(row.get('prevention'), str) and row['prevention'] else (row.get('prevention') or []),
                "detection_date": row['detection_date'].isoformat() if row['detection_date'] else None
            })

        # Aggregate stats
        cursor.execute("SELECT COUNT(*) as total, AVG(confidence) as avg_conf FROM DetectionHistory")
        agg = cursor.fetchone()
        cursor.execute("SELECT COUNT(*) as recent FROM DetectionHistory WHERE detection_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
        recent_row = cursor.fetchone()
        cursor.execute("SELECT disease_name, COUNT(*) as cnt FROM DetectionHistory GROUP BY disease_name ORDER BY cnt DESC LIMIT 1")
        top_disease_row = cursor.fetchone()

        stats = {
            "total_all": int(agg['total']) if agg else 0,  # type: ignore
            "avg_confidence": round(float(agg['avg_conf']), 1) if agg and agg['avg_conf'] else 0,  # type: ignore
            "recent_7days": int(recent_row['recent']) if recent_row else 0,  # type: ignore
            "top_disease": top_disease_row['disease_name'] if top_disease_row else "-"  # type: ignore
        }

        return jsonify({
            "detections": detections,
            "total": total,
            "page": page,
            "total_pages": total_pages,
            "limit": limit,
            "stats": stats
        }), 200

    except Exception as e:
        print(f"[admin/detections] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/admin/activities', methods=['GET'])
def get_admin_activities():
    """
    API untuk Superadmin: Mengambil log aktivitas terbaru secara dinamis.
    Menggabungkan: deteksi terbaru + pendaftaran user terbaru.
    Returns: { activities: [{ type, description, user_nama, timestamp }] }
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        activities = []

        # 5 Deteksi terbaru
        cursor.execute("""
            SELECT
                dh.disease_name, dh.confidence, dh.severity, dh.detection_date,
                u.nama AS user_nama, u.email AS user_email
            FROM DetectionHistory dh
            LEFT JOIN User u ON dh.user_id = u.user_id
            ORDER BY dh.detection_date DESC
            LIMIT 5
        """)
        detections = cursor.fetchall()
        for d in detections:  # type: ignore
            activities.append({
                "type": "detection",
                "description": f"Mendeteksi {d['disease_name']} ({d['confidence']:.1f}%) - Severity: {d['severity']}",
                "user_nama": d['user_nama'] or "Pengguna",
                "user_email": d['user_email'] or "-",
                "timestamp": d['detection_date'].isoformat() if d['detection_date'] else None
            })

        # 5 Pendaftaran user terbaru
        cursor.execute("""
            SELECT nama, email, tanggal_daftar, role
            FROM User
            ORDER BY tanggal_daftar DESC
            LIMIT 5
        """)
        users = cursor.fetchall()
        for u in users:  # type: ignore
            activities.append({
                "type": "new_user",
                "description": f"Akun baru terdaftar sebagai {u['role']}",
                "user_nama": u['nama'] or "Pengguna Baru",
                "user_email": u['email'] or "-",
                "timestamp": u['tanggal_daftar'].isoformat() if u['tanggal_daftar'] else None
            })

        # Sort gabungan berdasarkan waktu terbaru
        activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        activities = activities[:8]  # Ambil 8 terbaru

        return jsonify({"activities": activities}), 200

    except Exception as e:
        print(f"[admin/activities] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
