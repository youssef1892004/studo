// src/app/api/voices/route.ts

import { NextResponse } from 'next/server';
import { Voice } from '@/lib/types';

// القائمة الكاملة والدقيقة من ملف PDF لتحديد الجنس
const voiceGenderMap: Record<string, Voice['gender']> = {
    // Arabic Voices
    "Amina": "Female", "Ismael": "Male", "Ali": "Male", "Laila": "Female",
    "Salma": "Female", "Shakir": "Male", "Bassel": "Male", "Rana": "Female",
    "Sana": "Female", "Taim": "Male", "Fahed": "Male", "Noura": "Female",
    "Layla": "Female", "Rami": "Male", "Iman": "Female", "Omar": "Male",
    "Jamal": "Male", "Mouna": "Female", "Abdullah": "Male", "Aysha": "Female",
    "Amal": "Female", "Moaz": "Male", "Hamed": "Male", "Zariyah": "Female",
    "Amany": "Female", "Laith": "Male", "Hedi": "Male", "Reem": "Female",
    "Fatima": "Female", "Hamdan": "Male", "Maryam": "Female", "Saleh": "Male",

    // Other Voices from PDF
    'Adri': 'Female', 'Willem': 'Male', 'Anila': 'Female', 'Ilir': 'Male',
    'Ameha': 'Male', 'Mekdes': 'Female', 'Babek': 'Male', 'Banu': 'Female',
    'Nabanita': 'Female', 'Pradeep': 'Male', 'Bashkar': 'Male', 'Tanishaa': 'Female',
    'Goran': 'Male', 'Vesna': 'Female', 'Borislav': 'Male', 'Kalina': 'Female',
    'Nilar': 'Female', 'Thiha': 'Male', 'Alba': 'Female', 'Enric': 'Male',
    'HiuGaai': 'Female', 'WanLung': 'Male', 'Xiaoxiao': 'Female', 'Yunxi': 'Male',
    'Yunjian': 'Male', 'Yunyang': 'Male', 'Xiaobei': 'Female', 'Xiaoni': 'Female',
    'HiuMaan': 'Female', 'HsiaoChen': 'Female', 'YunJhe': 'Male', 'HsiaoYu': 'Female',
    'Gabrijela': 'Female', 'Srecko': 'Male', 'Antonin': 'Male', 'Vlasta': 'Female',
    'Christel': 'Female', 'Jeppe': 'Male', 'Arnaud': 'Male', 'Dena': 'Female',
    'Colette': 'Female', 'Fenna': 'Female', 'Maarten': 'Male', 'Natasha': 'Female', 
    'William': 'Male', 'Clara': 'Female', 'Liam': 'Male', 'Sam': 'Male', 
    'Yan': 'Female', 'Neerja': 'Female', 'Prabhat': 'Male', 'Emily': 'Female', 
    'Connor': 'Male', 'Asilia': 'Female', 'Chilemba': 'Male', 'Mitchell': 'Male', 
    'Molly': 'Female', 'Abeo': 'Male', 'Ezinne': 'Female', 'James': 'Male', 
    'Rosa': 'Female', 'Luna': 'Female', 'Wayne': 'Male', 'Leah': 'Female', 
    'Luke': 'Male', 'Elimu': 'Male', 'Imani': 'Female', 'Libby': 'Female', 
    'Maisie': 'Female', 'Ryan': 'Male', 'Sonia': 'Female', 'Thomas': 'Male', 
    'Ana': 'Female', 'Aria': 'Female', 'Christopher': 'Male', 'Eric': 'Male', 
    'Guy': 'Male', 'Jenny': 'Female', 'Michelle': 'Female', 'Roger': 'Male', 
    'Steffan': 'Male', 'Anu': 'Female', 'Kert': 'Male', 'Angelo': 'Male', 
    'Blessica': 'Female', 'Harri': 'Male', 'Noora': 'Female', 'Charline': 'Female', 
    'Gerard': 'Male', 'Antoine': 'Male', 'Jean': 'Male', 'Sylvie': 'Female', 
    'Thierry': 'Male', 'Alain': 'Male', 'Brigitte': 'Female', 'Celeste': 'Female', 
    'Claude': 'Male', 'Coralie': 'Female', 'Denise': 'Female', 'Eloise': 'Female', 
    'Henri': 'Male', 'Jacques': 'Male', 'Jerome': 'Male', 'Julie': 'Female', 
    'Paul': 'Male', 'Vivienne': 'Female', 'Ingrid': 'Female', 'Jonas': 'Male', 
    'Jan': 'Male', 'Leni': 'Female', 'Amala': 'Female', 'Conrad': 'Male', 
    'Katja': 'Female', 'Killian': 'Male', 'Klarissa': 'Female', 'Klaus': 'Male', 
    'Louisa': 'Female', 'Maja': 'Female', 'Ralf': 'Male', 'Tanja': 'Female', 
    'Athina': 'Female', 'Nestoras': 'Male', 'Diego': 'Male', 'Elsa': 'Female',
    'Rachel': 'Female', 'Clyde': 'Male', 'Sarah': 'Female', 'George': 'Male',
    'Callum': 'Male', 'River': 'Female', 'Harry': 'Male', 'Alice': 'Female',
    'Matilda': 'Female', 'Will': 'Male', 'Jessica': 'Female', 'Brian': 'Male',
    'Daniel': 'Male', 'Lily': 'Female', 'Bill': 'Male'
};

const getCountryName = (code: string): string => {
    const countries: Record<string, string> = {
        'SA': 'السعودية', 'EG': 'مصر', 'AE': 'الإمارات', 'KW': 'الكويت', 'QA': 'قطر',
        'BH': 'البحرين', 'OM': 'عُمان', 'YE': 'اليمن', 'DZ': 'الجزائر', 'MA': 'المغرب',
        'TN': 'تونس', 'LY': 'ليبيا', 'IQ': 'العراق', 'JO': 'الأردن', 'LB': 'لبنان', 'SY': 'سوريا',
        'ZA': 'جنوب أفريقيا', 'AL': 'ألبانيا', 'ET': 'إثيوبيا', 'AZ': 'أذربيجان', 'BD': 'بنغلاديش',
        'IN': 'الهند', 'BA': 'البوسنة والهرسك', 'BG': 'بلغاريا', 'MM': 'ميانمار', 'ES': 'إسبانيا',
        'CN': 'الصين', 'HK': 'هونغ كونغ', 'TW': 'تايوان', 'HR': 'كرواتيا', 'CZ': 'التشيك',
        'DK': 'الدنمارك', 'BE': 'بلجيكا', 'NL': 'هولندا', 'AU': 'أستراليا', 'CA': 'كندا',
        'IE': 'أيرلندا', 'KE': 'كينيا', 'NZ': 'نيوزيلندا', 'NG': 'نيجيريا', 'PH': 'الفلبين',
        'SG': 'سنغافورة', 'TZ': 'تنزانيا', 'GB': 'بريطانيا', 'US': 'الولايات المتحدة', 'EE': 'إستونيا',
        'FI': 'فنلندا', 'FR': 'فرنسا', 'AT': 'النمسا', 'CH': 'سويسرا', 'DE': 'ألمانيا',
        'GR': 'اليونان', 'IT': 'إيطاليا'
    };
    return countries[code.toUpperCase()] || code.toUpperCase();
}

const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
        'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'az': 'Azerbaijani',
        'bn': 'Bengali', 'bs': 'Bosnian', 'bg': 'Bulgarian', 'my': 'Burmese', 'ca': 'Catalan',
        'yue': 'Cantonese', 'zh': 'Chinese', 'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish',
        'nl': 'Dutch', 'en': 'English', 'et': 'Estonian', 'fil': 'Filipino', 'fi': 'Finnish',
        'fr': 'French', 'de': 'German', 'el': 'Greek', 'it': 'Italian'
    };
    return languages[code.toLowerCase()] || code.toLowerCase();
}

export async function GET() {
  try {
    const provider = process.env.TTS_PROVIDER_NAME || 'ghaymah';
    const voicesResponse = await fetch(`${process.env.TTS_API_BASE_URL}/tts/voices/${provider}`);

    if (!voicesResponse.ok) {
      const errorData = await voicesResponse.json();
      throw new Error(errorData.detail || 'Failed to fetch voices from provider');
    }
    const voicesData = await voicesResponse.json();
    
    const formattedVoices: Voice[] = voicesData.map((voice: any) => {
        const parts = voice.voice_id.split('-');
        const langCode = parts.length > 0 ? parts[0] : 'unk';
        const countryCode = parts.length > 1 ? parts[1].toUpperCase() : 'UNK';
        
        // --- === الإصلاح النهائي والدقيق هنا === ---
        // 1. نأخذ الاسم من المصدر (voice.name) كأولوية.
        // 2. إذا لم يكن موجودًا، نستخلصه من `voice_id`.
        // 3. نستخدم `.replace('Neural', '')` لإزالة الكلمة.
        // 4. نستخدم `.trim()` لإزالة أي مسافات زائدة في البداية أو النهاية. هذا هو الحل للمشكلة.
        const characterName = (voice.name || (parts.length > 2 ? parts[2] : voice.voice_id))
            .replace('Neural', '')
            .trim();

        return {
            name: voice.voice_id,
            gender: voiceGenderMap[characterName] || 'Not specified',
            languageName: getLanguageName(langCode),
            languageCode: langCode,
            countryName: getCountryName(countryCode),
            countryCode: countryCode,
            characterName: characterName
        };
    });

    return NextResponse.json(formattedVoices);

  } catch (error: any) {
    console.error("Error fetching voices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}