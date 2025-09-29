// src/app/api/voices/route.ts

import { NextResponse } from 'next/server';
import { Voice } from '@/lib/types';

// --- دالة مساعدة للحصول على توكن الوصول لخدمة TTS الخارجية ---
async function getAccessToken() {
  if (!process.env.TTS_API_BASE_URL || !process.env.TTS_API_USERNAME || !process.env.TTS_API_PASSWORD) {
    throw new Error("TTS Service environment variables are not configured");
  }
  const response = await fetch(`${process.env.TTS_API_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: process.env.TTS_API_USERNAME!,
      password: process.env.TTS_API_PASSWORD!,
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
      const errorBody = await response.text();
      console.error("TTS Token Auth Failed:", errorBody);
      throw new Error('Failed to authenticate with external TTS service');
  }
  const data = await response.json();
  return data.access_token;
}
// ------------------------------------------------------------


// --- القائمة النهائية والدقيقة لتحديد الجنس باستخدام معرف الصوت (Voice ID) ---
const voiceGenderMap: Record<string, Voice['gender']> = {
    // Custom English Voices
    "21m00Tcm4TlvDq8ikWAM": "Female", // Rachel
    "2EiwWnXFnvU5JabPnv8n": "Male",   // Clyde
    "CwhRBWXzGAHq8TQ4": "Male",       // Roger
    "IKne3meq5aSn9XLyUdCD": "Male",   // Charlie
    "XB0fDUnXU5powFXDhCwa": "Female", // Charlotte
    "LcfcDJNUP1GQjkzn1xUU": "Female", // Emily
    "pFZP5JQG7iQjIQuC4Bku": "Female", // Serena
    "pNInz6obpgDQGcFmaJgB": "Male",   // Adam
    "piTKgcLEGmPE4e6mEKli": "Female", // Nicole
    "txGEqnHWrfWFTfGW9XjX": "Female", // Jessica
    "yoZ06aMxZJJ28mfd3POQ": "Male",   // Sam
    "z9fAnlkpzviPz146aGWa": "Female", // Glinda
    "onwK4e9ZLuTAKqWW03F9": "Male",   // Brian
    "JBFqnCBsd6RMkjVDRZzb": "Male",   // Chris
    "cjVigY5qzO86Huf0OWal": "Male",   // Eric
    "g5CIjZEefAph4nQFvHAz": "Male",   // Ethan
    "J6BwR6CZkQd0atAWU0b8": "Male",   // George
    "VR6AewLTigWG4xSOukaG": "Male",   // Paul
    "EXAVITQu4vr4xnSDxMaL": "Female", // Sarah
    "D38z5RcWu1voky8WS1ja": "Male",   // Bill
    "FGY2WhTYpPnrIDTdsKH5": "Female", // Laura

    // Neural Voices from PDF & User List
    "af-ZA-AdriNeural": "Female", "af-ZA-WillemNeural": "Male",
    "sq-AL-AnilaNeural": "Female", "sq-AL-IlirNeural": "Male",
    "am-ET-AmehaNeural": "Male", "am-ET-MekdesNeural": "Female",
    "ar-DZ-AminaNeural": "Female", "ar-DZ-IsmaelNeural": "Male",
    "ar-BH-AliNeural": "Male", "ar-BH-LailaNeural": "Female",
    "ar-EG-SalmaNeural": "Female", "ar-EG-ShakirNeural": "Male",
    "ar-IQ-BasselNeural": "Male", "ar-IQ-RanaNeural": "Female",
    "ar-JO-SanaNeural": "Female", "ar-JO-TaimNeural": "Male",
    "ar-KW-FahedNeural": "Male", "ar-KW-NouraNeural": "Female",
    "ar-LB-LaylaNeural": "Female", "ar-LB-RamiNeural": "Male",
    "ar-LY-ImanNeural": "Female", "ar-LY-OmarNeural": "Male",
    "ar-MA-JamalNeural": "Male", "ar-MA-MounaNeural": "Female",
    "ar-OM-AbdullahNeural": "Male", "ar-OM-AyshaNeural": "Female",
    "ar-QA-AmalNeural": "Female", "ar-QA-MoazNeural": "Male",
    "ar-SA-HamedNeural": "Male", "ar-SA-ZariyahNeural": "Female",
    "ar-SY-AmanyNeural": "Female", "ar-SY-LaithNeural": "Male",
    "ar-TN-HediNeural": "Male", "ar-TN-ReemNeural": "Female",
    "ar-AE-FatimaNeural": "Female", "ar-AE-HamdanNeural": "Male",
    "ar-YE-MaryamNeural": "Female", "ar-YE-SalehNeural": "Male",
    "az-AZ-BabekNeural": "Male", "az-AZ-BanuNeural": "Female",
    "bn-BD-NabanitaNeural": "Female", "bn-BD-PradeepNeural": "Male",
    "bn-IN-BashkarNeural": "Male", "bn-IN-TanishaaNeural": "Female",
    "bs-BA-GoranNeural": "Male", "bs-BA-VesnaNeural": "Female",
    "bg-BG-BorislavNeural": "Male", "bg-BG-KalinaNeural": "Female",
    "my-MM-NilarNeural": "Female", "my-MM-ThihaNeural": "Male",
    "ca-ES-AlbaNeural": "Female", "ca-ES-EnricNeural": "Male",
    "yue-CN-HiuGaaiNeural": "Female", "yue-CN-WanLungNeural": "Male",
    "zh-CN-XiaoxiaoNeural": "Female", "zh-CN-YunxiNeural": "Male",
    "zh-CN-YunjianNeural": "Male", "zh-CN-YunyangNeural": "Male",
    "zh-CN-liaoning-XiaobeiNeural": "Female", "zh-CN-shaanxi-XiaoniNeural": "Female",
    "zh-HK-HiuMaanNeural": "Female", "zh-HK-WanLungNeural": "Male",
    "zh-HK-HiuGaaiNeural": "Female", "zh-TW-HsiaoChenNeural": "Female",
    "zh-TW-YunJheNeural": "Male", "zh-TW-HsiaoYuNeural": "Female",
    "hr-HR-GabrijelaNeural": "Female", "hr-HR-SreckoNeural": "Male",
    "cs-CZ-AntoninNeural": "Male", "cs-CZ-VlastaNeural": "Female",
    "da-DK-ChristelNeural": "Female", "da-DK-JeppeNeural": "Male",
    "nl-BE-ArnaudNeural": "Male", "nl-BE-DenaNeural": "Female",
    "nl-NL-ColetteNeural": "Female", "nl-NL-FennaNeural": "Female", "nl-NL-MaartenNeural": "Male",
    "en-AU-NatashaNeural": "Female", "en-AU-WilliamNeural": "Male",
    "en-CA-ClaraNeural": "Female", "en-CA-LiamNeural": "Male",
    "en-HK-SamNeural": "Male", "en-HK-YanNeural": "Female",
    "en-IN-NeerjaNeural": "Female", "en-IN-PrabhatNeural": "Male",
    "en-IE-EmilyNeural": "Female", "en-IE-ConnorNeural": "Male",
    "en-KE-AsiliaNeural": "Female", "en-KE-ChilembaNeural": "Male",
    "en-NZ-MitchellNeural": "Male", "en-NZ-MollyNeural": "Female",
    "en-NG-AbeoNeural": "Male", "en-NG-EzinneNeural": "Female",
    "en-PH-JamesNeural": "Male", "en-PH-RosaNeural": "Female",
    "en-SG-LunaNeural": "Female", "en-SG-WayneNeural": "Male",
    "en-ZA-LeahNeural": "Female", "en-ZA-LukeNeural": "Male",
    "en-TZ-ElimuNeural": "Male", "en-TZ-ImaniNeural": "Female",
    "en-GB-LibbyNeural": "Female", "en-GB-MaisieNeural": "Female", "en-GB-RyanNeural": "Male",
    "en-GB-SoniaNeural": "Female", "en-GB-ThomasNeural": "Male",
    "en-US-AnaNeural": "Female", "en-US-AriaNeural": "Female", "en-US-ChristopherNeural": "Male",
    "en-US-EricNeural": "Male", "en-US-GuyNeural": "Male", "en-US-JennyNeural": "Female",
    "en-US-MichelleNeural": "Female", "en-US-RogerNeural": "Male", "en-US-SteffanNeural": "Male",
    "et-EE-AnuNeural": "Female", "et-EE-KertNeural": "Male",
    "fil-PH-AngeloNeural": "Male", "fil-PH-BlessicaNeural": "Female",
    "fi-FI-HarriNeural": "Male", "fi-FI-NooraNeural": "Female",
    "fr-BE-CharlineNeural": "Female", "fr-BE-GerardNeural": "Male",
    "fr-CA-AntoineNeural": "Male", "fr-CA-JeanNeural": "Male", "fr-CA-SylvieNeural": "Female",
    "fr-CA-ThierryNeural": "Male", "fr-FR-AlainNeural": "Male", "fr-FR-BrigitteNeural": "Female",
    "fr-FR-CelesteNeural": "Female", "fr-FR-ClaudeNeural": "Male", "fr-FR-CoralieNeural": "Female",
    "fr-FR-DeniseNeural": "Female", "fr-FR-EloiseNeural": "Female", "fr-FR-HenriNeural": "Male",
    "fr-FR-JacquesNeural": "Male", "fr-FR-JeromeNeural": "Male", "fr-FR-JulieNeural": "Female",
    "fr-FR-PaulNeural": "Male", "fr-FR-VivienneNeural": "Female",
    "de-AT-IngridNeural": "Female", "de-AT-JonasNeural": "Male",
    "de-CH-JanNeural": "Male", "de-CH-LeniNeural": "Female",
    "de-DE-AmalaNeural": "Female", "de-DE-ConradNeural": "Male", "de-DE-KatjaNeural": "Female",
    "de-DE-KillianNeural": "Male", "de-DE-KlarissaNeural": "Female", "de-DE-KlausNeural": "Male",
    "de-DE-LouisaNeural": "Female", "de-DE-MajaNeural": "Female", "de-DE-RalfNeural": "Male",
    "de-DE-TanjaNeural": "Female", "el-GR-AthinaNeural": "Female", "el-GR-NestorasNeural": "Male",
    "it-IT-DiegoNeural": "Male", "it-IT-ElsaNeural": "Female"
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
    return countries[code.toUpperCase()] || "Global";
}

const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
        'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'az': 'Azerbaijani',
        'bn': 'Bengali', 'bs': 'Bosnian', 'bg': 'Bulgarian', 'my': 'Burmese', 'ca': 'Catalan',
        'yue': 'Cantonese', 'zh': 'Chinese', 'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish',
        'nl': 'Dutch', 'en': 'English', 'et': 'Estonian', 'fil': 'Filipino', 'fi': 'Finnish',
        'fr': 'French', 'de': 'German', 'el': 'Greek', 'it': 'Italian'
    };
    return languages[code.toLowerCase()] || "Unknown";
}

export async function GET() {
  try {
    // 1. الحصول على التوكن الخارجي لخدمة TTS
    const externalToken = await getAccessToken(); 
    
    const provider = process.env.TTS_PROVIDER_NAME || 'ghaymah';
    
    // 2. إرسال طلب جلب الأصوات مع التوكن في الـ Header
    const voicesResponse = await fetch(`${process.env.TTS_API_BASE_URL}/tts/voices/${provider}`, {
        headers: {
            'Authorization': `Bearer ${externalToken}`,
        },
        cache: 'no-store',
    });

    if (!voicesResponse.ok) {
      const errorData = await voicesResponse.json();
      throw new Error(errorData.detail || 'Failed to fetch voices from provider');
    }
    const voicesData = await voicesResponse.json();
    
    const formattedVoices: Voice[] = voicesData.map((voice: any) => {
        const voiceId = voice.voice_id;
        const parts = voiceId.split('-');
        
        const isNeural = voiceId.includes('-');
        
        const langCode = isNeural ? parts[0] : 'en';
        const countryCode = isNeural ? parts[1].toUpperCase() : 'US';
        const characterName = voice.name;

        return {
            name: voiceId,
            gender: voiceGenderMap[voiceId] || 'Not specified',
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
    return NextResponse.json({ error: error.message || "Failed to fetch voices." }, { status: 500 });
  }
}