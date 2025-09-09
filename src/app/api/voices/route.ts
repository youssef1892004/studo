import { NextResponse } from 'next/server';

const voices = [
  {"gender":"Female","language":"ar-DZ","name":"ar-DZ-AminaNeural"},
  {"gender":"Male","language":"ar-DZ","name":"ar-DZ-IsmaelNeural"},
  {"gender":"Male","language":"ar-BH","name":"ar-BH-AliNeural"},
  {"gender":"Female","language":"ar-BH","name":"ar-BH-LailaNeural"},
  {"gender":"Female","language":"ar-EG","name":"ar-EG-SalmaNeural"},
  {"gender":"Male","language":"ar-EG","name":"ar-EG-ShakirNeural"},
  {"gender":"Male","language":"ar-IQ","name":"ar-IQ-BasselNeural"},
  {"gender":"Female","language":"ar-IQ","name":"ar-IQ-RanaNeural"},
  {"gender":"Female","language":"ar-JO","name":"ar-JO-SanaNeural"},
  {"gender":"Male","language":"ar-JO","name":"ar-JO-TaimNeural"},
  {"gender":"Male","language":"ar-KW","name":"ar-KW-FahedNeural"},
  {"gender":"Female","language":"ar-KW","name":"ar-KW-NouraNeural"},
  {"gender":"Female","language":"ar-LB","name":"ar-LB-LaylaNeural"},
  {"gender":"Male","language":"ar-LB","name":"ar-LB-RamiNeural"},
  {"gender":"Female","language":"ar-LY","name":"ar-LY-ImanNeural"},
  {"gender":"Male","language":"ar-LY","name":"ar-LY-OmarNeural"},
  {"gender":"Male","language":"ar-MA","name":"ar-MA-JamalNeural"},
  {"gender":"Female","language":"ar-MA","name":"ar-MA-MounaNeural"},
  {"gender":"Male","language":"ar-OM","name":"ar-OM-AbdullahNeural"},
  {"gender":"Female","language":"ar-OM","name":"ar-OM-AyshaNeural"},
  {"gender":"Female","language":"ar-QA","name":"ar-QA-AmalNeural"},
  {"gender":"Male","language":"ar-QA","name":"ar-QA-MoazNeural"},
  {"gender":"Male","language":"ar-SA","name":"ar-SA-HamedNeural"},
  {"gender":"Female","language":"ar-SA","name":"ar-SA-ZariyahNeural"},
  {"gender":"Female","language":"ar-SY","name":"ar-SY-AmanyNeural"},
  {"gender":"Male","language":"ar-SY","name":"ar-SY-LaithNeural"},
  {"gender":"Male","language":"ar-TN","name":"ar-TN-HediNeural"},
  {"gender":"Female","language":"ar-TN","name":"ar-TN-ReemNeural"},
  {"gender":"Female","language":"ar-AE","name":"ar-AE-FatimaNeural"},
  {"gender":"Male","language":"ar-AE","name":"ar-AE-HamdanNeural"},
  {"gender":"Female","language":"ar-YE","name":"ar-YE-MaryamNeural"},
  {"gender":"Male","language":"ar-YE","name":"ar-YE-SalehNeural"}
];

export async function GET() {
  return NextResponse.json(voices);
}