const fs = require('fs');
const path = require('path');

const PROFILE_FILE_CANDIDATES = [
  path.join(__dirname, '..', '..', '..', 'Rishta_Profiles_Duplicates_Removed.txt'),
  path.join(__dirname, '..', 'Rishta_Profiles_Duplicates_Removed.txt'),
  path.join(__dirname, 'Rishta_Profiles_Duplicates_Removed.txt'),
];

function resolveProfileFile() {
  for (const candidate of PROFILE_FILE_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Profile file not found. Tried:\n${PROFILE_FILE_CANDIDATES.join('\n')}`);
}
const DEFAULT_PASSWORD = 'User@123';

const CITY_PROVINCE = {
  rawalpindi: 'Punjab',
  islamabad: 'Islamabad',
  lahore: 'Punjab',
  karachi: 'Sindh',
  peshawar: 'KPK',
  faisalabad: 'Punjab',
  sargodha: 'Punjab',
  multan: 'Punjab',
  taxila: 'Punjab',
  chakwal: 'Punjab',
  gujrat: 'Punjab',
  wah: 'Punjab',
  'wah cantt': 'Punjab',
  muzaffargarh: 'Punjab',
  talagang: 'Punjab',
  mianwali: 'Punjab',
  sialkot: 'Punjab',
  bahria: 'Punjab',
};

function parseHeightCm(text) {
  const heightDot = text.match(/Height\.?\s*(\d)\s*[''′](\d{1,2})/i);
  if (heightDot) {
    const feet = parseInt(heightDot[1], 10);
    const inches = parseInt(heightDot[2], 10) || 0;
    return Math.round(feet * 30.48 + inches * 2.54);
  }

  const heightComma = text.match(/Height\s*,\s*(\d)\.(\d{2})\b/i);
  if (heightComma) {
    const feet = parseInt(heightComma[1], 10);
    const inches = parseInt(heightComma[2], 10);
    return Math.round(feet * 30.48 + inches * 2.54);
  }

  const ftIn = text.match(/Height[:\s]*(\d)\s*[''′.\s]*(\d{1,2})/i)
    || text.match(/(\d)\s*[''′]\s*(\d{1,2})/i)
    || text.match(/Height[:\s]*(\d)\.(\d{1,2})/i);
  if (ftIn) {
    const feet = parseInt(ftIn[1], 10);
    const inches = parseInt(ftIn[2], 10) || 0;
    return Math.round(feet * 30.48 + inches * 2.54);
  }
  const cm = text.match(/Height[:\s]*(\d{3})\s*cm/i);
  if (cm) return parseInt(cm[1], 10);
  return 165;
}

function parseGender(displayName, body) {
  if (/^Male Profile/i.test(displayName)) return 'male';
  if (/^Female Profile/i.test(displayName)) return 'female';
  if (/Gender,\s*Male/i.test(body)) return 'male';
  if (/Gender,\s*Female/i.test(body)) return 'female';
  if (/Gender\s*:\s*Male|◼️Male|Male\s*\|/i.test(body) && !/Gender\s*:\s*Female/i.test(body.split('REQUIREMENT')[0] || body)) {
    if ((body.match(/Gender\s*:\s*Male/gi) || []).length >= (body.match(/Gender\s*:\s*Female/gi) || []).length) {
      return 'male';
    }
  }
  if (/Gender\s*:\s*Female|◼️Female|Fe\s*male|Female\s*\|/i.test(body)) return 'female';
  if (/\bGroom\b|Lieutenant in Pak Military/i.test(body)) return 'male';
  if (/\bBride\b|Hijabi girl/i.test(body)) return 'female';
  return 'female';
}

function parseMaritalStatus(personalBody) {
  if (!/\bmarital\s+st\w*/i.test(personalBody) && !/\bmerital\s+status\b/i.test(personalBody)) return null;
  if (/\bkhula\b|\bdivorced\b/i.test(personalBody) && !/without kids/i.test(personalBody)) return 'divorced';
  if (/\bwidow/i.test(personalBody)) return 'widowed';
  if (/\bdivorced\b/i.test(personalBody)) return 'divorced';
  if (/un[- ]?married|never\s+married|\bsingle\b/i.test(personalBody)) return 'never_married';
  return 'never_married';
}

function splitSections(body) {
  const markers = [
    /\n\s*💫\s*Requirements for Preferable Match/i,
    /\n\s*Requirements for Preferable Match/i,
    /\n\s*\d️⃣\s*Requirements\s*:/i,
    /\n\s*🔺\s*Demand\s*:/i,
    /\n\s*▪️?\s*Demand\s*▪️?/i,
    /\nRequirements,/i,
    /\n\s*🔵\s*Requirement\b/i,
    /\n\s*Contact details\b/i,
    /\n\s*💫?\s*Requirements?\s+for\s+/i,
    /\n\s*Requirements?\s+[A-Za-z]/i,
    /\n\s*(?:REQUIREMENT|Requirements|Demand|Partner Preferences|Life partner Requirements)\b/i,
  ];
  let splitAt = body.length;
  for (const marker of markers) {
    const idx = body.search(marker);
    if (idx >= 0 && idx < splitAt) splitAt = idx;
  }
  return {
    personal: body.slice(0, splitAt).trim(),
    requirements: body.slice(splitAt).trim(),
  };
}

function cleanFieldLabel(value) {
  return stripEmojis(value)
    .replace(/^[\s*•🔹🔅▪️👉🛑]+/, '')
    .replace(/^(?:qualification|qualifications|education|job\/business|rank\/position|position\/rank)[:\s,]*/i, '')
    .replace(/^:\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDateOfBirth(personalBody, age) {
  const dobDmy = personalBody.match(/(?:D\.?O\.?B|DOB)[:\s]*(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/i);
  if (dobDmy) {
    const day = parseInt(dobDmy[1], 10);
    const month = parseInt(dobDmy[2], 10);
    const year = parseInt(dobDmy[3], 10);
    if (year > 1900 && year < 2010) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const dobMatch = personalBody.match(/(?:D\.?O\.?B|Date of birth)[:\s]*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (dobMatch) {
    const months = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    const month = months[dobMatch[2].slice(0, 3).toLowerCase()] || 6;
    const day = parseInt(dobMatch[1], 10);
    const year = parseInt(dobMatch[3], 10);
    if (year > 1900 && year < 2010) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const yearMatch = personalBody.match(/D\.?O\.?B[:\s/]*.*?(\d{4})/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year > 1900 && year < 2010) return `${year}-06-15`;
  }

  const dobYear = 2026 - age;
  return `${dobYear}-06-15`;
}

function parseAge(personalBody) {
  const patterns = [
    /Age\.\s*(\d{2})\b/i,
    /Age,\s*(\d{2})\b/i,
    /\((\d{2})yrs?\)/i,
    /\*?▪️?Age:\*?\s*(\d{2})\s*(?:yrs|years)?/i,
    /Age[:\s*]*(\d{2})\s*(?:yrs|years)?/i,
    /(?:D\.?O\.?B|DOB)[:\s]*\d{1,2}[-/.]\d{1,2}[-/.](19\d{2}|20\d{2})/i,
    /Age\s*[:\-]?\s*(\d{2})/i,
    /\b(\d{2})\s*yrs\b/i,
    /Year of birth[:\s]*(\d{4})/i,
    /born[:\s]*(\d{4})/i,
    /oct(?:ober)?\s+(\d{4})/i,
    /nov(?:ember)?\s+(\d{4})/i,
    /jan(?:uary)?\s+(\d{4})/i,
    /may\s+(\d{4})/i,
    /dec(?:ember)?\s+(\d{4})/i,
    /\(19\d{2}\)/,
    /\(20\d{2}\)/,
  ];
  for (const p of patterns) {
    const m = personalBody.match(p);
    if (!m) continue;
    const val = parseInt(m[1], 10);
    if (val > 1900 && val < 2010) return 2026 - val;
    if (val >= 18 && val <= 55) return val;
  }
  return 28;
}

function parseProvince(body) {
  const m = body.match(/Province[:\s,]*([A-Za-z][A-Za-z\s]*)/i);
  if (!m) return null;
  const val = m[1].trim().replace(/\s{2,}.*/, '');
  return val || null;
}

function parseCity(body) {
  const explicitProvince = parseProvince(body);
  const cityLabel = body.match(/(?:▪️)?city[:\s]*\n?\s*([A-Za-z][A-Za-z\s/-]*)/i);
  if (cityLabel) {
    const city = cityLabel[1].trim().split(/\s{2,}/)[0];
    const key = city.toLowerCase();
    return {
      city: city.charAt(0).toUpperCase() + city.slice(1),
      province: explicitProvince,
      country: 'Pakistan',
    };
  }

  const belongs = body.match(/Belongs\s*\n?\s*([A-Za-z][A-Za-z\s/-]*)/i);
  if (belongs) {
    const city = belongs[1].trim();
    return { city, province: explicitProvince, country: 'Pakistan' };
  }

  const residence = body.match(/Residence(?:\s*area)?[.\s:]*\n?\s*([^\n]+)/i);
  if (residence) {
    const val = residence[1].trim();
    const known = [
      'Wah Cantt', 'Bahria Town', 'Rawalpindi', 'Islamabad', 'Lahore', 'Karachi',
      'Peshawar', 'Faisalabad', 'Sargodha', 'Taxila', 'Gujrat', 'Muzaffargarh',
      'Talagang', 'Chakwal', 'Mianwali', 'Dubai', 'London', 'Nottingham',
    ];
    for (const city of known) {
      if (val.toLowerCase().includes(city.toLowerCase())) {
        if (city === 'Bahria Town') return { city: 'Rawalpindi', province: explicitProvince, country: 'Pakistan' };
        return { city, province: explicitProvince, country: 'Pakistan' };
      }
    }
  }

  const currentCity = body.match(/Current City[:\s]*([A-Za-z][A-Za-z\s]*)/i);
  if (currentCity) {
    const city = currentCity[1].trim().replace(/\s{2,}.*/, '');
    return {
      city: city.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      province: explicitProvince,
      country: 'Pakistan',
    };
  }

  const known = [
    'Wah Cantt', 'Bahria Town', 'Rawalpindi', 'Islamabad', 'Lahore', 'Karachi',
    'Peshawar', 'Faisalabad', 'Sargodha', 'Taxila', 'Gujrat', 'Muzaffargarh',
    'Talagang', 'Chakwal', 'Mianwali', 'Dubai', 'London', 'Nottingham',
  ];
  const lower = body.toLowerCase();
  for (const city of known) {
    if (lower.includes(city.toLowerCase())) {
      if (city === 'Bahria Town') return { city: 'Rawalpindi', province: explicitProvince, country: 'Pakistan' };
      if (['Dubai', 'London', 'Nottingham'].includes(city)) {
        return { city, province: explicitProvince || 'Overseas', country: city === 'Dubai' ? 'UAE' : 'UK' };
      }
      return { city, province: explicitProvince, country: 'Pakistan' };
    }
  }
  return { city: 'Rawalpindi', province: explicitProvince, country: 'Pakistan' };
}

function isGarbageFieldValue(val) {
  if (!val || val.length < 3) return true;
  const lower = val.toLowerCase();
  if (/^details\b/.test(lower)) return true;
  if (/\bdetails:\s*\/?\s*postion\b/.test(lower)) return true;
  if (/^\/?\s*postion\b/.test(lower)) return true;
  if (/^postion:?$/i.test(val)) return true;
  if (/^non$/i.test(val)) return true;
  if (/^education details$/i.test(lower)) return true;
  return false;
}

function stripEmojis(value) {
  return value
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F\u20E3]/gu, '')
    .replace(/🛑/g, '')
    .trim();
}

function isTitleLine(line) {
  return /^(?:Female|Male)\/[^/]+\/\d+\//i.test(line.trim());
}

function extractBulletBlock(body, startPattern, endPattern) {
  const re = new RegExp(`${startPattern}([\\s\\S]*?)(?=${endPattern}|$)`, 'i');
  const match = body.match(re);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^[\s▪️\-:]+/, '').trim())
    .filter((line) => line.length > 4 && !/^education|job details|merital|city|house|father|residence|contact/i.test(line));
}

function pickPrimaryEducation(bullets) {
  if (!bullets.length) return null;
  const degreePattern = /\b(bachelor'?s?|master'?s?|mba|mbbs|phd|doctorate|m\.phil|bs |b\.s|m\.s|b\.com|b\.tech|b\.e\.?|dpt|dvm|md)\b/i;
  const higher = bullets.filter((b) => degreePattern.test(b));
  if (higher.length) return higher[higher.length - 1].trim();
  const nonSchool = bullets.filter((b) => !/\b(matric|fsc|f\.sc|intermediate|o\s*level|a\s*level|metric)\b/i.test(b));
  if (nonSchool.length) return nonSchool[nonSchool.length - 1].trim();
  return bullets[bullets.length - 1].trim();
}

function parseEducation(personalBody) {
  const candidateSection = personalBody.split(/▪️\s*Family Details|Family Details▪️|🔵\s*Family Status|Family Status|\d️⃣\s*Family Details|\nRequirements,/i)[0] || personalBody;

  const qualMatch = candidateSection.match(/🛑?Qualification[:\s]*([^\n]+)/i);
  if (qualMatch) {
    const cleaned = cleanFieldLabel(qualMatch[1]);
    if (!isGarbageFieldValue(cleaned) && cleaned.length > 2) return cleaned.slice(0, 500);
  }

  const bulletEdu = extractBulletBlock(candidateSection, 'Education[.:]\\s*', '▪️Job details|Job details|▪️Merital|Merital status|▪️city|Father|Residence|Contact|Religion|Family|Address|Requirements');
  if (bulletEdu.length) {
    const primary = pickPrimaryEducation(bulletEdu);
    if (primary) return primary.slice(0, 500);
  }

  const patterns = [
    /🛑?Qualification[:\s]*([^\n]+)/i,
    /Qualification[:\s]*([^\n]+)/i,
    /Qualification,\s*([^\n]+)/i,
    /Qualifications?[:\s]*([^\n]{8,200})/i,
    /Education[:\s]*([^\n|]{8,200})/i,
  ];
  for (const pattern of patterns) {
    const m = candidateSection.match(pattern);
    if (!m) continue;
    const cleaned = cleanFieldLabel(m[1]).replace(/\|+$/g, '').trim();
    if (!isGarbageFieldValue(cleaned) && !isTitleLine(cleaned) && cleaned.length > 5) {
      return cleaned.slice(0, 500);
    }
  }

  const lines = candidateSection.split('\n');
  for (const line of lines) {
    if (isTitleLine(line)) continue;
    if (/job\s+detail|postion|position|income|requirement|property|religion detail/i.test(line)) continue;
    if (/qualification|education|degree|bachelor|master|mbbs|mba|mcs|bs |b\.s|m\.s|phd|b\.com|f\.a|hnd/i.test(line)
      && line.length < 200 && !/father|mother/i.test(line)) {
      const cleaned = cleanFieldLabel(line.replace(/^[\s*•🔹🔅▪️👉\d.:>-]+/g, '').trim());
      if (!isGarbageFieldValue(cleaned) && cleaned.length > 8 && cleaned.length < 500 && !isTitleLine(cleaned)) {
        return cleaned.slice(0, 500);
      }
    }
  }
  return null;
}

function parseProfession(personalBody) {
  const candidateSection = personalBody.split(/▪️\s*Family Details|Family Details▪️|🔵\s*Family Status|Family Status|\d️⃣\s*Requirements|Requirements\s*:/i)[0] || personalBody;
  const businessMatch = candidateSection.match(/Business[:\s]*([^\n]+)/i);
  if (businessMatch) {
    const val = cleanFieldLabel(businessMatch[1]);
    if (/^nil$/i.test(val) || /^no$/i.test(val) || val.length < 3) return null;
    return val.slice(0, 500);
  }

  const jobPosition = candidateSection.match(/Job\s+position\s*\(?\s*([^\n)]+)/i);
  if (jobPosition) {
    const val = cleanFieldLabel(jobPosition[1]);
    if (val.length > 3) return val.slice(0, 500);
  }

  const bulletJob = extractBulletBlock(candidateSection, 'Job details:?', 'Religion|Family Details|Address|Requirements|▪️Merital|Merital status|▪️city|city:');
  if (bulletJob.length) return bulletJob.join('; ').slice(0, 500);

  const lines = candidateSection.split('\n').filter((line) => !/father|mother/i.test(line));

  const jobComma = candidateSection.match(/^Job,\s*([^\n]+)/im);
  if (jobComma) {
    const job = cleanFieldLabel(jobComma[1]);
    if (job.length > 2) return job.slice(0, 500);
  }

  const jobMatch = candidateSection.match(/Job\s*\/\s*Business[:\s*]*([^\n]{5,120})/i);
  const rankMatch = candidateSection.match(/(?:\d+[.:]\s*)?(?:Rank|Postion|Position)\s*\/\s*(?:Rank|Postion|Position)[:\s]*\n?\s*([^\n]{4,120})/i)
    || candidateSection.match(/(?:\d+[.:]\s*)?(?:Rank|Postion|Position)[:\s]+([^\n]{4,120})/i);

  const parts = [];
  if (rankMatch) {
    const rank = cleanFieldLabel(rankMatch[1]);
    if (!isGarbageFieldValue(rank) && rank.length > 3 && !/^nil$/i.test(rank)) parts.push(rank);
  }
  if (jobMatch) {
    const job = cleanFieldLabel(jobMatch[1]);
    if (job.length > 4 && !/^nil$/i.test(job) && !/^no$/i.test(job)) parts.push(job);
  }
  if (parts.length) return parts.join(' - ').slice(0, 500);

  const patterns = [
    /^👉>-?Job[:\s/]*([^\n]{5,100})/i,
    /^👉>-?Profession[:\s]*([^\n]{5,100})/i,
    /^👉>-?Occupation[:\s]*([^\n]{5,100})/i,
    /working as[:\s]*([^\n]{5,80})/i,
    /^👉>-?(?:Position|Designation)[:\s]*([^\n]{5,80})/i,
  ];
  for (const line of lines) {
    for (const p of patterns) {
      const m = line.match(p);
      if (m) {
        const val = cleanFieldLabel(m[1]);
        if (!isGarbageFieldValue(val) && val.length > 4 && !/^nil$/i.test(val) && !/^no$/i.test(val)) return val.slice(0, 500);
      }
    }
  }

  if (/alima|hafiz|qari|mufti/i.test(candidateSection)) return 'Alima / Islamic Scholar';

  return null;
}

function parseReligion(personalBody) {
  const candidateSection = personalBody.split(/\d️⃣\s*Requirements|Requirements\s*:/i)[0] || personalBody;
  if (!/\breligion\b/i.test(candidateSection)) return null;
  const religionComma = candidateSection.match(/Religion,\s*([^,\n]+)/i);
  if (religionComma) return religionComma[1].trim();
  const m = candidateSection.match(/Religion:\s*([^\n]+)/i);
  if (!m) return null;
  const val = cleanFieldLabel(m[1]);
  if (!val || /^details$/i.test(val)) return null;
  return val.slice(0, 50);
}

function parseMotherTongue(personalBody) {
  const lang = personalBody.match(/Language[:\s]*([A-Za-z,\s]+)/i);
  if (lang) {
    const primary = lang[1].split(',')[0].trim();
    if (primary) return primary;
  }
  const motherLang = personalBody.match(/Mother\s+language[:\s*]*([A-Za-z]+)/i);
  if (motherLang) return motherLang[1].trim();
  const motherTongue = personalBody.match(/Mother\s+tongue[:\s*]*([A-Za-z]+)/i);
  if (motherTongue) return motherTongue[1].trim();
  const tongue = personalBody.match(/\btongue[:\s]+([A-Za-z]+)/i);
  if (tongue) return tongue[1].trim();
  return null;
}

function parseCaste(personalBody) {
  const candidateSection = personalBody.split(/\d️⃣\s*Requirements|Requirements\s*:|🔵\s*Requirement|\nRequirements,/i)[0] || personalBody;
  const castComma = candidateSection.match(/^Cast,\s*([^\n]+)/im);
  if (castComma) {
    const value = castComma[1].replace(/[*•()👉>-]/g, '').trim();
    if (value) return value.slice(0, 50);
  }
  if (!/\bcaste?\b/i.test(candidateSection)) return null;
  const m = candidateSection.match(/\bCast(?:e)?[:\s*]+([^\n]{2,60})/i);
  if (!m) return null;
  const value = m[1].replace(/[*•()👉>-]/g, '').trim().replace(/,\s*/g, ' ');
  if (!value || /^any\b/i.test(value) || /^except\b/i.test(value)) return null;
  return value.slice(0, 50);
}

function parseDisability(personalBody) {
  if (!/\bdisability\b/i.test(personalBody)) return null;
  const m = personalBody.match(/Disability(?:\s*\([^)]*\))?\s*[:\s*]*([^\n]{1,80})/i);
  if (!m) return null;
  const value = cleanFieldLabel(m[1]);
  if (!value) return null;
  if (/^(no|none|nil|non|n\/?a)(?:\s|$)/i.test(value)) return 'No';
  return value.slice(0, 100);
}

function parseSect(personalBody) {
  const candidateSection = personalBody.split(/🔵\s*Requirement|\nRequirements,/i)[0] || personalBody;
  const religionComma = candidateSection.match(/Religion,\s*([^,\n]+)(?:,\s*([^\n]+))?/i);
  if (religionComma?.[2]) {
    const val = religionComma[2].trim();
    if (val) return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
  const maslakDot = candidateSection.match(/Maslak\.?\s*\n?\s*([A-Za-z]+)/i);
  if (maslakDot) {
    const val = maslakDot[1].trim();
    if (val) return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
  const maslak = candidateSection.match(/Sect\s*\(?\s*Maslak\s*\)?\s*[:\s]*([^\n|]+)/i);
  if (maslak) {
    const val = cleanFieldLabel(maslak[1]);
    if (val) return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
  if (/ahle?\s*hadees|ahl[- ]e[- ]hadith/i.test(candidateSection)) return 'Ahle Hadees';
  if (/deoband/i.test(candidateSection)) return 'Deobandi';
  if (/barelv/i.test(candidateSection)) return 'Barelvi';
  if (/shia/i.test(candidateSection)) return 'Shia';
  if (/hanafi/i.test(candidateSection)) return 'Hanafi';
  if (/shafi/i.test(candidateSection)) return 'Shafi';
  if (/sunni|ahl[- ]e[- ]sunnat/i.test(candidateSection)) return 'Sunni';
  return null;
}

function cleanIncomeValue(raw) {
  if (!raw) return null;
  const val = raw
    .replace(/^[\s*•🔹🔅▪️👉-]+/, '')
    .replace(/^(?:\d+[.:)]\s*|i{1,3}[.:)]\s*)/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[.\-:!]+|[.\-:!]+$/g, '')
    .trim();
  return val || null;
}

function isVagueIncome(val) {
  if (!val || val.length < 2) return true;
  const lower = val.toLowerCase();
  if (/^[-–—.]+$/.test(lower)) return true;
  if (/^(xyz|abc|na|n\/a|nil|none|good|handsome|stable|private|government)$/i.test(lower)) return true;
  if (/(?:al?l?)?(?:ham|hum)d[ou]?l+i+l+a+h/i.test(lower)) return true;
  if (!/\d/.test(lower) && /(?:ulill?ah|hamdul|humdul|alh?u?m?d|alh?a?m?d)/i.test(lower)) return true;
  if (/^financially stable$/i.test(lower)) return true;
  if (/^handsome (income|salary)$/i.test(lower)) return true;
  if (/^good (income|salary|job)$/i.test(lower)) return true;
  if (/^earning reasonably well$/i.test(lower)) return true;
  if (/^family status$/i.test(lower)) return true;
  if (/^house own/i.test(lower)) return true;
  if (/^nature of job/i.test(lower)) return true;
  return false;
}

function extractIncomeFromLine(line, labelRegex) {
  const match = line.match(labelRegex);
  if (!match) return null;
  const val = cleanIncomeValue(match[1]);
  if (!val || isVagueIncome(val)) return null;
  if (/^\d+[.:]/.test(val)) return null;
  return val.slice(0, 50);
}

function parseIncomeRange(body) {
  const lines = body.split(/\r?\n/);
  const rules = [
    /\bmonthly\s+income\b\s*[:\-/]*[ \t]*(.*)$/i,
    /\bsalary\s*\/\s*income\b\s*[:\-/]*[ \t]*(.*)$/i,
    /\broughly\s+income\b\s*[:\-/]*[ \t]*(.*)$/i,
    /\bfamily\s+income\b\s*[:\-/]*[ \t]*(.*)$/i,
    /\bsource\s+of\s+income\b\s*[:\-/]*[ \t]*(.*)$/i,
    /\bincome\b\s*[:\-/]*[ \t]*(.*)$/i,
  ];

  for (const rule of rules) {
    for (const line of lines) {
      const val = extractIncomeFromLine(line, rule);
      if (val) return val;
    }
  }

  return null;
}

function parsePhones(body) {
  const lines = body.split(/\r?\n/);
  const matches = [];
  for (const line of lines) {
    if (/mother'?s?\s+mobile|family contact|relation with canidate/i.test(line)) continue;
    const found = line.match(/(?:\+92|0|O)\s*3\d{2}[\s-]?\d{7}|\+971\s*\d{2}\s*\d{3}\s*\d{4}/gi) || [];
    matches.push(...found);
  }
  const normalized = [];
  for (const raw of matches) {
    let n = raw.replace(/[\s-]/g, '').replace(/^O/i, '0');
    if (n.startsWith('03')) n = `+92${n.slice(1)}`;
    if (n.startsWith('92') && !n.startsWith('+')) n = `+${n}`;
    if (!normalized.includes(n)) normalized.push(n);
  }
  if (!normalized.length) return [];
  const contacts = [{ type: 'phone', number: normalized[0] }];
  if (normalized[1]) contacts.push({ type: 'whatsapp', number: normalized[1] });
  else contacts.push({ type: 'whatsapp', number: normalized[0] });
  return contacts;
}

function parseName(displayName, num, body, gender) {
  const bodyName = body.match(/^Name:\s*([^\n]+)/im);
  if (bodyName) {
    const n = bodyName[1].trim().replace(/\.$/, '');
    if (!/^(xyz|abc|a|female|male|profile)$/i.test(n)) {
      const parts = n.split(/\s+/);
      return { first_name: parts[0], last_name: parts.slice(1).join(' ') || 'Profile' };
    }
  }

  const bodyNameInline = body.match(/(?:▪️|\*)?Name:\s*([A-Za-z][A-Za-z .]{1,40})/i);
  if (bodyNameInline) {
    const n = bodyNameInline[1].trim().replace(/\.$/, '');
    if (!/^(xyz|abc|a|female|male|profile)$/i.test(n)) {
      const parts = n.split(/\s+/);
      return { first_name: parts[0], last_name: parts.slice(1).join(' ') || 'Profile' };
    }
  }

  if (/^Profile\s+\d+$/i.test((displayName || '').trim())) {
    const prefix = gender === 'male' ? 'Male' : 'Female';
    return { first_name: prefix, last_name: `Profile ${String(num).padStart(3, '0')}` };
  }

  const generic = /^(Female Profile|Male Profile|Profile|Age|Age\/birth year|Barrister xyz|X\.Y\.Z|A K|xyz\.female)$/i;
  if (displayName && !generic.test(displayName.trim())) {
    const clean = displayName.replace(/Barrister\s+/i, '').trim();
    if (!/^xyz$/i.test(clean)) {
      const parts = clean.split(/\s+/);
      return { first_name: parts[0], last_name: parts.slice(1).join(' ') || String(num).padStart(3, '0') };
    }
  }

  const prefix = gender === 'male' ? 'Male' : 'Female';
  return { first_name: prefix, last_name: `Profile ${String(num).padStart(3, '0')}` };
}

function cleanRequirementsText(text) {
  return text
    .replace(/^🔵\s*Requirement\s*/i, '')
    .replace(/^▪️?\s*Demand\s*▪️?\s*/i, '')
    .replace(/^🔺\s*Demand\s*:?\s*/i, '')
    .replace(/^💫\s*Requirements for Preferable Match\s*/i, '')
    .replace(/^Requirements for Preferable Match\s*/i, '')
    .replace(/^Requirements?,/i, '')
    .replace(/👉>-?/g, '')
    .replace(/▪️/g, '')
    .replace(/🔺/g, '')
    .replace(/✨/g, '')
    .replace(/💫/g, '')
    .replace(/🛑/g, '')
    .replace(/Mother\s+[\d\s.+-]{8,}/gi, '')
    .replace(/Contact\s*#\s*[\d\s.+-]+/gi, '')
    .replace(/(?:🔺\s*)?Contact\s+number[:\s]*[\d\s.+-]+/gi, '')
    .replace(/Contact(?:\s*no|\s*number)?[:\s-]*[\d\s.+-]+/gi, '')
    .replace(/CONTACT[:\s]+[\d\s.+-]+/gi, '')
    .replace(/is ka pdf bana ka da[\s\S]*$/i, '')
    .replace(/number wise\s+\d+\s+to\s+\d+[\s\S]*$/i, '')
    .replace(/^,\s*/, '')
    .replace(/\s*\.{2,}\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRequirements(requirementsBody) {
  if (!requirementsBody) return null;
  const cleaned = cleanRequirementsText(requirementsBody);
  return cleaned || null;
}

function formatFamilyDetails(raw) {
  return raw
    .replace(/👉>-?/g, '')
    .replace(/▪️/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/▪️?Mother'?s?\s+mobile[:\s*]*(?:\+92|0|O)?[\d\s-]+/gi, '')
    .replace(/Family Contact number[^.]*\.{0,3}/gi, '')
    .replace(/Contact(?:\s*no|\s*number)?[:\s-]*[\d\s.+-]+/gi, '')
    .replace(/CONTACT:?\s*[\d\s.+-]+/gi, '')
    .replace(/Relation with canidate[^.]*\.{0,3}/gi, '')
    .replace(/EDUCATED\/ WELL MANNERED[\s\S]*$/i, '')
    .replace(/Demand[\s\S]*$/i, '')
    .replace(/\+\d{10,}/g, '')
    .trim();
}

function parseStructuredFamilyDetails(personalBody) {
  const familyMatch = personalBody.match(
    /Family Details▪️\s*([\s\S]*?)(?:\s*▪️\s*Demand|CONTACT:|$)/i
  );
  if (!familyMatch) return null;

  const section = familyMatch[1];
  const parts = [];
  const father = section.match(/Father\.?\s*\n+\s*([^\n▪️]+)/i);
  const mother = section.match(/Mother\s*\n+\s*([^\n▪️]+)/i);
  const brothers = section.match(/Brothers\s*\n+([\s\S]*?)(?=▪️Sisters|Sisters|$)/i);
  const sisters = section.match(/Sisters\s*\n+([\s\S]*?)(?=▪️|Demand|CONTACT:|$)/i);

  const trimPart = (s) => s.trim().replace(/\.+$/, '');
  if (father) parts.push(`Father: ${trimPart(father[1])}`);
  if (mother) parts.push(`Mother: ${trimPart(mother[1])}`);
  if (brothers) {
    const broText = trimPart(brothers[1].replace(/\s+/g, ' '));
    if (broText) parts.push(`Brothers: ${broText}`);
  }
  if (sisters) {
    const sisText = trimPart(sisters[1].replace(/\s+/g, ' '));
    if (sisText) parts.push(`Sisters: ${sisText}`);
  }

  return parts.length ? parts.join('. ').slice(0, 400) : null;
}

function buildFamilyDetailsFromFields(personalBody) {
  const personalOnly = personalBody.split(/\d️⃣\s*Requirements|Requirements\s*:/i)[0] || personalBody;
  const parts = [];
  const trimPart = (s) => s.trim().replace(/\.+$/, '');
  const fatherOcc = personalOnly.match(/Father'?s?\s+(?:occupation|profession)[:\s]*([^\n]+)/i)
    || personalOnly.match(/(?:^|\n)\s*🛑?Father[:\s,]+([^\n]+)/im);
  const motherOcc = personalOnly.match(/Mother(?:'s)?\s+(?:profession|occupation)[:\s]*([^\n]+)/i)
    || personalOnly.match(/(?:^|\n)\s*🛑?Mother[:\s,]+([^\n]+)/im);
  if (fatherOcc) parts.push(`Father: ${trimPart(fatherOcc[1])}`);
  if (motherOcc) parts.push(`Mother: ${trimPart(motherOcc[1])}`);

  const brother = personalOnly.match(/(?:^|\n)\s*🛑?Brother[:\s]+([^\n]+)/im);
  if (brother) parts.push(`Brother: ${trimPart(brother[1])}`);

  const sisters = personalOnly.match(/(?:^|\n)\s*🛑?Sisters?[:\s]+([^\n]+)/im);
  if (sisters) parts.push(`Sisters: ${trimPart(sisters[1])}`);

  const pathanNote = personalOnly.match(/Father Pathan[^\n]+/i);
  if (pathanNote) parts.push(trimPart(pathanNote[0]));

  const siblings = personalOnly.match(/SIBLINGS?\s*:\s*([^\n]+)/i);
  if (siblings) parts.push(`Siblings: ${trimPart(siblings[1])}`);

  const bro1 = personalOnly.match(/One Brother\s*\n+\s*([^\n]+)/i);
  if (bro1) parts.push(`Brother 1: ${trimPart(bro1[1])}`);

  const bro2 = personalOnly.match(/2nd Brother\s+([^\n]+)/i);
  if (bro2) parts.push(`Brother 2: ${trimPart(bro2[1])}`);

  const sisLine = personalOnly.match(/Sisters?\s*:\s*\d+\s*\n+\s*([^\n]+)/i);
  if (sisLine) parts.push(`Sister: ${trimPart(sisLine[1])}`);

  return parts.length ? parts.join('. ') : null;
}

function parseCommaFamilyDetails(personalBody) {
  const familySection = personalBody.split(/\nRequirements,/i)[0] || personalBody;
  const fieldNames = ['Father', 'Mother', 'Siblings', 'Elder sister', 'Younger sister', 'Brother'];
  const parts = [];
  for (const field of fieldNames) {
    const re = new RegExp(`^${field},\\s*(.+)$`, 'im');
    const m = familySection.match(re);
    if (m) parts.push(`${field}: ${m[1].trim()}`);
  }
  return parts.length ? parts.join('. ') : null;
}

function parseFamilyDetails(personalBody) {
  const structured = parseStructuredFamilyDetails(personalBody);
  if (structured) return structured;

  const fromFields = buildFamilyDetailsFromFields(personalBody);
  if (fromFields) return fromFields.slice(0, 400);

  const commaFamily = parseCommaFamilyDetails(personalBody);
  if (commaFamily) return commaFamily.slice(0, 400);

  const familyMatch = personalBody.match(
    /(?:^|\n)\s*(?:FAMILY(?:\s+DETAILS)?|🔵\s*Family Status|Family Status)\s*[:\s#▪️]?\s*([\s\S]{0,700}?)(?:\n\s*🔵\s*Residence|🔵\s*Residence|\s*▪️\s*Demand|CONTACT:|\n\s*Contact|\nContact|$)/i
  );
  if (!familyMatch) return null;
  const details = formatFamilyDetails(familyMatch[1]);
  return details.slice(0, 400) || null;
}

function parsePartnerPreferences(requirementsBody, age, location) {
  if (!requirementsBody?.trim()) return null;

  const ageLimitRangeMatch = requirementsBody.match(/Age\s+limit[:\s]*(\d{2})\s+to\s+(\d{2})/i);
  const ageRangeMatch = requirementsBody.match(/Age[:\s*]*(\d{2})\s+to\s+(\d{2})/i);
  const ageBelowMatch = requirementsBody.match(/Age\s+limit[:\s]*Below\s+(\d{2})/i);
  const tillAgeMatch = requirementsBody.match(/Age[:\s*]*till\s+(\d{2})/i);
  const singleAgeMatch = !ageLimitRangeMatch && !ageRangeMatch && !ageBelowMatch
    ? requirementsBody.match(/(?:^|\n)\s*(?:✨|▪️|🔺|🛑)?\s*Age[:\s*]+(\d{2})(?!\s+to)/i)
    : null;

  let minAge = null;
  let maxAge = null;
  if (ageLimitRangeMatch || ageRangeMatch) {
    const range = ageLimitRangeMatch || ageRangeMatch;
    minAge = parseInt(range[1], 10);
    maxAge = parseInt(range[2], 10);
  } else if (ageBelowMatch) {
    maxAge = parseInt(ageBelowMatch[1], 10) - 1;
  } else if (tillAgeMatch) {
    maxAge = parseInt(tillAgeMatch[1], 10);
    minAge = Math.max(18, age - 3);
  } else if (singleAgeMatch) {
    const partnerAge = parseInt(singleAgeMatch[1], 10);
    minAge = Math.max(18, partnerAge - 3);
    maxAge = partnerAge + 5;
  }

  const heightMatch = requirementsBody.match(/Height[:\s]*At\s+least\s+(\d)\s*[''′](\d{1,2})/i);
  let minHeightCm = null;
  if (heightMatch) {
    const feet = parseInt(heightMatch[1], 10);
    const inches = parseInt(heightMatch[2], 10) || 0;
    minHeightCm = Math.round(feet * 30.48 + inches * 2.54);
  }

  const eduMatch = requirementsBody.match(/Education[:\s]+([^\n]+)/i);
  const cityMatch = requirementsBody.match(/City[:\s]+([^\n]+)/i);
  const castMatch = requirementsBody.match(/Cast[e]?[:\s]+([^\n✨💫▪️🛑]+)/i);
  const lookingForMatch = requirementsBody.match(/Looking for\s+([^\n]+)/i);
  const urduSpeaking = /urdu\s+speaking/i.test(requirementsBody);

  const notesParts = [];
  if (ageLimitRangeMatch) notesParts.push(`Age limit: ${ageLimitRangeMatch[1]} to ${ageLimitRangeMatch[2]}`);
  else if (ageBelowMatch) notesParts.push(`Age limit: Below ${ageBelowMatch[1]}`);
  else if (ageRangeMatch) notesParts.push(`Age: ${ageRangeMatch[1]} to ${ageRangeMatch[2]}`);
  if (heightMatch) notesParts.push(`Height: At least ${heightMatch[1]}'${heightMatch[2]}`);
  if (eduMatch && lookingForMatch) notesParts.push(`Education: ${cleanFieldLabel(eduMatch[1])}`);
  if (cityMatch && lookingForMatch) notesParts.push(`City: ${cleanFieldLabel(cityMatch[1])}`);
  if (castMatch) {
    const castVal = cleanFieldLabel(castMatch[1]);
    const isAnyUrduOnly = /^any\s*\(urdu\s+speaking\)\s*$/i.test(castVal);
    if (isAnyUrduOnly) {
      notesParts.push('Cast: Any');
      notesParts.push('Mother tongue: Urdu');
    } else {
      notesParts.push(`Cast: ${castVal}`);
    }
  } else if (urduSpeaking) {
    notesParts.push('Mother tongue: Urdu');
  }
  if (lookingForMatch) notesParts.push(`Looking for ${cleanFieldLabel(lookingForMatch[1])}`);

  const requirements_notes = notesParts.length
    ? notesParts.join(', ')
    : extractRequirements(requirementsBody)?.slice(0, 500) || null;

  if (!requirements_notes && minAge == null && maxAge == null && !minHeightCm) return null;

  return {
    min_age: minAge,
    max_age: maxAge,
    min_height_cm: minHeightCm,
    max_height_cm: null,
    religion: null,
    sect: null,
    city: cityMatch && lookingForMatch ? cleanFieldLabel(cityMatch[1]).slice(0, 100) : null,
    province: null,
    education: eduMatch && lookingForMatch ? cleanFieldLabel(eduMatch[1]).slice(0, 100) : null,
    requirements_notes,
  };
}

function buildAboutMe(personalBody) {
  const candidateSection = personalBody.split(/▪️\s*Family Details|Family Details▪️|🔵\s*Family Status|Family Status|\nRequirements,/i)[0] || personalBody;
  const snippets = [];
  const hobbies = candidateSection.match(/Hobbies[:\s]*([^\n]+)/i);
  if (hobbies) snippets.push(cleanFieldLabel(hobbies[1]));

  if (snippets.length) return snippets.join('. ').replace(/\.{2,}/g, '.').trim().slice(0, 500);
  return null;
}

function parseProfileBlock(block) {
  const numMatch = block.match(/^(\d+)\.\s*PROFILE/m);
  if (!numMatch) return null;

  const num = parseInt(numMatch[1], 10);
  const nameMatch = block.match(/Name\/Display Name:\s*(.+)/i);
  const emailMatch = block.match(/Fake Email:\s*(\S+)/i);
  if (!emailMatch) return null;

  const displayName = nameMatch ? nameMatch[1].trim() : `Profile ${num}`;
  const dataMatch = block.match(/Profile Data:\n([\s\S]*)/i);
  const body = dataMatch ? dataMatch[1].trim() : block;
  const { personal, requirements } = splitSections(body);

  const gender = parseGender(displayName, personal);
  const age = parseAge(personal);
  const date_of_birth = parseDateOfBirth(personal, age);
  const { first_name, last_name } = parseName(displayName, num, personal, gender);
  const location = parseCity(personal);

  return {
    email: emailMatch[1].trim().toLowerCase(),
    password: DEFAULT_PASSWORD,
    first_name,
    last_name,
    gender,
    date_of_birth,
    height_cm: parseHeightCm(personal),
    marital_status: parseMaritalStatus(personal),
    religion: parseReligion(personal),
    sect: parseSect(personal),
    caste: parseCaste(personal),
    disability: parseDisability(personal),
    mother_tongue: parseMotherTongue(personal),
    city: location.city,
    province: location.province,
    country: location.country || 'Pakistan',
    education: parseEducation(personal),
    profession: parseProfession(personal),
    income_range: parseIncomeRange(personal),
    about_me: buildAboutMe(personal),
    family_details: parseFamilyDetails(personal),
    contacts: parsePhones(body),
    partner_preferences: parsePartnerPreferences(requirements, age, location),
    profile_number: num,
  };
}

function parseRishtaProfiles(filePath) {
  const resolved = filePath ? path.resolve(filePath) : resolveProfileFile();
  if (!fs.existsSync(resolved)) {
    throw new Error(`Profile file not found: ${resolved}`);
  }

  const content = fs.readFileSync(resolved, 'utf8');
  const blocks = content.split(/─{20,}/).map((b) => b.trim()).filter(Boolean);

  const profiles = [];
  const seenEmails = new Set();

  for (const block of blocks) {
    if (!block.includes('PROFILE') || !block.includes('Fake Email')) continue;
    const profile = parseProfileBlock(block);
    if (!profile || seenEmails.has(profile.email)) continue;
    seenEmails.add(profile.email);
    profiles.push(profile);
  }

  profiles.sort((a, b) => a.profile_number - b.profile_number);
  return profiles;
}

module.exports = { parseRishtaProfiles, resolveProfileFile, DEFAULT_PASSWORD };
