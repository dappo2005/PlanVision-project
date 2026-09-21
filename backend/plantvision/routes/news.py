"""Endpoint berita publik dan pengelolaan berita oleh superadmin."""
from flask import Blueprint, jsonify, request

from plantvision.services import get_db_connection, verify_superadmin

bp = Blueprint('news', __name__)

@bp.route('/api/news', methods=['GET'])
def get_all_news():
    """
    API untuk mendapatkan semua berita dengan filter
    Query params: ?category=teknologi&limit=20&published_only=true
    Returns: {total, news[]}
    """
    conn = None
    cursor = None

    try:
        category = request.args.get('category')  # teknologi, budidaya, pasar, penelitian
        limit = int(request.args.get('limit', 20))
        published_only = request.args.get('published_only', 'true').lower() == 'true'

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)

        # Build query
        query = "SELECT * FROM News WHERE 1=1"
        params = []

        if published_only:
            query += " AND is_published = 1"

        if category:
            query += " AND category = %s"
            params.append(category)

        query += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)

        cursor.execute(query, params)
        news_list = cursor.fetchall()

        result = []
        for news in news_list:
            news_data: dict = news  # type: ignore
            result.append({
                "news_id": news_data['news_id'],
                "title": news_data['title'],
                "excerpt": news_data['excerpt'],
                "content": news_data['content'],
                "category": news_data['category'],
                "image_url": news_data['image_url'],
                "external_url": news_data['external_url'],
                "author": news_data['author'],
                "read_time": news_data['read_time'],
                "is_published": news_data['is_published'],
                "created_by": news_data['created_by'],
                "created_at": news_data['created_at'].isoformat() if news_data['created_at'] else None,
                "updated_at": news_data['updated_at'].isoformat() if news_data['updated_at'] else None
            })

        return jsonify({
            "total": len(result),
            "news": result
        }), 200

    except Exception as e:
        print(f"[Get News] Error: {e}")
        return jsonify({
            "total": 0,
            "news": [],
            "error": "Berita belum dapat dimuat"
        }), 200
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/news/<int:news_id>', methods=['GET'])
def get_news_detail(news_id):
    """
    API untuk mendapatkan detail berita berdasarkan ID
    Returns: Single news object
    """
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM News WHERE news_id = %s", (news_id,))
        news = cursor.fetchone()

        if not news:
            return jsonify({"error": "Berita tidak ditemukan"}), 404

        news_data: dict = news  # type: ignore
        return jsonify({
            "news_id": news_data['news_id'],
            "title": news_data['title'],
            "excerpt": news_data['excerpt'],
            "content": news_data['content'],
            "category": news_data['category'],
            "image_url": news_data['image_url'],
            "external_url": news_data['external_url'],
            "author": news_data['author'],
            "read_time": news_data['read_time'],
            "is_published": news_data['is_published'],
            "created_by": news_data['created_by'],
            "created_at": news_data['created_at'].isoformat() if news_data['created_at'] else None,
            "updated_at": news_data['updated_at'].isoformat() if news_data['updated_at'] else None
        }), 200

    except Exception as e:
        print(f"[Get News Detail] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/news', methods=['POST'])
def create_news():
    """
    API untuk membuat berita baru (admin only)
    Body: {title, excerpt, content, category, image_url, external_url, author, read_time, created_by (admin user_id)}
    Returns: {news_id, message}
    """
    conn = None
    cursor = None

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        # Validate required fields
        required_fields = ['title', 'content', 'category', 'created_by']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} diperlukan"}), 400

        created_by = data.get('created_by')
        if not verify_superadmin(created_by):
            return jsonify({"error": "Unauthorized. Hanya superadmin yang dapat membuat berita"}), 403

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor()

        query = """
            INSERT INTO News (title, excerpt, content, category, image_url, external_url,
                            author, read_time, is_published, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data['title'],
            data.get('excerpt', ''),
            data['content'],
            data['category'],
            data.get('image_url', ''),
            data.get('external_url', ''),
            data.get('author', 'Admin'),
            data.get('read_time', '5 menit'),
            data.get('is_published', 1),
            created_by
        )

        cursor.execute(query, values)
        conn.commit()
        news_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Berita berhasil dibuat",
            "news_id": news_id
        }), 201

    except Exception as e:
        print(f"[Create News] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/news/<int:news_id>', methods=['PUT'])
def update_news(news_id):
    """
    API untuk update berita (admin only)
    Body: {title?, excerpt?, content?, category?, image_url?, external_url?, author?, read_time?, is_published?, admin_id}
    Returns: {message}
    """
    conn = None
    cursor = None

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        admin_id = data.get('admin_id')
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Hanya superadmin yang dapat update berita"}), 403

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor()

        # Check if news exists
        cursor.execute("SELECT news_id FROM News WHERE news_id = %s", (news_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Berita tidak ditemukan"}), 404

        # Build update query dynamically
        update_fields = []
        values = []

        updatable_fields = ['title', 'excerpt', 'content', 'category', 'image_url',
                          'external_url', 'author', 'read_time', 'is_published']

        for field in updatable_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])

        if not update_fields:
            return jsonify({"error": "Tidak ada field yang diupdate"}), 400

        values.append(news_id)
        query = f"UPDATE News SET {', '.join(update_fields)} WHERE news_id = %s"

        cursor.execute(query, values)
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Berita berhasil diupdate"
        }), 200

    except Exception as e:
        print(f"[Update News] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/news/<int:news_id>', methods=['DELETE'])
def delete_news(news_id):
    """
    API untuk delete berita (admin only)
    Body: {admin_id}
    Returns: {message}
    """
    conn = None
    cursor = None

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        admin_id = data.get('admin_id')
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Hanya superadmin yang dapat delete berita"}), 403

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500

        cursor = conn.cursor()

        # Check if news exists
        cursor.execute("SELECT news_id FROM News WHERE news_id = %s", (news_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Berita tidak ditemukan"}), 404

        cursor.execute("DELETE FROM News WHERE news_id = %s", (news_id,))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Berita berhasil dihapus"
        }), 200

    except Exception as e:
        print(f"[Delete News] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
