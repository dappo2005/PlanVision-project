import mysql.connector

try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='D@ffa_2005',
        database='plantvision_db'
    )
    cursor = conn.cursor()
    
    print("=== User Table Structure ===")
    cursor.execute("DESCRIBE User")
    columns = cursor.fetchall()
    for col in columns:
        print(f"{col[0]} - {col[1]} - {col[2]} - {col[3]} - {col[4]}")
    
    print("\n=== Sample Data ===")
    cursor.execute("SELECT * FROM User LIMIT 1")
    if cursor.description:
        column_names = [desc[0] for desc in cursor.description]
        print("Columns:", ", ".join(column_names))
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
