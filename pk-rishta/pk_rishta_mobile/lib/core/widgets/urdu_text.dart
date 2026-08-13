import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class UrduText extends StatelessWidget {
  const UrduText(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
  });

  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      textAlign: textAlign,
      textDirection: TextDirection.rtl,
      style: GoogleFonts.notoNastaliqUrdu(
        fontSize: style?.fontSize ?? 18,
        height: style?.height ?? 1.8,
        color: style?.color,
        fontWeight: style?.fontWeight,
      ),
    );
  }
}
