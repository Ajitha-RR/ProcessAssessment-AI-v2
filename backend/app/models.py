import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID # Note: For SQLite, UUIDs are often handled as strings. We will use string representations for simple compatibility.

from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Faculty(Base):
    __tablename__ = "faculties"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    courses = relationship("Course", back_populates="faculty")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    faculty_id = Column(String, ForeignKey("faculties.id"))
    name = Column(String)
    code = Column(String, unique=True)
    description = Column(Text, nullable=True)
    total_practicums = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    faculty = relationship("Faculty", back_populates="courses")
    classrooms = relationship("Classroom", back_populates="course")
    practicums = relationship("Practicum", back_populates="course")

class Classroom(Base):
    __tablename__ = "classrooms"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"))
    name = Column(String)
    section = Column(String, nullable=True)
    student_strength = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="classrooms")

class Practicum(Base):
    __tablename__ = "practicums"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"))
    number = Column(Integer)
    title = Column(String)
    description = Column(Text, nullable=True)
    max_process_marks = Column(Integer, default=18)
    max_product_marks = Column(Integer, default=12)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="practicums")
    batches = relationship("Batch", back_populates="practicum")

class Batch(Base):
    __tablename__ = "batches"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    practicum_id = Column(String, ForeignKey("practicums.id"))
    classroom_id = Column(String, ForeignKey("classrooms.id"))
    faculty_id = Column(String, ForeignKey("faculties.id"))
    status = Column(String, default="PENDING") # PENDING, PROCESSING, COMPLETED
    total_files = Column(Integer, default=0)
    processed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    practicum = relationship("Practicum", back_populates="batches")
    student_records = relationship("StudentRecord", back_populates="batch")

class StudentRecord(Base):
    __tablename__ = "student_records"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    batch_id = Column(String, ForeignKey("batches.id"))
    original_filename = Column(String)
    student_name = Column(String, nullable=True)
    register_number = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    file_status = Column(String, default="UPLOADED") # UPLOADED, PARSED, SCORED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    batch = relationship("Batch", back_populates="student_records")
    evaluation = relationship("Evaluation", back_populates="student_record", uselist=False)
    review = relationship("Review", back_populates="student_record", uselist=False)

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    student_record_id = Column(String, ForeignKey("student_records.id"))
    rule_scores = Column(JSON, nullable=True)
    ai_scores = Column(JSON, nullable=True)
    combined_scores = Column(JSON, nullable=True)
    total_process = Column(Float, default=0.0)
    total_product = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    scoring_method = Column(String, default="HYBRID")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student_record = relationship("StudentRecord", back_populates="evaluation")

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    student_record_id = Column(String, ForeignKey("student_records.id"))
    faculty_id = Column(String, ForeignKey("faculties.id"))
    reviewed_name = Column(String, nullable=True)
    reviewed_register_number = Column(String, nullable=True)
    reviewed_process_marks = Column(Float, default=0.0)
    reviewed_product_marks = Column(Float, default=0.0)
    reviewed_total = Column(Float, default=0.0)
    reviewed_remarks = Column(Text, nullable=True)
    status = Column(String, default="DRAFT") # DRAFT, REVIEWED, FINALIZED
    original_scores = Column(JSON, nullable=True)
    final_scores = Column(JSON, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    finalized_at = Column(DateTime, nullable=True)
    
    student_record = relationship("StudentRecord", back_populates="review")
