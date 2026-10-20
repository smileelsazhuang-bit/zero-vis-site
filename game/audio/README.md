# 月下石廊 · 游戏配乐

## 活书库 · 2026-10-20

- 新增 `music-library.mp3` 和 `music-library-aac.m4a`，由即梦 `seed_music_1.0` 在上述同一画布独立生成；资源 `3064cdba-0740-4cca-9a63-a837c789e504`，90.044 秒原始音频，游戏版 87 秒。
- 原创无歌词管弦、木管与玻璃音色，服务书库探索；3 秒循环交叉淡化。MP3 与 AAC-LC 均为 44.1 kHz、立体声；AAC 的 moov 前置。
- 已完整解码并验证单声道无静音抵消、无超过 0.2 秒的 -50dB 静音；实测 MP3 -20.44 LUFS / -7.91 dBTP，AAC -20.03 LUFS / -7.41 dBTP。
- 复现与身份记录：`output/dreamina-audio/library-job.json`、`library-media.json`、`prepare-library-audio.mjs`。未以人工听感或 iPhone 实机验收。
- 即梦当前没有独立短音效模式，施法短音效仍为此前的本地合成，不属于此次即梦音乐产物。

## 序章原配乐

- 游戏资产：`music-academy-night.mp3`，69 秒、44.1 kHz、立体声、160 kbps，1,381,499 字节。
- iPhone 原生备用资产：`music-academy-night-aac.m4a`，同一配乐转码为 AAC-LC、44.1 kHz、立体声、128 kbps，1,161,119 字节；MP4 头部前置，便于尽早加载。完整解码与单声道混合已验证，单声道平均约 -17.8 dB、峰值约 -3.9 dB，无相位抵消成静音的情况。
- 来源：Dreamina / 即梦，`seed_music_1.0` 的 music 模式，2026-10-18 原创生成。
- 画布：https://jimeng.jianying.com/ai-tool/ai-canvas/0d85ba62-b312-471c-9409-c3b93eb31a97
- 原始资源 ID：`443e26ad-7a3d-4365-8769-efcc94d2ea95`。
- 创作意图：无歌词、克制管弦与木管、玻璃音色、低音弦乐的月夜魔法学院探索氛围；不引用已有作品旋律。
- 原始文件 75.0498 秒，末尾含静音。游戏版去除尾部并用 3 秒交叉淡化环接，再降低 3 dB，供解码后循环播放。
- 已验证：MP3 可完整解码、时长与声道、峰值约 -3.2 dB、无超过 0.2 秒的 -50 dB 静音段。
- 未验证：本次工具不提供可听辨的音频审听，未以人工听感验收风格或旋律接缝。
- 当前即梦 CLI 未开放真实短音效模式；此交付只有背景配乐，不包含施法音效。
- SHA256：`b11c60a7455de2861c4b1bc1442eb04916a7bacf0df3d30ab2d2ce9e69cc93df`。
