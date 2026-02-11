"""
Amazon Polly Available Voices

This module contains a comprehensive list of available Amazon Polly neural voices
organized by language and gender for easy selection in the story narration feature.
"""

# Available Amazon Polly Neural Voices
# Neural voices provide the best quality and natural-sounding speech
POLLY_NEURAL_VOICES = {
    'en-US': [
        {'id': 'Joanna', 'name': 'Joanna', 'gender': 'Female', 'neural': True},
        {'id': 'Matthew', 'name': 'Matthew', 'gender': 'Male', 'neural': True},
        {'id': 'Ivy', 'name': 'Ivy', 'gender': 'Female', 'neural': True},
        {'id': 'Joey', 'name': 'Joey', 'gender': 'Male', 'neural': True},
        {'id': 'Justin', 'name': 'Justin', 'gender': 'Male', 'neural': True},
        {'id': 'Kendra', 'name': 'Kendra', 'gender': 'Female', 'neural': True},
        {'id': 'Kimberly', 'name': 'Kimberly', 'gender': 'Female', 'neural': True},
        {'id': 'Salli', 'name': 'Salli', 'gender': 'Female', 'neural': True},
    ],
    'en-GB': [
        {'id': 'Amy', 'name': 'Amy', 'gender': 'Female', 'neural': True},
        {'id': 'Emma', 'name': 'Emma', 'gender': 'Female', 'neural': True},
        {'id': 'Brian', 'name': 'Brian', 'gender': 'Male', 'neural': True},
    ],
    'en-AU': [
        {'id': 'Nicole', 'name': 'Nicole', 'gender': 'Female', 'neural': True},
        {'id': 'Russell', 'name': 'Russell', 'gender': 'Male', 'neural': True},
        {'id': 'Olivia', 'name': 'Olivia', 'gender': 'Female', 'neural': True},
    ],
    'es-ES': [
        {'id': 'Conchita', 'name': 'Conchita', 'gender': 'Female', 'neural': True},
        {'id': 'Lucia', 'name': 'Lucia', 'gender': 'Female', 'neural': True},
        {'id': 'Enrique', 'name': 'Enrique', 'gender': 'Male', 'neural': True},
    ],
    'es-US': [
        {'id': 'Lupe', 'name': 'Lupe', 'gender': 'Female', 'neural': True},
        {'id': 'Penelope', 'name': 'Penelope', 'gender': 'Female', 'neural': True},
        {'id': 'Miguel', 'name': 'Miguel', 'gender': 'Male', 'neural': True},
    ],
    'fr-FR': [
        {'id': 'Celine', 'name': 'Celine', 'gender': 'Female', 'neural': True},
        {'id': 'Lea', 'name': 'Lea', 'gender': 'Female', 'neural': True},
        {'id': 'Mathieu', 'name': 'Mathieu', 'gender': 'Male', 'neural': True},
    ],
    'de-DE': [
        {'id': 'Marlene', 'name': 'Marlene', 'gender': 'Female', 'neural': True},
        {'id': 'Vicki', 'name': 'Vicki', 'gender': 'Female', 'neural': True},
        {'id': 'Hans', 'name': 'Hans', 'gender': 'Male', 'neural': True},
    ],
    'it-IT': [
        {'id': 'Carla', 'name': 'Carla', 'gender': 'Female', 'neural': True},
        {'id': 'Bianca', 'name': 'Bianca', 'gender': 'Female', 'neural': True},
        {'id': 'Giorgio', 'name': 'Giorgio', 'gender': 'Male', 'neural': True},
    ],
    'pt-BR': [
        {'id': 'Vitoria', 'name': 'Vitoria', 'gender': 'Female', 'neural': True},
        {'id': 'Camila', 'name': 'Camila', 'gender': 'Female', 'neural': True},
        {'id': 'Ricardo', 'name': 'Ricardo', 'gender': 'Male', 'neural': True},
    ],
    'ja-JP': [
        {'id': 'Mizuki', 'name': 'Mizuki', 'gender': 'Female', 'neural': True},
        {'id': 'Takumi', 'name': 'Takumi', 'gender': 'Male', 'neural': True},
    ],
    'ko-KR': [
        {'id': 'Seoyeon', 'name': 'Seoyeon', 'gender': 'Female', 'neural': True},
    ],
    'zh-CN': [
        {'id': 'Zhiyu', 'name': 'Zhiyu', 'gender': 'Female', 'neural': True},
    ],
}

# Default voice for each language
DEFAULT_VOICES = {
    'en-US': 'Joanna',
    'en-GB': 'Amy',
    'en-AU': 'Nicole',
    'es-ES': 'Conchita',
    'es-US': 'Lupe',
    'fr-FR': 'Celine',
    'de-DE': 'Marlene',
    'it-IT': 'Carla',
    'pt-BR': 'Vitoria',
    'ja-JP': 'Mizuki',
    'ko-KR': 'Seoyeon',
    'zh-CN': 'Zhiyu',
}

def get_available_voices(language_code='en-US'):
    """
    Get list of available voices for a specific language.
    
    Args:
        language_code (str): Language code (default: 'en-US')
    
    Returns:
        list: List of voice dictionaries with id, name, gender, neural
    """
    return POLLY_NEURAL_VOICES.get(language_code, POLLY_NEURAL_VOICES['en-US'])

def get_all_voices():
    """
    Get all available voices across all languages.
    
    Returns:
        dict: Dictionary mapping language codes to lists of voices
    """
    return POLLY_NEURAL_VOICES

def get_default_voice(language_code='en-US'):
    """
    Get default voice for a language.
    
    Args:
        language_code (str): Language code (default: 'en-US')
    
    Returns:
        str: Voice ID
    """
    return DEFAULT_VOICES.get(language_code, 'Joanna')

def is_valid_voice(voice_id, language_code='en-US'):
    """
    Check if a voice ID is valid for a language.
    
    Args:
        voice_id (str): Voice ID to check
        language_code (str): Language code (default: 'en-US')
    
    Returns:
        bool: True if voice is valid, False otherwise
    """
    voices = get_available_voices(language_code)
    return any(voice['id'] == voice_id for voice in voices)

