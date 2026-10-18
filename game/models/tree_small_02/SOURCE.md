# Tree Small 02 — verified source and production LODs

- Original creator: **Rico Cilliers**, Poly Haven.
- Asset page: <https://polyhaven.com/a/tree_small_02>
- Official metadata: <https://api.polyhaven.com/info/tree_small_02>
- Official files: <https://api.polyhaven.com/files/tree_small_02>
- License: **CC0 1.0 Universal**, see `LICENSE-CC0.txt` and
  <https://polyhaven.com/license>.
- Downloaded and verified: 2026-10-16.

The complete official 1K source package (100,974,143 bytes) is retained under
`output/source-assets/tree_small_02`. Every original file was checked against the
official MD5. The API's polygon statistic is 4,652,585; the exported glTF index
buffers contain **2,062,487 triangles**.

The public package contains two derived glTF levels, sharing the **unmodified
official 1K PBR images**:

| Level | Triangles | Binary geometry |
| --- | ---: | ---: |
| Near | 219,677 | 12,624,004 bytes |
| Far | 23,671 | 1,478,772 bytes |

The browser loads these levels instead of the 95 MB source binary. Derivation uses
meshoptimizer 1.3.0 `simplifyWithAttributes` with normals and UV weights,
`Permissive` and `Prune`, followed by vertex compaction. Per-primitive error,
triangle counts and SHA-256 are recorded in `source-manifest.json`. The source
albedo, normals, UV mappings, proportions and object placement are preserved;
small topology details are reduced for real-time rendering.

Reproduce with `node output/asset-tools/build-tree-lods.mjs` from the project root.
Its meshoptimizer dependency is recorded in `output/asset-tools/package.json`.

Measured loaded bounds are approximately 4.556 m tall. Scene placement normalizes
the actual Box3 and uses two 7.2/7.6 m foreground trees and ten far LOD trees around
the perimeter. The central academy view and existing walking routes remain open.
