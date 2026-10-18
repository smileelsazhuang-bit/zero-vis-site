# Interface fonts

Both local fonts are distributed under the SIL Open Font License 1.1. The
unmodified license notices are included alongside each font.

- Noto Serif SC, from [Google Fonts / Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc), license: `NotoSerifSC-OFL.txt`.
- Cormorant Garamond, from [Google Fonts / Cormorant Garamond](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond), license: `CormorantGaramond-OFL.txt`.

The bundled WOFF2 files are UI subsets renamed to **Moonveil UI Serif** and
**Moonveil UI Latin**. They retain the originals' copyright and license records.
Chinese glyphs come from the current interface and gameplay source strings;
system fonts provide a fallback for future text. The two subsets total 220,304
bytes, replacing approximately 26 MB of original variable TTF files.

To regenerate after editing the interface, run `subset_fonts.py` from the project
root using Python with `fonttools` and `brotli` installed. It fetches the original
Google Fonts sources into the system temporary directory if necessary.
