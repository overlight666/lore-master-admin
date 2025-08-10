# Bulk Import Questions Documentation

The bulk import functionality supports multiple formats for importing questions into the system.

## Supported Formats

### 1. File Upload (CSV/JSON)

#### CSV Format
- Headers: `question,choices,correctAnswer,level,explanation`
- Use pipe (|) to separate multiple choices
- Example:
```csv
question,choices,correctAnswer,level,explanation
"What is 2+2?","2|3|4|5","4","1","Basic arithmetic"
"What is the capital of France?","Paris|London|Berlin|Madrid","Paris","1","France's capital city"
```

#### JSON File Format
- Array of question objects
- Example: See `sample-questions.json`

### 2. Text Paste

#### Structured Text Format
```
Question 1 – (Easy)
Who is known as the Firebrand and was one of the founding members of the Gatewatch?
A) Liliana Vess  B) Chandra Nalaar  C) Jaya Ballard  D) Elspeth Tirel
Answer: B) Chandra Nalaar

Question 2 – (Medium)
Which plane is home to the gothic horror setting?
A) Ravnica  B) Zendikar  C) Innistrad  D) Dominaria
Answer: C) Innistrad
```

#### JSON Paste Format
Can paste JSON directly into the text area:
```json
[
  {
    "question": "What is 2+2?",
    "choices": ["2", "3", "4", "5"],
    "correctAnswer": "4",
    "level": 1,
    "explanation": "Basic arithmetic"
  }
]
```

## Features

### Level Assignment
- **With Levels**: Questions with specified difficulty levels (Easy=1, Medium=2, Hard=3)
- **Without Levels**: Questions without difficulty levels are randomly distributed across levels 1-3
- **JSON**: If "level" field is missing, random level assignment is applied

### Validation
- **Duplicate Detection**: Checks for duplicates within import data and against existing database questions
- **Required Fields**: Validates that each question has text, choices, and correct answer
- **Choice Validation**: Ensures correct answer exists in the choices array
- **Real-time Feedback**: Shows validation results as you paste/upload

### Error Handling
- **Individual Import**: Questions are imported one by one, so partial failures don't affect successful imports
- **Error Reporting**: Clear feedback on successful and failed imports
- **Format Flexibility**: Handles various text formats and recovers from parsing errors

## Sample Files

1. `sample-questions.csv` - CSV format with levels
2. `sample-questions.json` - JSON format with levels
3. `sample-questions-no-levels.txt` - Structured text without levels (random assignment)
4. `sample-questions-no-levels.json` - JSON format without levels (random assignment)

## Usage Tips

1. **Large Imports**: For large question sets, use CSV or JSON files rather than pasting text
2. **Validation**: Always review the preview before importing
3. **Duplicates**: The system will warn about duplicates but won't prevent import - manually review warnings
4. **Mixed Formats**: Don't mix different formats in a single import
5. **Encoding**: Ensure proper UTF-8 encoding for special characters
