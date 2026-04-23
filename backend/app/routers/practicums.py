from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Practicum
from app.schemas import PracticumResponse

router = APIRouter()

# Default practicum titles for the OBCFC curriculum (30 per semester)
DEFAULT_PRACTICUM_TITLES = [
    "Trait Assessment for CSE/AIML/DSCS/DS Founders",
    "Entrepreneurial Mindset Profiling",
    "Opportunity Recognition in Tech Startups",
    "Business Model Canvas Development",
    "Market Research and Competitor Analysis",
    "Customer Discovery and Validation",
    "Value Proposition Design",
    "Revenue Model and Pricing Strategy",
    "Startup Financial Planning",
    "Pitch Deck Development",
    "Lean Startup Methodology Application",
    "Product Prototyping and MVP Design",
    "Digital Marketing Strategy",
    "Intellectual Property and Patents",
    "Team Building and Leadership Assessment",
    "Supply Chain and Operations Planning",
    "Social Entrepreneurship Project",
    "Risk Assessment and Mitigation",
    "Startup Legal Compliance",
    "Venture Capital and Funding Strategies",
    "Technology Feasibility Analysis",
    "Design Thinking Workshop",
    "Agile Project Management",
    "Ethics in Technology Entrepreneurship",
    "Stakeholder Communication Plan",
    "Scalability and Growth Strategy",
    "International Market Entry Plan",
    "Sustainability and Impact Assessment",
    "Entrepreneurial Reflection Portfolio",
    "Final Venture Presentation and Defense",
]


@router.get("/", response_model=List[PracticumResponse])
async def list_practicums(
    course_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Practicum).order_by(Practicum.number)
    if course_id:
        query = query.where(Practicum.course_id == course_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/seed", response_model=List[PracticumResponse])
async def seed_practicums(
    course_id: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Auto-create all 30 practicums for a course. Skips numbers that already exist."""
    # Check which practicum numbers already exist for this course
    result = await db.execute(
        select(Practicum.number).where(Practicum.course_id == course_id)
    )
    existing_numbers = {row[0] for row in result.fetchall()}
    
    created = []
    for i in range(1, 31):
        if i in existing_numbers:
            continue
        title = DEFAULT_PRACTICUM_TITLES[i - 1] if i <= len(DEFAULT_PRACTICUM_TITLES) else f"Practicum {i}"
        practicum = Practicum(
            course_id=course_id,
            number=i,
            title=title,
            max_process_marks=18,
            max_product_marks=12
        )
        db.add(practicum)
        created.append(practicum)
    
    await db.commit()
    
    # Return all practicums for the course (including previously existing ones)
    result = await db.execute(
        select(Practicum).where(Practicum.course_id == course_id).order_by(Practicum.number)
    )
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

