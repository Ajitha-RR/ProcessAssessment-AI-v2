import fitz  # PyMuPDF
import docx
import re
from typing import Dict, Optional

class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        text = ""
        try:
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text() + "\n"
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}")
            raise e
        return text

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        text = ""
        try:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            print(f"Error reading DOCX {file_path}: {e}")
            raise e
        return text

    @staticmethod
    def extract_student_info(text: str) -> Dict[str, Optional[str]]:
        """
        Extract student name and register number from practicum report text.
        
        Handles the Karunya practicum format where student info appears at the end:
            Name of the Student    Register No.
            ABISHEK A              URK25CS7052
        
        Also handles labeled formats like:
            Name: John Doe
            Reg No: 21BCE1234
        """
        info = {
            "student_name": "Unknown",
            "register_number": "N/A"
        }
        
        # ---- REGISTER NUMBER EXTRACTION ----
        # Strategy: Try multiple patterns from most specific to most general
        
        # Pattern 1: "Register No." / "Reg No" label followed by the actual number
        # In the Karunya format, "Register No." is a header, and the actual value
        # appears a few lines later. We look for alphanumeric strings near it.
        reg_patterns = [
            # URK format specifically: URKxxCSxxxx or URKxxAIxxxx etc.
            r'\b(URK\d{2}[A-Z]{2,4}\d{3,5})\b',
            # General university reg format: 2-3 letters + 2 digits + 2-4 letters + 4-5 digits
            r'\b([A-Z]{2,3}\d{2}[A-Z]{2,4}\d{3,5})\b',
            # Simple labeled on same line: "Reg No: VALUE" or "Register Number: VALUE"
            r'(?i)Reg(?:ister)?\s*(?:No\.?|Number)\s*[:\-]\s*([A-Z0-9]{7,15})',
        ]
        
        for pattern in reg_patterns:
            match = re.search(pattern, text)
            if match:
                info["register_number"] = match.group(1).upper().strip()
                break
        
        # ---- STUDENT NAME EXTRACTION ----
        # Strategy: Try the Karunya-specific table format first, then fall back
        
        name_patterns = [
            # Karunya table format: "Name of the Student    Register No.\n1\nACTUAL NAME\nREG_NUMBER"
            # The pattern: after header row, skip S.No, capture the name line
            r'(?i)Name\s+of\s+the\s+Student\s+Register\s+No\.?\s*\n\s*\d+\s*\n\s*([A-Z][A-Za-z\s\.]{2,40})\n',
            # Labeled: "Name of the Student: ABISHEK A"
            r'(?i)Name\s+of\s+the\s+[Ss]tudent\s*[:\-]\s*([A-Za-z\s\.]{3,40})',
            # Labeled: "Student Name: John Doe"
            r'(?i)Student\s*Name\s*[:\-]\s*([A-Za-z\s\.]{3,40})',
            # Simple: "Name: John Doe" (but NOT "Name of Resource" or "Name of the Faculty")
            r'(?i)(?:^|\n)\s*Name\s*[:\-]\s*([A-Za-z\s\.]{3,40})',
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, text)
            if match:
                name = match.group(1).strip()
                # Clean up: remove trailing newlines, take first line only
                name = re.split(r'\n', name)[0].strip()
                # Reject obviously wrong matches
                if name.lower() not in ['of resource', 'of the student', 'of the faculty', 
                                         'and designation', 'suggested broad']:
                    info["student_name"] = name
                    break
        
        return info
        
    @staticmethod
    def detect_sections(text: str) -> Dict[str, bool]:
        """Rule-based approach to detect required sections"""
        text_lower = text.lower()
        
        return {
            "has_observations": "observation" in text_lower,
            "has_trait_mapping": "trait mapping" in text_lower or ("trait" in text_lower and "mapping" in text_lower),
            "has_interpretation": "interpretation" in text_lower,
            "has_conclusion": "conclusion" in text_lower
        }
