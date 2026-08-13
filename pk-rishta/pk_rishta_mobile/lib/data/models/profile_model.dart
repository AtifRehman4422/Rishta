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
    this.maritalStatus,
    this.religion,
    this.sect,
    this.heightCm,
    this.aboutMe,
    this.profilePhoto,
    this.isVerified = false,
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
  final String? maritalStatus;
  final String? religion;
  final String? sect;
  final int? heightCm;
  final String? aboutMe;
  final String? profilePhoto;
  final bool isVerified;

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
      maritalStatus: json['marital_status'] as String?,
      religion: json['religion'] as String?,
      sect: json['sect'] as String?,
      heightCm: _toInt(json['height_cm']),
      aboutMe: json['about_me'] as String?,
      profilePhoto: json['profile_photo'] as String?,
      isVerified: json['is_verified'] == true,
    );
  }
}
