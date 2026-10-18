# Gothic Statue — Poly Haven

- Asset page: <https://polyhaven.com/a/gothic_statue>
- Author: **Benny Weimer** (all work), according to the official asset API.
- License: **CC0 1.0 Universal / Public Domain**. See the unmodified
  `LICENSE-CC0.txt` and <https://polyhaven.com/license>.
- Official metadata: <https://api.polyhaven.com/info/gothic_statue>
- Official file manifest: <https://api.polyhaven.com/files/gothic_statue>
- Downloaded and verified: **2026-10-16**.

This is the official **2K glTF** package, downloaded without alteration. All five
package files were checked against the MD5 hashes in Poly Haven's official file
manifest. Total package size: **11,119,654 bytes** (approximately 10.6 MiB).

## Loading

Entry point: `/models/gothic_statue/gothic_statue_2k.gltf`.

The package contains a robed, veiled, crowned stone figure with a book, sword,
chains, weathered folds and a detailed base. It has **27,739 triangles**, **23,314
vertices**, one material, and 2K diffuse, OpenGL normal and packed ARM maps.

Original bounds are approximately **1.4775 m wide × 1.7399 m tall × 1.5638 m deep**.
The glTF node includes an authored translation. Use a `THREE.Box3` to center X/Z,
scale by a desired height, then offset the minimum Y to the actual ground height.
Do not assume its model origin is centered or exactly at the feet. A height of
2.4–2.8 m is appropriate for a foreground guardian statue in the current scene.

The glTF uses the packed ARM image for metallic/roughness. It does **not** declare
an `occlusionTexture`; its red AO channel remains available if the scene author
wants to assign that texture as the material's `aoMap`. Preserve non-color space
for ARM and normal maps. Enable cast/receive shadows on the loaded mesh.

No source file in `src/` was changed to load this asset; scene placement is left
to the main implementation.
