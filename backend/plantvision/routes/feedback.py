"""Endpoint feedback pengguna, administrasi feedback, dan chat AI."""
from datetime import datetime, timedelta
import secrets

import mysql.connector
from flask import Blueprint, jsonify, request

from plantvision import services
from plantvision.services import generate_gemini_reply, get_db_connection, verify_superadmin

bp = Blueprint('feedback', __name__)

# ===================================================================
# FEEDBACK SYSTEM API ENDPOINTS
# ===================================================================

def generate_tracking_code():
    """Generate unique tracking code untuk guest feedback"""
    return secrets.token_hex(16)  # 32 karakter hex string


# --- API SUBMIT FEEDBACK (Guest - Tanpa Login) ---
@bp.route('/api/feedback/submit-guest', methods=['POST'])
def submit_feedback_guest():
    """
    API untuk guest mengirim feedback tanpa login
    Body: {nama, email, rating, category, message}
    Returns: {feedback_id, tracking_code, message}
    """
    conn = None
    cursor = None

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        # Validasi required fields
        nama = data.get('nama')
        email = data.get('email')
        rating = data.get('rating')
        category = data.get('category')
        message = data.get('message')

        if not all([nama, email, rating, category, message]):
            return jsonify({"error": "Semua field wajib diisi"}), 400

        # Validasi rating
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                return jsonify({"error": "Rating harus antara 1-5"}), 400
        except ValueError:
            return jsonify({"error": "Rating tidak valid"}), 400

        # Validasi category
        valid_categories = ['umum', 'fitur', 'bug', 'desain', 'saran']
        if category not in valid_categories:
            return jsonify({"error": f"Category tidak valid. Pilihan: {', '.join(valid_categories)}"}), 400

        # Generate tracking code
        tracking_code = generate_tracking_code()

        # Save to database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor()

        query = """
            INSERT INTO Feedback
            (user_id, nama, email, rating, category, message, user_role, status, tracking_code)
            VALUES (NULL, %s, %s, %s, %s, %s, 'guest', 'pending', %s)
        """
        values = (nama, email, rating_int, category, message, tracking_code)

        cursor.execute(query, values)
        conn.commit()
        feedback_id = cursor.lastrowid

        return jsonify({
            "message": "Feedback berhasil dikirim!",
            "feedback_id": feedback_id,
            "tracking_code": tracking_code,
            "info": "Simpan tracking code ini untuk mengecek status feedback Anda"
        }), 201

    except mysql.connector.Error as err:
        print(f"[Feedback Guest] Database error: {err}")
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        print(f"[Feedback Guest] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API SUBMIT FEEDBACK (Authenticated User) ---
@bp.route('/api/feedback/submit', methods=['POST'])
def submit_feedback_user():
    """
    API untuk user yang sudah login mengirim feedback
    Body: {user_id, rating, category, message}
    Auto-fill nama & email dari database user
    Returns: {feedback_id, message}
    """
    conn = None
    cursor = None

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        # Validasi required fields
        user_id = data.get('user_id')
        rating = data.get('rating')
        category = data.get('category')
        message = data.get('message')

        if not all([user_id, rating, category, message]):
            return jsonify({"error": "user_id, rating, category, dan message wajib diisi"}), 400

        # Validasi rating
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                return jsonify({"error": "Rating harus antara 1-5"}), 400
        except ValueError:
            return jsonify({"error": "Rating tidak valid"}), 400

        # Validasi category
        valid_categories = ['umum', 'fitur', 'bug', 'desain', 'saran']
        if category not in valid_categories:
            return jsonify({"error": f"Category tidak valid"}), 400

        # Get user data from database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Cek user exist dan ambil data
        cursor.execute("SELECT user_id, nama, email, role FROM User WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User tidak ditemukan"}), 404

        user_data: dict = user  # type: ignore
        nama = user_data['nama']
        email = user_data['email']
        user_role = user_data['role']

        # Generate tracking code (optional untuk user, tapi tetap dibuat)
        tracking_code = generate_tracking_code()

        # Insert feedback
        query = """
            INSERT INTO Feedback
            (user_id, nama, email, rating, category, message, user_role, status, tracking_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s)
        """
        values = (user_id, nama, email, rating_int, category, message, user_role, tracking_code)

        cursor.execute(query, values)
        conn.commit()
        feedback_id = cursor.lastrowid

        return jsonify({
            "message": "Feedback berhasil dikirim!",
            "feedback_id": feedback_id,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }), 201

    except mysql.connector.Error as err:
        print(f"[Feedback User] Database error: {err}")
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        print(f"[Feedback User] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET MY FEEDBACKS (User) ---
@bp.route('/api/feedback/my-feedbacks/<int:user_id>', methods=['GET'])
def get_my_feedbacks(user_id):
    """
    API untuk user melihat riwayat feedback mereka
    Returns: List of feedbacks with status
    """
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT
                feedback_id, nama, email, rating, category, message,
                status, priority, created_at, updated_at, resolved_at, admin_notes
            FROM Feedback
            WHERE user_id = %s
            ORDER BY created_at DESC
        """

        cursor.execute(query, (user_id,))
        feedbacks = cursor.fetchall()

        # Format response
        result = []
        for fb in feedbacks:
            fb_data: dict = fb  # type: ignore
            result.append({
                "feedback_id": fb_data['feedback_id'],
                "rating": fb_data['rating'],
                "category": fb_data['category'],
                "message": fb_data['message'],
                "status": fb_data['status'],
                "priority": fb_data['priority'],
                "created_at": fb_data['created_at'].isoformat() if fb_data['created_at'] else None,
                "updated_at": fb_data['updated_at'].isoformat() if fb_data['updated_at'] else None,
                "resolved_at": fb_data['resolved_at'].isoformat() if fb_data['resolved_at'] else None,
                "admin_notes": fb_data['admin_notes']
            })

        return jsonify({
            "user_id": user_id,
            "total": len(result),
            "feedbacks": result
        }), 200

    except Exception as e:
        print(f"[My Feedbacks] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API UPDATE FEEDBACK (User - only pending & < 24 hours) ---
@bp.route('/api/feedback/update/<int:feedback_id>', methods=['PUT'])
def update_feedback(feedback_id):
    """
    API untuk user update feedback mereka (hanya jika status=pending dan < 24 jam)
    Body: {user_id, rating, category, message}
    Returns: {success, message}
    """
    conn = None
    cursor = None

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        user_id = data.get('user_id')
        rating = data.get('rating')
        category = data.get('category')
        message = data.get('message')

        if not all([user_id, rating, category, message]):
            return jsonify({"error": "Semua field wajib diisi"}), 400

        # Validasi rating
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                return jsonify({"error": "Rating harus antara 1-5"}), 400
        except ValueError:
            return jsonify({"error": "Rating tidak valid"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Check ownership dan status
        cursor.execute("""
            SELECT feedback_id, user_id, status, created_at
            FROM Feedback
            WHERE feedback_id = %s
        """, (feedback_id,))

        feedback = cursor.fetchone()
        if not feedback:
            return jsonify({"error": "Feedback tidak ditemukan"}), 404

        fb_data: dict = feedback  # type: ignore

        # Cek ownership
        if fb_data['user_id'] != int(user_id):
            return jsonify({"error": "Anda tidak memiliki akses untuk mengubah feedback ini"}), 403

        # Cek status
        if fb_data['status'] != 'pending':
            return jsonify({"error": f"Feedback dengan status '{fb_data['status']}' tidak dapat diubah"}), 400

        # Cek 24 hours rule
        from datetime import timedelta
        created = fb_data['created_at']
        now = datetime.now()
        time_diff = now - created

        if time_diff > timedelta(hours=24):
            return jsonify({"error": "Feedback hanya dapat diubah dalam 24 jam pertama"}), 400

        # Update feedback
        update_query = """
            UPDATE Feedback
            SET rating = %s, category = %s, message = %s, updated_at = NOW()
            WHERE feedback_id = %s
        """
        cursor.execute(update_query, (rating_int, category, message, feedback_id))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Feedback berhasil diupdate",
            "feedback_id": feedback_id
        }), 200

    except Exception as e:
        print(f"[Update Feedback] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API TRACK FEEDBACK (Guest - via tracking code) ---
@bp.route('/api/feedback/track/<tracking_code>', methods=['GET'])
def track_feedback(tracking_code):
    """
    API untuk guest track status feedback via tracking code
    Returns: Feedback details and responses
    """
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT
                feedback_id, nama, email, rating, category, message,
                status, priority, created_at, updated_at, resolved_at
            FROM Feedback
            WHERE tracking_code = %s
        """

        cursor.execute(query, (tracking_code,))
        feedback = cursor.fetchone()

        if not feedback:
            return jsonify({"error": "Tracking code tidak valid"}), 404

        fb_data: dict = feedback  # type: ignore

        # Get responses (non-internal only)
        cursor.execute("""
            SELECT response_text, created_at
            FROM FeedbackResponse
            WHERE feedback_id = %s AND is_internal = 0
            ORDER BY created_at ASC
        """, (fb_data['feedback_id'],))

        responses = []
        for resp in cursor.fetchall():
            resp_data: dict = resp  # type: ignore
            responses.append({
                "response": resp_data['response_text'],
                "date": resp_data['created_at'].isoformat() if resp_data['created_at'] else None
            })

        return jsonify({
            "feedback_id": fb_data['feedback_id'],
            "rating": fb_data['rating'],
            "category": fb_data['category'],
            "message": fb_data['message'],
            "status": fb_data['status'],
            "submitted_at": fb_data['created_at'].isoformat() if fb_data['created_at'] else None,
            "resolved_at": fb_data['resolved_at'].isoformat() if fb_data['resolved_at'] else None,
            "responses": responses
        }), 200

    except Exception as e:
        print(f"[Track Feedback] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# ===================================================================
# ADMIN FEEDBACK MANAGEMENT API (Superadmin Only)
# ===================================================================

# --- API GET ALL FEEDBACKS (Admin) ---
@bp.route('/api/admin/feedbacks', methods=['GET'])
def get_all_feedbacks():
    """
    API untuk admin melihat semua feedback dengan filtering
    Query params: ?status=pending&category=bug&sort=date_desc&page=1&limit=20
    Returns: Paginated list of feedbacks
    """
    conn = None
    cursor = None

    try:
        # Get query parameters
        admin_id = request.args.get('admin_id')
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Superadmin access required"}), 403

        status_filter = request.args.get('status', None)
        category_filter = request.args.get('category', None)
        sort_by = request.args.get('sort', 'date_desc')  # date_desc, date_asc, rating_desc, rating_asc
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))

        offset = (page - 1) * limit

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Build query with filters
        where_clauses = []
        params = []

        if status_filter:
            where_clauses.append("status = %s")
            params.append(status_filter)

        if category_filter:
            where_clauses.append("category = %s")
            params.append(category_filter)

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Determine sort order
        if sort_by == 'date_desc':
            order_sql = "ORDER BY created_at DESC"
        elif sort_by == 'date_asc':
            order_sql = "ORDER BY created_at ASC"
        elif sort_by == 'rating_desc':
            order_sql = "ORDER BY rating DESC, created_at DESC"
        elif sort_by == 'rating_asc':
            order_sql = "ORDER BY rating ASC, created_at DESC"
        else:
            order_sql = "ORDER BY created_at DESC"

        # Count total
        count_query = f"SELECT COUNT(*) as total FROM Feedback {where_sql}"
        cursor.execute(count_query, params)
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore

        # Get feedbacks
        query = f"""
            SELECT
                feedback_id, user_id, nama, email, rating, category, message,
                user_role, status, priority, created_at, updated_at,
                resolved_at, resolved_by, admin_notes
            FROM Feedback
            {where_sql}
            {order_sql}
            LIMIT %s OFFSET %s
        """

        cursor.execute(query, params + [limit, offset])
        feedbacks = cursor.fetchall()

        result = []
        for fb in feedbacks:
            fb_data: dict = fb  # type: ignore
            result.append({
                "feedback_id": fb_data['feedback_id'],
                "user_id": fb_data['user_id'],
                "nama": fb_data['nama'],
                "email": fb_data['email'],
                "rating": fb_data['rating'],
                "category": fb_data['category'],
                "message": fb_data['message'],
                "user_role": fb_data['user_role'],
                "status": fb_data['status'],
                "priority": fb_data['priority'],
                "created_at": fb_data['created_at'].isoformat() if fb_data['created_at'] else None,
                "updated_at": fb_data['updated_at'].isoformat() if fb_data['updated_at'] else None,
                "resolved_at": fb_data['resolved_at'].isoformat() if fb_data['resolved_at'] else None,
                "resolved_by": fb_data['resolved_by'],
                "admin_notes": fb_data['admin_notes']
            })

        return jsonify({
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit,
            "feedbacks": result
        }), 200

    except Exception as e:
        print(f"[Admin Feedbacks] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET FEEDBACK STATISTICS (Admin) ---
@bp.route('/api/admin/feedbacks/stats', methods=['GET'])
def get_feedback_stats():
    """
    API untuk mendapatkan statistik feedback
    Query params: ?admin_id=1
    Returns: {total, pending, by_status, by_category, by_rating}
    """
    conn = None
    cursor = None

    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Superadmin access required"}), 403

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Total feedbacks
        cursor.execute("SELECT COUNT(*) as total FROM Feedback")
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore

        # Pending feedbacks
        cursor.execute("SELECT COUNT(*) as pending FROM Feedback WHERE status = 'pending'")
        pending_result = cursor.fetchone()
        pending: int = pending_result['pending'] if pending_result else 0  # type: ignore

        # By status
        cursor.execute("SELECT status, COUNT(*) as count FROM Feedback GROUP BY status")
        by_status = {row['status']: row['count'] for row in cursor.fetchall()}  # type: ignore

        # By category
        cursor.execute("SELECT category, COUNT(*) as count FROM Feedback GROUP BY category")
        by_category = {row['category']: row['count'] for row in cursor.fetchall()}  # type: ignore

        # By rating
        cursor.execute("SELECT rating, COUNT(*) as count FROM Feedback GROUP BY rating ORDER BY rating")
        by_rating = {row['rating']: row['count'] for row in cursor.fetchall()}  # type: ignore

        # Average rating
        cursor.execute("SELECT AVG(rating) as avg_rating FROM Feedback")
        avg_result = cursor.fetchone()
        avg_rating = float(avg_result['avg_rating']) if avg_result and avg_result['avg_rating'] else 0  # type: ignore

        return jsonify({
            "total": total,
            "pending": pending,
            "by_status": by_status,
            "by_category": by_category,
            "by_rating": by_rating,
            "average_rating": round(avg_rating, 2)
        }), 200

    except Exception as e:
        print(f"[Feedback Stats] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API CHAT AI ---
@bp.route('/api/chat', methods=['POST'])
def chat_ai():
    try:
        data = request.json or {}
        user_message = data.get('message')

        if not user_message:
            return jsonify({"error": "Pesan tidak boleh kosong"}), 400

        if not services.GEMINI_API_KEY:
            return jsonify({"error": "Chat AI belum dikonfigurasi. Set GEMINI_API_KEY di .env"}), 500
        reply_text = generate_gemini_reply(user_message)

        return jsonify({
            "reply": reply_text,
            "timestamp": datetime.now().isoformat()
        }), 200

    except Exception as e:
        print(f"[Chat AI Error]: {e}")
        return jsonify({
            "reply": "Maaf, terjadi kesalahan saat menghubungi AI. Pastikan API key valid dan model tersedia.",
            "error": "Layanan AI tidak tersedia"
        }), 500



# --- API UPDATE FEEDBACK STATUS (Admin) ---
@bp.route('/api/admin/feedbacks/<int:feedback_id>/status', methods=['PUT'])
def update_feedback_status(feedback_id):
    """
    API untuk admin update status feedback
    Body: {admin_id, status, admin_notes (optional), priority (optional)}
    Returns: {success, message}
    """
    conn = None
    cursor = None

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        admin_id = data.get('admin_id')
        new_status = data.get('status')
        admin_notes = data.get('admin_notes', None)
        priority = data.get('priority', None)

        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Superadmin access required"}), 403

        if not new_status:
            return jsonify({"error": "Status diperlukan"}), 400

        valid_statuses = ['pending', 'in_review', 'resolved', 'rejected']
        if new_status not in valid_statuses:
            return jsonify({"error": f"Status tidak valid. Pilihan: {', '.join(valid_statuses)}"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor()

        # Build update query
        update_parts = ["status = %s", "updated_at = NOW()"]
        params = [new_status]

        if new_status in ['resolved', 'rejected']:
            update_parts.append("resolved_at = NOW()")
            update_parts.append("resolved_by = %s")
            params.append(admin_id)

        if admin_notes:
            update_parts.append("admin_notes = %s")
            params.append(admin_notes)

        if priority:
            valid_priorities = ['low', 'medium', 'high', 'critical']
            if priority in valid_priorities:
                update_parts.append("priority = %s")
                params.append(priority)

        params.append(feedback_id)

        query = f"""
            UPDATE Feedback
            SET {', '.join(update_parts)}
            WHERE feedback_id = %s
        """

        cursor.execute(query, params)
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Feedback tidak ditemukan"}), 404

        return jsonify({
            "success": True,
            "message": f"Feedback status berhasil diupdate menjadi '{new_status}'",
            "feedback_id": feedback_id
        }), 200

    except Exception as e:
        print(f"[Update Status] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API ADD FEEDBACK RESPONSE (Admin) ---
@bp.route('/api/admin/feedbacks/<int:feedback_id>/response', methods=['POST'])
def add_feedback_response(feedback_id):
    """
    API untuk admin menambahkan response/notes ke feedback
    Body: {admin_id, response_text, is_internal (boolean)}
    Returns: {response_id, message}
    """
    conn = None
    cursor = None

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        admin_id = data.get('admin_id')
        response_text = data.get('response_text')
        is_internal = data.get('is_internal', False)

        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Superadmin access required"}), 403

        if not response_text:
            return jsonify({"error": "Response text diperlukan"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor()

        # Check if feedback exists
        cursor.execute("SELECT feedback_id FROM Feedback WHERE feedback_id = %s", (feedback_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Feedback tidak ditemukan"}), 404

        # Insert response
        query = """
            INSERT INTO FeedbackResponse (feedback_id, admin_id, response_text, is_internal)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (feedback_id, admin_id, response_text, 1 if is_internal else 0))
        conn.commit()
        response_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Response berhasil ditambahkan",
            "response_id": response_id
        }), 201

    except Exception as e:
        print(f"[Add Response] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET PUBLIC FEEDBACKS (untuk display di halaman feedback) ---
@bp.route('/api/feedback/public', methods=['GET'])
def get_public_feedbacks():
    """
    API untuk mendapatkan feedback publik yang sudah resolved (untuk display di halaman feedback)
    Query params: ?limit=10&sort=date_desc
    Returns: List of public feedbacks
    """
    conn = None
    cursor = None

    try:
        limit = int(request.args.get('limit', 10))
        sort_by = request.args.get('sort', 'date_desc')

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Sort order
        if sort_by == 'date_desc':
            order_sql = "ORDER BY created_at DESC"
        elif sort_by == 'date_asc':
            order_sql = "ORDER BY created_at ASC"
        elif sort_by == 'rating_desc':
            order_sql = "ORDER BY rating DESC, created_at DESC"
        else:
            order_sql = "ORDER BY created_at DESC"

        # Query feedbacks yang resolved atau rating tinggi (untuk display publik)
        query = f"""
            SELECT
                feedback_id, nama, rating, category, message, created_at
            FROM Feedback
            WHERE rating >= 4
            {order_sql}
            LIMIT %s
        """

        cursor.execute(query, (limit,))
        feedbacks = cursor.fetchall()

        result = []
        for fb in feedbacks:
            fb_data: dict = fb  # type: ignore
            result.append({
                "feedback_id": fb_data['feedback_id'],
                "nama": fb_data['nama'],
                "rating": fb_data['rating'],
                "category": fb_data['category'],
                "message": fb_data['message'],
                "created_at": fb_data['created_at'].isoformat() if fb_data['created_at'] else None
            })

        return jsonify({
            "total": len(result),
            "feedbacks": result
        }), 200

    except Exception as e:
        print(f"[Public Feedbacks] Error: {e}")
        # Return empty array instead of error (graceful degradation)
        return jsonify({
            "total": 0,
            "feedbacks": [],
            "error": "Feedback belum dapat dimuat"
        }), 200
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET USER ROLE (for navbar sync) ---
@bp.route('/api/user/role', methods=['GET'])
def get_user_role():
    """
    API untuk mendapatkan role user berdasarkan email
    Query params: ?email=user@example.com
    Returns: {email, role}
    """
    conn = None
    cursor = None

    try:
        email = request.args.get('email')
        if not email:
            return jsonify({"error": "Email parameter required"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT email, role FROM User WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        user_data: dict = user  # type: ignore
        return jsonify({
            "email": user_data['email'],
            "role": user_data['role']
        }), 200

    except Exception as e:
        print(f"[Get User Role] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
