from fastapi import APIRouter, UploadFile, File, Form, Depends, BackgroundTasks, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
import os
import uuid

from app.database import get_db
from app.schemas import UploadBatchResponse, FileUploadResult
from app.models import Batch, StudentRecord
from app.services.batch_processor import process_batch_background

router = APIRouter()

@router.post("/", response_model=UploadBatchResponse)
async def upload_files(
    background_tasks: BackgroundTasks,
    practicum_id: str = Form(...),
    classroom_id: str = Form(...),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    if len(files) > 75:
        raise HTTPException(status_code=400, detail="Maximum 75 files allowed per upload")
    
    # Use dummy faculty ID for testing without auth
    dummy_faculty_id = "testing-user"
    
    # Create batch with explicit ID
    batch_id = str(uuid.uuid4())
    new_batch = Batch(
        id=batch_id,
        practicum_id=practicum_id,
        classroom_id=classroom_id,
        faculty_id=dummy_faculty_id,
        status="PENDING",
        total_files=len(files)
    )
    db.add(new_batch)
    await db.commit()
    await db.refresh(new_batch)
    
    print(f"[Upload] Created batch {batch_id}")
    
    upload_results = []
    saved_file_paths = []
    
    # Store files temporarily
    os.makedirs("./temp_uploads", exist_ok=True)
    
    for file in files:
        if not file.filename.lower().endswith(('.pdf', '.docx')):
            upload_results.append(FileUploadResult(
                filename=file.filename,
                status="FAILED",
                error="Invalid file type. Only PDF and DOCX are allowed."
            ))
            continue
            
        try:
            # Create a student record with explicit ID
            record_id = str(uuid.uuid4())
            record = StudentRecord(
                id=record_id,
                batch_id=new_batch.id,
                original_filename=file.filename,
                file_status="UPLOADED"
            )
            db.add(record)
            
            # Save file to disk using chunks
            file_path = f"./temp_uploads/{new_batch.id}_{file.filename}"
            with open(file_path, "wb") as f:
                while content := await file.read(1024 * 1024):  # 1MB chunks
                    f.write(content)
            
            saved_file_paths.append((record_id, file_path))
            upload_results.append(FileUploadResult(filename=file.filename, status="UPLOADED"))
            print(f"[Upload] Saved file {file.filename} -> record {record_id[:8]}...")
            
        except Exception as e:
            print(f"[Upload] ERROR saving file {file.filename}: {e}")
            upload_results.append(FileUploadResult(
                filename=file.filename,
                status="FAILED",
                error=str(e)
            ))
    
    # Commit all student records
    await db.commit()
    print(f"[Upload] Committed {len(saved_file_paths)} records to database")
    
    # Kick off background task
    if saved_file_paths:
        background_tasks.add_task(process_batch_background, new_batch.id, saved_file_paths)
        print(f"[Upload] Background task queued for batch {new_batch.id}")
    
    return UploadBatchResponse(
        batch_id=new_batch.id,
        message="Files uploaded successfully and queued for processing",
        results=upload_results
    )
