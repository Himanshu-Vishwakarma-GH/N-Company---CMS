from app.core.security import get_password_hash, verify_password

def test_hashing():
    print("Testing Password Hashing...")
    password = "himanshu123"
    
    try:
        hashed = get_password_hash(password)
        print(f"✅ Hash generated: {hashed}")
        
        is_valid = verify_password(password, hashed)
        print(f"✅ Verification result: {is_valid}")

        from app.core import security
        from datetime import timedelta
        print("Testing Token Creation...")
        token = security.create_access_token(1, expires_delta=timedelta(minutes=30))
        print(f"✅ Token generated: {token[:20]}...")
        
    except Exception as e:
        print(f"❌ Hashing Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_hashing()
