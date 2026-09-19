class Profile {
  Profile({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.gender,
    this.age,
    this.city,
    this.province,
    this.country,
    this.education,
    this.profession,
    this.hafizQuran,
    this.maritalStatus,
    this.religion,
    this.sect,
    this.heightCm,
    this.weightKg,
    this.color,
    this.disability,
    this.caste,
    this.languages,
    this.motherTongue,
    this.guardianType,
    this.guardianName,
    this.houseOwnLocation,
    this.houseRentLocation,
    this.abroadCountry,
    this.abroadHouseOwnLocation,
    this.abroadHouseRentLocation,
    this.familyDetails,
    this.lookingFor,
    this.incomeRange,
    this.aboutMe,
    this.profilePhoto,
    this.isVerified = false,
    this.adminRating,
    this.contactRequestLimit,
    this.partnerPreferences,
    this.matchScore,
    this.matchReasons,
    this.pkHouseType,
    this.abroadHouseType,
    this.addressVisible = false,
    this.iSharedAddress = false,
    this.theySharedAddress = false,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String gender;
  final int? age;
  final String? city;
  final String? province;
  final String? country;
  final String? education;
  final String? profession;
  final String? hafizQuran;
  final String? maritalStatus;
  final String? religion;
  final String? sect;
  final int? heightCm;
  final num? weightKg;
  final String? color;
  final String? disability;
  final String? caste;
  final String? languages;
  final String? motherTongue;
  final String? guardianType;
  final String? guardianName;
  final String? houseOwnLocation;
  final String? houseRentLocation;
  final String? abroadCountry;
  final String? abroadHouseOwnLocation;
  final String? abroadHouseRentLocation;
  final String? familyDetails;
  final String? lookingFor;
  final String? incomeRange;
  final String? aboutMe;
  final String? profilePhoto;
  final bool isVerified;
  final int? adminRating;
  final int? contactRequestLimit;
  final PartnerPreferences? partnerPreferences;
  final int? matchScore;
  final List<String>? matchReasons;
  final String? pkHouseType;
  final String? abroadHouseType;
  final bool addressVisible;
  final bool iSharedAddress;
  final bool theySharedAddress;

  String get fullName => '$firstName $lastName'.trim();

  String get location {
    final parts = [city, province].where((p) => p != null && p.isNotEmpty);
    return parts.join(', ');
  }

  static int? _toInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString());
  }

  static num? _toNum(dynamic value) {
    if (value == null) return null;
    if (value is num) return value;
    return num.tryParse(value.toString());
  }

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'].toString(),
      firstName: (json['first_name'] ?? '') as String,
      lastName: (json['last_name'] ?? '') as String,
      gender: (json['gender'] ?? '') as String,
      age: _toInt(json['age']),
      city: json['city'] as String?,
      province: json['province'] as String?,
      country: json['country'] as String?,
      education: json['education'] as String?,
      profession: json['profession'] as String?,
      hafizQuran: json['hafiz_quran'] as String?,
      maritalStatus: json['marital_status'] as String?,
      religion: json['religion'] as String?,
      sect: json['sect'] as String?,
      heightCm: _toInt(json['height_cm']),
      weightKg: _toNum(json['weight_kg']),
      color: json['color'] as String?,
      disability: json['disability'] as String?,
      caste: json['caste'] as String?,
      languages: json['languages'] as String?,
      motherTongue: json['mother_tongue'] as String?,
      guardianType: json['guardian_type'] as String?,
      guardianName: json['guardian_name'] as String?,
      houseOwnLocation: json['house_own_location'] as String?,
      houseRentLocation: json['house_rent_location'] as String?,
      abroadCountry: json['abroad_country'] as String?,
      abroadHouseOwnLocation: json['abroad_house_own_location'] as String?,
      abroadHouseRentLocation: json['abroad_house_rent_location'] as String?,
      familyDetails: json['family_details'] as String?,
      lookingFor: json['looking_for'] as String?,
      incomeRange: json['income_range'] as String?,
      aboutMe: json['about_me'] as String?,
      profilePhoto: json['profile_photo'] as String?,
      isVerified: json['is_verified'] == true,
      adminRating: _toInt(json['admin_rating']),
      contactRequestLimit: _toInt(json['contact_request_limit']),
      partnerPreferences: json['partner_preferences'] is Map<String, dynamic>
          ? PartnerPreferences.fromJson(
              json['partner_preferences'] as Map<String, dynamic>,
            )
          : null,
      matchScore: _toInt(json['match_score']),
      matchReasons: (json['match_reasons'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      pkHouseType: json['pk_house_type'] as String?,
      abroadHouseType: json['abroad_house_type'] as String?,
      addressVisible: json['address_visible'] == true,
      iSharedAddress: json['i_shared_address'] == true,
      theySharedAddress: json['they_shared_address'] == true,
    );
  }
}

class PartnerPreferences {
  PartnerPreferences({
    this.minAge,
    this.maxAge,
    this.minHeightCm,
    this.maxHeightCm,
    this.religion,
    this.sect,
    this.caste,
    this.province,
    this.country,
    this.city,
    this.education,
    this.profession,
    this.maritalStatus,
    this.requirementsNotes,
  });

  final int? minAge;
  final int? maxAge;
  final int? minHeightCm;
  final int? maxHeightCm;
  final String? religion;
  final String? sect;
  final String? caste;
  final String? province;
  final String? country;
  final String? city;
  final String? education;
  final String? profession;
  final String? maritalStatus;
  final String? requirementsNotes;

  static int? _toInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString());
  }

  factory PartnerPreferences.fromJson(Map<String, dynamic> json) {
    return PartnerPreferences(
      minAge: _toInt(json['min_age']),
      maxAge: _toInt(json['max_age']),
      minHeightCm: _toInt(json['min_height_cm']),
      maxHeightCm: _toInt(json['max_height_cm']),
      religion: json['religion'] as String?,
      sect: json['sect'] as String?,
      caste: json['caste'] as String?,
      province: json['province'] as String?,
      country: json['country'] as String?,
      city: json['city'] as String?,
      education: json['education'] as String?,
      profession: json['profession'] as String?,
      maritalStatus: json['marital_status'] as String?,
      requirementsNotes: json['requirements_notes'] as String?,
    );
  }

  bool get hasAny {
    final values = [
      minAge,
      maxAge,
      minHeightCm,
      maxHeightCm,
      religion,
      sect,
      caste,
      province,
      country,
      city,
      education,
      profession,
      maritalStatus,
      requirementsNotes,
    ];
    for (final v in values) {
      if (v is String) {
        if (v.trim().isNotEmpty) return true;
      } else if (v != null) {
        return true;
      }
    }
    return false;
  }
}
