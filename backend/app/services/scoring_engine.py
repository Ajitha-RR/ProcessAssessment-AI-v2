import json
from pydantic import BaseModel, ConfigDict
import openai
from typing import Dict, Any

from app.config import settings
from app.services.document_processor import DocumentProcessor

openai.api_key = settings.OPENAI_API_KEY

class EvaluationScore(BaseModel):
    process_scores: Dict[str, float]
    product_scores: Dict[str, float]
    total_process: float
    total_product: float
    total_score: float
    strengths: str
    weaknesses: str
    remarks: str
    confidence: float
    
    model_config = ConfigDict(extra='ignore')

class ScoringEngine:
    @staticmethod
    def rule_based_score(text: str) -> Dict[str, Any]:
        """Calculates structural heuristic scores before AI evaluation."""
        sections = DocumentProcessor.detect_sections(text)
        
        # Base process out of 18
        process_score = 0
        if sections["has_trait_mapping"]:
            process_score += 4
            
        # These would theoretically be more complex rules
        if "test" in text.lower():
            process_score += 4 # Psychometric test completion heuristic
            
        # Base product out of 12
        product_score = 0
        if sections["has_interpretation"]: product_score += 3
        if sections["has_conclusion"]: product_score += 3
        
        return {
            "rule_process": process_score,
            "rule_product": product_score,
            "sections_found": sections
        }

    @staticmethod
    async def ai_score(text: str) -> EvaluationScore:
        """Call OpenAI to perform structured grading"""
        if not settings.OPENAI_API_KEY:
            # Fake payload if no API key is provided
            return EvaluationScore(
                process_scores={"test": 4, "accuracy": 3, "trait": 4, "discussion": 2, "ethics": 2},
                product_scores={"clarity": 2, "interpretation": 2, "conclusion": 2, "report": 2},
                total_process=15,
                total_product=8,
                total_score=23,
                strengths="Clear structure.",
                weaknesses="Lacks detailed interpretation.",
                remarks="Good effort.",
                confidence=0.8
            )
            
        prompt = '''You are an academic practicum evaluator. Assess the following student report using the provided rubric. Score conservatively and only award marks when the report clearly demonstrates the criterion.

Rubric:
Process criteria (Total 18): psychometric test completion(4), accuracy of results(4), trait mapping(4), team discussion(3), ethics(3).
Product criteria (Total 12): table clarity(3), interpretation quality(3), conclusion quality(3), report quality(3).

Report Text:
{text}

Return JSON only with these exact keys:
"process_scores" (dict of criteria to score)
"product_scores" (dict of criteria to score)
"total_process"
"total_product"
"total_score"
"strengths"
"weaknesses"
"remarks"
"confidence" (0-1 float)'''

        # Truncate text if it's absurdly long
        if len(text) > 30000:
            text = text[:30000]

        try:
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                response_format={ "type": "json_object" },
                messages=[
                    {"role": "system", "content": "You are a strict, precise academic evaluator. Always output valid JSON matching the exact requested schema."},
                    {"role": "user", "content": prompt.format(text=text)}
                ]
            )
            
            result_json = response.choices[0].message.content
            parsed = json.loads(result_json)
            return EvaluationScore(**parsed)
            
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            raise e
