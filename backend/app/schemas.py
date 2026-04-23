from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

# --- Faculty Schemas ---
class FacultyBase(BaseModel):
    username: str
    email: str
    full_name: str

class FacultyCreate(FacultyBase):
    password: str

class FacultyResponse(FacultyBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Generic Status Updates ---
class GenericMessage(BaseModel):
    message: str

# --- Pydantic models for other entities ---
class CourseResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class ClassResponse(BaseModel):
    id: str
    name: str
    section: Optional[str] = None
    student_strength: int
    class Config:
        from_attributes = True

class PracticumResponse(BaseModel):
    id: str
    number: int
    title: str
    max_process_marks: int
    max_product_marks: int
    class Config:
        from_attributes = True

class BatchStatus(BaseModel):
    id: str
    status: str
    total_files: int
    processed_count: int
    failed_count: int
    created_at: datetime
    class Config:
        from_attributes = True

class FileUploadResult(BaseModel):
    filename: str
    status: str
    error: Optional[str] = None

class UploadBatchResponse(BaseModel):
    batch_id: str
    message: str
    results: List[FileUploadResult]

class EvaluationData(BaseModel):
    total_process: float
    total_product: float
    total_score: float
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    remarks: Optional[str] = None
    class Config:
        from_attributes = True

class StudentRecordResponse(BaseModel):
    id: str
    student_name: Optional[str]
    register_number: Optional[str]
    file_status: str
    error_message: Optional[str]
    evaluation: Optional[EvaluationData]
    class Config:
        from_attributes = True
