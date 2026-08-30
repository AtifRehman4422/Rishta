import 'dart:convert';
import 'dart:math';

class FamilyParent {
  FamilyParent({this.name = '', this.alive = '', this.profession = ''});

  String name;
  String alive;
  String profession;
}

class FamilySibling {
  FamilySibling({
    String? id,
    this.order = '',
    this.married = '',
    this.profession = '',
  }) : id = id ?? _newId();

  final String id;
  String order;
  String married;
  String profession;
}

class FamilyDetailsData {
  FamilyDetailsData({
    FamilyParent? father,
    FamilyParent? mother,
    List<FamilySibling>? brothers,
    List<FamilySibling>? sisters,
  })  : father = father ?? FamilyParent(),
        mother = mother ?? FamilyParent(),
        brothers = brothers ?? [],
        sisters = sisters ?? [];

  FamilyParent father;
  FamilyParent mother;
  List<FamilySibling> brothers;
  List<FamilySibling> sisters;

  bool get isComplete => father.alive.isNotEmpty && mother.alive.isNotEmpty;

  bool get isEmpty =>
      father.alive.isEmpty &&
      father.name.trim().isEmpty &&
      father.profession.trim().isEmpty &&
      mother.alive.isEmpty &&
      mother.name.trim().isEmpty &&
      mother.profession.trim().isEmpty &&
      brothers.isEmpty &&
      sisters.isEmpty;

  ({int total, int married, int unmarried}) counts(List<FamilySibling> list) {
    final married = list.where((s) => s.married == 'married').length;
    final unmarried = list.where((s) => s.married == 'unmarried').length;
    return (total: list.length, married: married, unmarried: unmarried);
  }
}

const familyProfessionBase = [
  'No Job',
  'Freelancer',
  'Private Job',
  'Retired',
  'Government Employee',
  'Teacher',
  'Doctor',
  'Shopkeeper',
  'Farmer',
  'Businessman',
  'Engineer',
  'Lawyer',
  'Driver',
  'Army',
  'Police',
];

const fatherProfessionOptions = familyProfessionBase;

const motherProfessionOptions = [
  'Housewife',
  ...familyProfessionBase,
];

const brotherProfessionOptions = [
  'Student',
  ...familyProfessionBase,
];

const sisterProfessionOptions = [
  'Housewife',
  'Student',
  ...familyProfessionBase,
];

List<String> familyProfessionOptionsFor(String role, {String current = ''}) {
  final base = switch (role) {
    'father' => fatherProfessionOptions,
    'mother' => motherProfessionOptions,
    'brother' => brotherProfessionOptions,
    _ => sisterProfessionOptions,
  };
  final value = current.trim();
  if (value.isEmpty || base.contains(value)) return List.of(base);
  return [value, ...base];
}

String _newId() {
  final rand = Random().nextInt(99999);
  return 'fam_${DateTime.now().millisecondsSinceEpoch}_$rand';
}

FamilySibling emptySibling() => FamilySibling();

FamilyDetailsData parseFamilyDetails(String? raw) {
  final text = (raw ?? '').trim();
  if (text.isEmpty) return FamilyDetailsData();
  try {
    final parsed = jsonDecode(text);
    if (parsed is Map && parsed['version'] == 1) {
      final father = parsed['father'] is Map ? parsed['father'] as Map : const {};
      final mother = parsed['mother'] is Map ? parsed['mother'] as Map : const {};
      return FamilyDetailsData(
        father: FamilyParent(
          name: '${father['name'] ?? ''}',
          alive: _alive(father['alive']),
          profession: '${father['profession'] ?? ''}',
        ),
        mother: FamilyParent(
          name: '${mother['name'] ?? ''}',
          alive: _alive(mother['alive']),
          profession: '${mother['profession'] ?? ''}',
        ),
        brothers: _siblings(parsed['brothers']),
        sisters: _siblings(parsed['sisters']),
      );
    }
  } catch (_) {}
  return FamilyDetailsData(mother: FamilyParent(profession: text));
}

List<FamilySibling> _siblings(dynamic raw) {
  if (raw is! List) return [];
  return [
    for (final row in raw)
      if (row is Map)
        FamilySibling(
          id: '${row['id'] ?? _newId()}',
          order: row['order'] == 'elder' || row['order'] == 'younger' ? '${row['order']}' : '',
          married: row['married'] == 'married' || row['married'] == 'unmarried' ? '${row['married']}' : '',
          profession: '${row['profession'] ?? ''}',
        ),
  ];
}

String _alive(dynamic value) {
  final v = '$value';
  return v == 'alive' || v == 'late' ? v : '';
}

String serializeFamilyDetails(FamilyDetailsData data) {
  return jsonEncode({
    'version': 1,
    'father': {
      'name': data.father.name.trim(),
      'alive': data.father.alive,
      'profession': data.father.profession.trim(),
    },
    'mother': {
      'name': data.mother.name.trim(),
      'alive': data.mother.alive,
      'profession': data.mother.profession.trim(),
    },
    'brothers': [
      for (final b in data.brothers)
        {
          'id': b.id,
          'order': b.order,
          'married': b.married,
          'profession': b.profession.trim(),
        },
    ],
    'sisters': [
      for (final s in data.sisters)
        {
          'id': s.id,
          'order': s.order,
          'married': s.married,
          'profession': s.profession.trim(),
        },
    ],
  });
}

String formatFamilyDetails(FamilyDetailsData data) {
  final lines = <String>[];
  final father = _parentLine('Father', data.father);
  final mother = _parentLine('Mother', data.mother);
  if (father.isNotEmpty) lines.add(father);
  if (mother.isNotEmpty) lines.add(mother);

  final brothers = data.counts(data.brothers);
  if (brothers.total > 0) {
    lines.add('Brothers: ${brothers.total} total, ${brothers.married} married');
    for (var i = 0; i < data.brothers.length; i++) {
      lines.add(_siblingLine('Brother', data.brothers[i], i));
    }
  }
  final sisters = data.counts(data.sisters);
  if (sisters.total > 0) {
    lines.add('Sisters: ${sisters.total} total, ${sisters.married} married');
    for (var i = 0; i < data.sisters.length; i++) {
      lines.add(_siblingLine('Sister', data.sisters[i], i));
    }
  }
  return lines.join('\n');
}

String familyDetailsDisplay(String? raw) {
  final text = (raw ?? '').trim();
  if (text.isEmpty) return '';
  try {
    final parsed = jsonDecode(text);
    if (parsed is Map && parsed['version'] == 1) {
      return formatFamilyDetails(parseFamilyDetails(text));
    }
  } catch (_) {}
  return text;
}

bool isStructuredFamilyDetails(String? raw) {
  final text = (raw ?? '').trim();
  if (!text.startsWith('{')) return false;
  try {
    final parsed = jsonDecode(text);
    return parsed is Map && parsed['version'] == 1;
  } catch (_) {}
  return false;
}

String aliveLabel(String status) {
  if (status == 'alive') return 'Alive';
  if (status == 'late') return 'Late';
  return '';
}

String siblingOrderLabel(String order) {
  if (order == 'elder') return 'Elder';
  if (order == 'younger') return 'Younger';
  return '';
}

String marriedLabel(String status) {
  if (status == 'married') return 'Married';
  if (status == 'unmarried') return 'Unmarried';
  return '';
}

String _parentLine(String label, FamilyParent parent) {
  if (parent.alive.isEmpty && parent.name.trim().isEmpty && parent.profession.trim().isEmpty) {
    return '';
  }
  final status = parent.alive == 'late' ? 'late' : parent.alive == 'alive' ? 'alive' : '';
  return [label, parent.name.trim(), status, parent.profession.trim()].where((e) => e.isNotEmpty).join(' — ');
}

String _siblingLine(String kind, FamilySibling sibling, int index) {
  final order = sibling.order == 'elder' ? 'elder' : sibling.order == 'younger' ? 'younger' : '';
  final married = sibling.married == 'married'
      ? 'married'
      : sibling.married == 'unmarried'
          ? 'unmarried'
          : '';
  return ['$kind ${index + 1}', order, married, sibling.profession.trim()]
      .where((e) => e.isNotEmpty)
      .join(' — ');
}
