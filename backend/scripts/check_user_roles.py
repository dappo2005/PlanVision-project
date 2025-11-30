import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database config
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')

print("=" * 50)
print("CHECKING USER ROLES IN DATABASE")
print("=" * 50)

try:
    # Connect to database
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    
    cursor = conn.cursor(dictionary=True)
    
    # Get all users with their roles
    cursor.execute("SELECT user_id, email, username, nama, role, status_akun FROM User ORDER BY user_id")
    users = cursor.fetchall()
    
    print(f"\nTotal users: {len(users)}\n")
    
    for user in users:
        print(f"User ID: {user['user_id']}")
        print(f"  Nama     : {user['nama']}")
        print(f"  Email    : {user['email']}")
        print(f"  Username : {user['username']}")
        print(f"  Role     : {user['role']}")
        print(f"  Status   : {user['status_akun']}")
        print("-" * 50)
    
    cursor.close()
    conn.close()
    
    print("\n✅ Check completed!")
    
except mysql.connector.Error as err:
    print(f"❌ Database error: {err}")
except Exception as e:
    print(f"❌ Error: {e}")
