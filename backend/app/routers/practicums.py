from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Practicum
from app.schemas import PracticumResponse

router = APIRouter()


@router.get("/", response_model=List[PracticumResponse])
async def list_practicums(
    course_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Practicum)
    if course_id:
        query = query.where(Practicum.course_id == course_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=PracticumResponse)
async def create_practicum(
    course_id: str,
    number: int,
    title: str,
    description: str = None,
    max_process_marks: int = 18,
    max_product_marks: int = 12,
    db: AsyncSession = Depends(get_db)
):
    practicum = Practicum(
        course_id=course_id,
        number=number,
        title=title,
        description=description,
        max_process_marks=max_process_marks,
        max_product_marks=max_product_marks
    )
    db.add(practicum)
    await db.commit()
    await db.refresh(practicum)
    return practicum


@router.get("/{practicum_id}", response_model=PracticumResponse)
async def get_practicum(practicum_id: str, db: AsyncSession = Depends(get_db)):
    practicum = await db.get(Practicum, practicum_id)
    if not practicum:
        raise HTTPException(status_code=404, detail="Practicum not found")
    return practicum


@router.delete("/{practicum_id}")
async def delete_practicum(practicum_id: str, db: AsyncSession = Depends(get_db)):
    practicum = await db.get(Practicum, practicum_id)
    if not practicum:
        raise HTTPException(status_code=404, detail="Practicum not found")
    await db.delete(practicum)
    await db.commit()
    return {"message": "Practicum deleted"}
