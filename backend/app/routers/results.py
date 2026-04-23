from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.database import get_db
from app.models import StudentRecord, Evaluation, Batch
from app.schemas import StudentRecordResponse, BatchStatus

router = APIRouter()


@router.get("/", response_model=List[StudentRecordResponse])
async def list_results(
    batch_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(StudentRecord).options(selectinload(StudentRecord.evaluation))
    
    if batch_id:
        query = query.where(StudentRecord.batch_id == batch_id)
    
    if search:
        query = query.where(
            StudentRecord.student_name.ilike(f"%{search}%") |
            StudentRecord.register_number.ilike(f"%{search}%")
        )
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/batches", response_model=List[BatchStatus])
async def list_batches(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Batch).order_by(Batch.created_at.desc())
    )
    return result.scalars().all()


@router.get("/batches/{batch_id}", response_model=BatchStatus)
async def get_batch(batch_id: str, db: AsyncSession = Depends(get_db)):
    batch = await db.get(Batch, batch_id)
    if not batch:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch
