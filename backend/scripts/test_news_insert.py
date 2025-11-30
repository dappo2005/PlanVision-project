import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')

print("=" * 60)
print("TESTING NEWS INSERT WITH LONG URL")
print("=" * 60)

try:
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    
    cursor = conn.cursor()
    
    # Test insert dengan URL panjang (1000+ karakter)
    long_url = "https://example.com/" + ("x" * 1000)
    
    print(f"\nTesting insert with {len(long_url)} character URL...")
    
    cursor.execute("""
        INSERT INTO News (title, content, category, image_url, author, created_by)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        "Test Article - Will Be Deleted",
        "Test content",
        "teknologi",
        long_url,
        "Test Author",
        10  # superadmin user_id
    ))
    
    conn.commit()
    test_id = cursor.lastrowid
    
    print(f"✅ Insert successful! News ID: {test_id}")
    
    # Delete test record
    cursor.execute("DELETE FROM News WHERE news_id = %s", (test_id,))
    conn.commit()
    
    print(f"✅ Test record cleaned up")
    print("\n" + "=" * 60)
    print("DATABASE IS WORKING CORRECTLY!")
    print("Issue must be with Flask backend cache/connection.")
    print("SOLUTION: Restart your Flask backend server!")
    print("=" * 60)
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as err:
    print(f"❌ Database error: {err}")
    print("\nDatabase still has the old structure!")
    print("Try running the SQL fix again.")
except Exception as e:
    print(f"❌ Error: {e}")
