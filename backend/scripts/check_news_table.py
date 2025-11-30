import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')

print("=" * 60)
print("CHECKING NEWS TABLE STRUCTURE")
print("=" * 60)

try:
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    
    cursor = conn.cursor(dictionary=True)
    
    # Get table structure
    cursor.execute("DESCRIBE News")
    columns = cursor.fetchall()
    
    print("\nNews Table Structure:")
    print("-" * 60)
    for col in columns:
        print(f"Column: {col['Field']}")
        print(f"  Type: {col['Type']}")
        print(f"  Null: {col['Null']}")
        print(f"  Default: {col['Default']}")
        print("-" * 60)
    
    cursor.close()
    conn.close()
    
    print("\n✅ Check completed!")
    
except mysql.connector.Error as err:
    print(f"❌ Database error: {err}")
except Exception as e:
    print(f"❌ Error: {e}")
