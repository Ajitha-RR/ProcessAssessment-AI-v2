import asyncio
import os
import traceback
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Tuple

from app.database import AsyncSessionLocal
from app.models import Batch, StudentRecord, Evaluation
from app.services.document_processor import DocumentProcessor
from app.services.scoring_engine import ScoringEngine

async def process_batch_background(batch_id: str, file_paths: List[Tuple[str, str]]):
    """
    Main background job for processing a batch of files.
    file_paths: list of tuples (student_record_id, local_file_path)
    """
    print(f"[BatchProcessor] Starting batch {batch_id} with {len(file_paths)} files")
    
    async with AsyncSessionLocal() as db:
        try:
            # Update batch status
            batch = await db.get(Batch, batch_id)
            if not batch:
                print(f"[BatchProcessor] ERROR: Batch {batch_id} not found in database!")
                return
                
            batch.status = "PROCESSING"
            await db.commit()
            print(f"[BatchProcessor] Batch {batch_id} status set to PROCESSING")
            
            for record_id, file_path in file_paths:
                print(f"[BatchProcessor] Processing file: {file_path} (record: {record_id[:8]}...)")
                try:
                    await process_single_file(db, record_id, file_path)
                    print(f"[BatchProcessor] Successfully processed record {record_id[:8]}...")
                except Exception as e:
                    print(f"[BatchProcessor] ERROR processing record {record_id[:8]}...: {e}")
                    traceback.print_exc()
                
                # Update counters
                batch.processed_count += 1
                await db.commit()
                
            # Finish batch
            batch.status = "COMPLETED"
            await db.commit()
            print(f"[BatchProcessor] Batch {batch_id} COMPLETED. Processed: {batch.processed_count}, Failed: {batch.failed_count}")
            
        except Exception as e:
            print(f"[BatchProcessor] Batch {batch_id} failed catastrophically: {e}")
            traceback.print_exc()
            try:
                if batch:
                    batch.status = "FAILED"
                    await db.commit()
            except Exception:
                pass


async def process_single_file(db: AsyncSession, record_id: str, file_path: str):
    record = await db.get(StudentRecord, record_id)
    if not record:
        print(f"[BatchProcessor] WARNING: StudentRecord {record_id} not found, skipping")
        return
        
    try:
        # 1. Extraction
        print(f"[BatchProcessor]   Step 1: Extracting text from {file_path}")
        if file_path.lower().endswith('.pdf'):
            text = DocumentProcessor.extract_text_from_pdf(file_path)
        else:
            text = DocumentProcessor.extract_text_from_docx(file_path)
        
        print(f"[BatchProcessor]   Extracted {len(text)} characters")
        record.extracted_text = text
        
        # Extract student metadata
        info = DocumentProcessor.extract_student_info(text)
        record.student_name = info["student_name"]
        record.register_number = info["register_number"]
        print(f"[BatchProcessor]   Student: {record.student_name} ({record.register_number})")
        
        # 2. Rule-based scores
        print(f"[BatchProcessor]   Step 2: Rule-based scoring")
        rule_scores = ScoringEngine.rule_based_score(text)
        print(f"[BatchProcessor]   Rule scores: {rule_scores}")
        
        # 3. AI Scoring
        print(f"[BatchProcessor]   Step 3: AI scoring")
        ai_scores = await ScoringEngine.ai_score(text)
        print(f"[BatchProcessor]   AI scores: process={ai_scores.total_process} product={ai_scores.total_product} total={ai_scores.total_score}")
        
        # 4. Save evaluation
        evaluation = Evaluation(
            student_record_id=record.id,
            rule_scores=rule_scores,
            ai_scores=ai_scores.model_dump(),
            total_process=ai_scores.total_process,
            total_product=ai_scores.total_product,
            total_score=ai_scores.total_score,
            strengths=ai_scores.strengths,
            weaknesses=ai_scores.weaknesses,
            remarks=ai_scores.remarks,
            confidence=ai_scores.confidence
        )
        db.add(evaluation)
        
        # Update record status
        record.file_status = "SCORED"
        print(f"[BatchProcessor]   Record marked as SCORED")
        
        # Cleanup temp file
        try:
            os.remove(file_path)
            print(f"[BatchProcessor]   Temp file cleaned up")
        except OSError:
            pass
            
    except Exception as e:
        print(f"[BatchProcessor]   ERROR: {e}")
        traceback.print_exc()
        record.file_status = "FAILED"
        record.error_message = str(e)
        batch = await db.get(Batch, record.batch_id)
        if batch:
            batch.failed_count += 1
            
    await db.commit()
