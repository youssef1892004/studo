export interface Voice {
  gender: string;
  language: string;
  name: string;
}

export interface AudioResult {
  id: string;
  text: string;
  voice: string;
  audioUrl: string;
  createdAt: string;
}

export interface TTSCardData {
  id: string;
  text: string;
  voice: string;
}
