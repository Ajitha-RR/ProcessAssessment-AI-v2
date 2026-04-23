from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Classroom
from app.schemas import ClassResponse

router = APIRouter()


@router.get("/", response_model=List[ClassResponse])
async def list_classes(
    course_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Classroom)
    if course_id:
        query = query.where(Classroom.course_id == course_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ClassResponse)
async def create_class(
    course_id: str,
    name: str,
    section: str = None,
    student_strength: int = 60,
    db: AsyncSession = Depends(get_db)
):
    classroom = Classroom(
        course_id=course_id,
        name=name,
        section=section,
        student_strength=student_strength
    )
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)
    return classroom


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(class_id: str, db: AsyncSession = Depends(get_db)):
    classroom = await db.get(Classroom, class_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    return classroom


@router.delete("/{class_id}")
async def delete_class(class_id: str, db: AsyncSession = Depends(get_db)):
    classroom = await db.get(Classroom, class_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    await db.delete(classroom)
    await db.commit()
    return {"message": "Class deleted"}
