import { OVERSEAS_PROVINCE } from './overseas-locations';

export { OVERSEAS_PROVINCE, OVERSEAS_COUNTRIES, isOverseasProvince, formatProfileLocation } from './overseas-locations';

export const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'KPK',
  'Balochistan',
  'Islamabad',
  'Gilgit-Baltistan',
  'AJK',
] as const;

export const ALL_LOCATION_PROVINCES = [...PAKISTAN_PROVINCES, OVERSEAS_PROVINCE] as const;

export type PakistanProvince = (typeof PAKISTAN_PROVINCES)[number];

export const PROVINCE_LABELS: Record<string, string> = {
  Punjab: 'Punjab',
  Sindh: 'Sindh',
  KPK: 'Khyber Pakhtunkhwa',
  Balochistan: 'Balochistan',
  Islamabad: 'Islamabad Capital Territory',
  'Gilgit-Baltistan': 'Gilgit-Baltistan',
  AJK: 'Azad Jammu & Kashmir',
  Overseas: 'Overseas / Abroad',
};

export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Sialkot', 'Bahawalpur',
    'Sheikhupura', 'Sargodha', 'Jhang', 'Gujrat', 'Kasur', 'Rahim Yar Khan', 'Sahiwal', 'Okara',
    'Wah Cantonment', 'Dera Ghazi Khan', 'Burewala', 'Chiniot', 'Kamoke', 'Hafizabad', 'Khanewal',
    'Muzaffargarh', 'Muridke', 'Pakpattan', 'Jhelum', 'Vehari', 'Attock', 'Mandi Bahauddin',
    'Chakwal', 'Toba Tek Singh', 'Khushab', 'Mianwali', 'Bhakkar', 'Layyah', 'Narowal',
    'Kot Addu', 'Ahmadpur East', 'Wazirabad', 'Daska', 'Gojra', 'Samundri', 'Chishtian',
    'Hasilpur', 'Arifwala', 'Lodhran', 'Jampur', 'Haroonabad', 'Kabirwala', 'Rajanpur',
    'Taunsa', 'Liaquatpur', 'Minchinabad', 'Fort Abbas', 'Nankana Sahib', 'Pattoki', 'Shakargarh',
    'Pasrur', 'Sambrial', 'Kamalia', 'Pir Mahal', 'Bhalwal', 'Dipalpur', 'Renala Khurd',
    'Chunian', 'Kot Radha Kishan', 'Eminabad', 'Hujra Shah Muqeem', 'Dunyapur', 'Kanganpur',
    'Talagang', 'Pind Dadan Khan', 'Phalia', 'Baddomalhi', 'Zahir Pir', 'Kot Mithan',
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpur Khas', 'Nawabshah', 'Jacobabad',
    'Shikarpur', 'Khairpur', 'Dadu', 'Thatta', 'Badin', 'Sanghar', 'Umerkot', 'Ghotki',
    'Kotri', 'Hala', 'Matiari', 'Tando Allahyar', 'Tando Muhammad Khan', 'Jamshoro',
    'Naushahro Feroze', 'Qambar Shahdadkot', 'Kashmore', 'Kandhkot', 'Ratodero', 'Sehwan',
    'Moro', 'Shahdadpur', 'Digri', 'Kunri', 'Pano Aqil', 'Rohri', 'Gambat', 'Mehar',
    'Khipro', 'Ranipur', 'Dokri', 'Mehrabpur', 'Mithi', 'Islamkot', 'Daharki', 'Ubauro',
    'Warah', 'Hingorja', 'Miro Khan', 'Kandiaro', 'Sakrand', 'Naudero', 'Shahpur Chakar',
    'Sinjhoro', 'Madeji', 'Bhiria', 'Daur', 'Talhar', 'Gharo', 'Gadap', 'Malir', 'Korangi',
  ],
  KPK: [
    'Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Abbottabad', 'Dera Ismail Khan', 'Bannu',
    'Mansehra', 'Charsadda', 'Nowshera', 'Swabi', 'Haripur', 'Karak', 'Chitral', 'Timergara',
    'Parachinar', 'Tank', 'Lakki Marwat', 'Batkhela', 'Khalabat', 'Topi', 'Pabbi', 'Barikot',
    'Shabqadar', 'Landi Kotal', 'Hangu', 'Buner', 'Dir', 'Malakand', 'Matta', 'Kulachi',
    'Tangi', 'Risalpur', 'Jehangira', 'Amangarh', 'Tordher', 'Daggar', 'Alpuri', 'Besham',
    'Naran', 'Kaghan', 'Balakot', 'Battagram', 'Oghi', 'Havelian', 'Taxila', 'Kahuta',
  ],
  Balochistan: [
    'Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Zhob', 'Dera Murad Jamali',
    'Sibi', 'Loralai', 'Mastung', 'Nushki', 'Kalat', 'Pasni', 'Panjgur', 'Usta Muhammad',
    'Surab', 'Nokkundi', 'Washuk', 'Dalbandin', 'Kharan', 'Muslim Bagh', 'Wadh', 'Awaran',
    'Qila Saifullah', 'Pishin', 'Killa Abdullah', 'Bela', 'Uthal', 'Lasbela', 'Ormara',
    'Jiwani', 'Tump', 'Mand', 'Hoshab', 'Sohbatpur', 'Gandava', 'Mach', 'Duki', 'Kohlu',
    'Barkhan', 'Musakhel', 'Ziarat', 'Harnai', 'Dera Bugti', 'Jaffarabad', 'Nasirabad',
  ],
  Islamabad: [
    'Islamabad', 'F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10',
    'G-11', 'G-13', 'G-15', 'I-8', 'I-9', 'I-10', 'I-11', 'E-7', 'E-11', 'Bahria Town',
    'DHA Islamabad', 'Tarlai', 'Bara Kahu', 'Tarnol', 'Sihala', 'Rawal Town',
  ],
  'Gilgit-Baltistan': [
    'Gilgit', 'Skardu', 'Hunza', 'Aliabad', 'Ghizer', 'Gahkuch', 'Ghanche', 'Khaplu',
    'Diamer', 'Chilas', 'Astore', 'Eidgah', 'Shigar', 'Nagar', 'Ishkoman', 'Yasin',
    'Gupis', 'Phander', 'Juglot', 'Sost', 'Passu', 'Minimarg', 'Rama', 'Bagrot',
  ],
  AJK: [
    'Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot', 'Bagh', 'Bhimber', 'Neelum', 'Athmuqam',
    'Hattian Bala', 'Haveli', 'Poonch', 'Sudhanoti', 'Palandri', 'Sehnsa', 'Chakswari',
    'Dadyal', 'Islamgarh', 'Khuiratta', 'Nakyal', 'Samahni', 'Forward Kahuta', 'Hajira',
    'Plandri', 'Chikar', 'Kel', 'Sharda', 'Leepa', 'Hattian',
  ],
};

export function citiesForProvince(province?: string | null): string[] {
  if (!province || province === OVERSEAS_PROVINCE) return [];
  return CITIES_BY_PROVINCE[province] ?? [];
}

export function allPakistanCities(): string[] {
  const cities = new Set<string>();
  for (const list of Object.values(CITIES_BY_PROVINCE)) {
    for (const city of list) cities.add(city);
  }
  return [...cities].sort((a, b) => a.localeCompare(b));
}

export function provinceLabel(province: string): string {
  return PROVINCE_LABELS[province] ?? province;
}
