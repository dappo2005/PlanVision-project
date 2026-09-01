#!/usr/bin/env python3
"""
Mock Database Adapter untuk PlantVision
Memberikan respons valid tanpa MySQL untuk testing
"""
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

class MockDatabase:
    """In-memory mock database untuk testing"""
    
    def __init__(self):
        self.users = {}
        self.detections = {}
        self.feedbacks = {}
        self.news_items = {}
        self._init_default_users()
    
    def _init_default_users(self):
        """Create default test users"""
        self.users = {
            1: {
                'user_id': 1,
                'nama': 'Test User',
                'email': 'test@example.com',
                'username': 'testuser',
                'phone': '081234567890',
                'password': 'hashed_password_here',
                'role': 'user',
                'status_akun': 'aktif',
                'accept_terms': True,
                'tanggal_daftar': datetime.now().isoformat()
            },
            2: {
                'user_id': 2,
                'nama': 'Admin User',
                'email': 'admin@example.com',
                'username': 'adminuser',
                'phone': '082234567890',
                'password': 'hashed_admin_password',
                'role': 'superadmin',
                'status_akun': 'aktif',
                'accept_terms': True,
                'tanggal_daftar': datetime.now().isoformat()
            }
        }
        self.next_user_id = 3
    
    def register_user(self, nama: str, email: str, username: str, phone: Optional[str], password: str, accept_terms: bool) -> Dict[str, Any]:
        """Mock user registration"""
        # Check if email/username exists
        for user in self.users.values():
            if user['email'] == email:
                raise Exception("Email sudah terdaftar")
            if user['username'] == username:
                raise Exception("Username sudah terdaftar")
        
        user_id = self.next_user_id
        self.users[user_id] = {
            'user_id': user_id,
            'nama': nama,
            'email': email,
            'username': username,
            'phone': phone,
            'password': password,  # In real app: hashed
            'role': 'user',
            'status_akun': 'aktif',
            'accept_terms': accept_terms,
            'tanggal_daftar': datetime.now().isoformat()
        }
        self.next_user_id += 1
        return {
            'user_id': user_id,
            'nama': nama,
            'email': email,
            'username': username,
            'message': f'Registrasi sukses untuk user: {username}'
        }
    
    def login_user(self, username_or_email: str, password: str) -> Dict[str, Any]:
        """Mock user login"""
        for user in self.users.values():
            if (user['email'] == username_or_email or user['username'] == username_or_email):
                # In real app: bcrypt.checkpw()
                return {
                    'user_id': user['user_id'],
                    'nama': user['nama'],
                    'email': user['email'],
                    'username': user['username'],
                    'role': user['role'],
                    'status_akun': user['status_akun']
                }
        
        raise Exception("Username atau password salah")
    
    def add_detection(self, user_id: int, image_path: str, disease_name: str, confidence: float, severity: str, **kwargs) -> Dict[str, Any]:
        """Mock disease detection"""
        detection_id = len(self.detections) + 1
        self.detections[detection_id] = {
            'id': detection_id,
            'user_id': user_id,
            'image_path': image_path,
            'disease_name': disease_name,
            'confidence': confidence,
            'severity': severity,
            'description': kwargs.get('description', ''),
            'symptoms': kwargs.get('symptoms', ''),
            'treatment': kwargs.get('treatment', ''),
            'prevention': kwargs.get('prevention', ''),
            'detection_date': datetime.now().isoformat()
        }
        return self.detections[detection_id]
    
    def get_detections(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user's detection history"""
        return [d for d in self.detections.values() if d['user_id'] == user_id]
    
    def add_feedback(self, user_id: Optional[int], category: str, rating: int, message: str, **kwargs) -> Dict[str, Any]:
        """Mock feedback submission"""
        feedback_id = len(self.feedbacks) + 1
        self.feedbacks[feedback_id] = {
            'feedback_id': feedback_id,
            'user_id': user_id,
            'category': category,
            'rating': rating,
            'message': message,
            'status': 'pending',
            'priority': 'normal',
            'response': None,
            'created_at': datetime.now().isoformat(),
            'tracking_code': f'FEEDBACK-{feedback_id:04d}'
        }
        return self.feedbacks[feedback_id]
    
    def get_public_feedbacks(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get approved feedbacks"""
        approved = [f for f in self.feedbacks.values() if f['status'] == 'approved']
        return sorted(approved, key=lambda x: x['created_at'], reverse=True)[:limit]
    
    def add_news(self, title: str, content: str, category: str, image_url: Optional[str] = None) -> Dict[str, Any]:
        """Mock news creation"""
        news_id = len(self.news_items) + 1
        self.news_items[news_id] = {
            'news_id': news_id,
            'title': title,
            'content': content,
            'category': category,
            'image_url': image_url,
            'views': 0,
            'created_at': datetime.now().isoformat()
        }
        return self.news_items[news_id]
    
    def get_all_news(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get latest news"""
        return sorted(self.news_items.values(), key=lambda x: x['created_at'], reverse=True)[:limit]

# Global mock database instance
mock_db = MockDatabase()
